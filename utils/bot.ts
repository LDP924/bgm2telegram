import type { RuntimeEnv } from "./config";

type TelegramSendMessageOk = {
  ok: true;
  result: {
    message_id: number;
  };
};

type TelegramSendMessageError = {
  ok: false;
  description?: string;
};

type TelegramSendMessageResponse = TelegramSendMessageOk | TelegramSendMessageError;

export async function pushMessage(
  message: string,
  env: RuntimeEnv,
  preview_img?: string,
): Promise<TelegramSendMessageResponse> {
  const payload: Record<string, unknown> = {
    chat_id: env.PUSH_CHANNEL,
    text: message,
    parse_mode: "HTML",
  };

  if (preview_img) {
    payload.link_preview_options = {
      url: preview_img,
    };
  }

  const response = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let result: unknown;

  try {
    result = await response.json();
  } catch {
    throw new Error(`Telegram API returned non-JSON response (HTTP ${response.status}).`);
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !("ok" in result) ||
    typeof (result as { ok: unknown }).ok !== "boolean"
  ) {
    throw new Error("Telegram API returned unexpected response shape.");
  }

  const parsed = result as TelegramSendMessageResponse;

  if (!response.ok && parsed.ok) {
    return {
      ok: false,
      description: `Telegram API HTTP ${response.status}`,
    };
  }

  return parsed;
}
