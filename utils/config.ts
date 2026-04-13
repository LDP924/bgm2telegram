export type RuntimeEnv = {
  BOT_TOKEN: string;
  PUSH_CHANNEL: string;
  AUTH_KEY: string;
  NICKNAME?: string;
};

function readEnvValue(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];

  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  return trimmed;
}

function readRequired(source: Record<string, unknown>, key: keyof RuntimeEnv): string {
  const value = readEnvValue(source, key);
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }

  return value;
}

export function readRuntimeEnv(source: Record<string, unknown>): RuntimeEnv {
  const env: RuntimeEnv = {
    BOT_TOKEN: readRequired(source, "BOT_TOKEN"),
    PUSH_CHANNEL: readRequired(source, "PUSH_CHANNEL"),
    AUTH_KEY: readRequired(source, "AUTH_KEY"),
  };

  const nickname = readEnvValue(source, "NICKNAME");
  if (nickname) {
    env.NICKNAME = nickname;
  }

  return env;
}
