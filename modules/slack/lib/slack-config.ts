export const SLACK_PR_CHANNEL_DEFAULT = "squad-jornada-pr";

export function getSlackBotToken(): string | null {
  const token = process.env.SLACK_BOT_OAUTH_TOKEN?.trim();
  return token ? token : null;
}

export function getSlackPrChannel(): string {
  const fromEnv = process.env.SLACK_PR_CHANNEL?.trim();
  return fromEnv || SLACK_PR_CHANNEL_DEFAULT;
}

export function isSlackConfigured(): boolean {
  return Boolean(getSlackBotToken());
}

export function getSlackBotTokenOrThrow(): string {
  const token = getSlackBotToken();
  if (!token) {
    throw new SlackConfigError(
      "Configure SLACK_BOT_OAUTH_TOKEN no .env para enviar mensagens ao Slack."
    );
  }
  return token;
}

export class SlackConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlackConfigError";
  }
}
