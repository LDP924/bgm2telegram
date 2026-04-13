import type { WebHookCollection } from "../../types/WebhookCollection";
import { pushMessage } from "../../utils/bot";
import { readRuntimeEnv } from "../../utils/config";
import { genFullMessage, getBangumiImage } from "../../utils/text";

type PagesFunctionContext = {
  request: Request;
  env: Record<string, unknown>;
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
    },
  });
}

function isCollectionWebhook(value: unknown): value is WebHookCollection {
  if (!value || typeof value !== "object") return false;

  const body = value as Record<string, unknown>;
  if (body.type !== "collection") return false;

  if (!body.data || typeof body.data !== "object") return false;

  return true;
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function onRequest(context: PagesFunctionContext): Promise<Response> {
  if (context.request.method !== "POST") {
    return jsonResponse(
      {
        ok: false,
        message: "Only accept POST request.",
      },
      405,
    );
  }

  let runtimeEnv: ReturnType<typeof readRuntimeEnv>;

  try {
    runtimeEnv = readRuntimeEnv(context.env);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        message: formatError(error),
      },
      500,
    );
  }

  const url = new URL(context.request.url);

  if (url.searchParams.get("key") !== runtimeEnv.AUTH_KEY) {
    return jsonResponse(
      {
        ok: false,
        message: "Request Unauthorized.",
      },
      401,
    );
  }

  let body: unknown;

  try {
    body = await context.request.json();
  } catch {
    return jsonResponse(
      {
        ok: false,
        message: "Invalid JSON body.",
      },
      400,
    );
  }

  if (!isCollectionWebhook(body)) {
    return jsonResponse({
      ok: true,
      pushed: false,
      message: "Only accept collection webhook for now.",
    });
  }

  try {
    const bgmCover = getBangumiImage(body);
    const message = await pushMessage(
      genFullMessage(body, runtimeEnv.NICKNAME),
      runtimeEnv,
      bgmCover,
    );

    if (message.ok && message.result?.message_id) {
      return jsonResponse({
        ok: true,
        pushed: true,
      });
    }

    const failureReason = !message.ok ? message.description : undefined;

    return jsonResponse({
      ok: true,
      pushed: false,
      message: "Push failed: " + (failureReason || "Unknown Telegram error."),
    });
  } catch (error) {
    return jsonResponse({
      ok: true,
      pushed: false,
      message: "Push failed: " + formatError(error),
    });
  }
}
