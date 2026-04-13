import type { WebHookEvent, WebHookEventType } from "../../types/WebhookCollection";
import { pushMessage } from "../../utils/bot";
import { readRuntimeEnv } from "../../utils/config";
import { genWebhookMessage, getWebhookPreviewImage } from "../../utils/text";

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

const WEBHOOK_TYPES: ReadonlySet<WebHookEventType> = new Set([
  "say",
  "collection",
  "ep",
  "mono",
  "friend",
  "group",
  "catalog",
]);

function isWebhook(value: unknown): value is WebHookEvent {
  if (!value || typeof value !== "object") return false;

  const body = value as Record<string, unknown>;
  if (typeof body.type !== "string") return false;
  if (!WEBHOOK_TYPES.has(body.type as WebHookEventType)) return false;

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

  if (!isWebhook(body)) {
    return jsonResponse({
      ok: true,
      pushed: false,
      message: "Unsupported or invalid webhook payload.",
    });
  }

  try {
    const bgmCover = getWebhookPreviewImage(body);
    const message = await pushMessage(
      genWebhookMessage(body, runtimeEnv.NICKNAME),
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
