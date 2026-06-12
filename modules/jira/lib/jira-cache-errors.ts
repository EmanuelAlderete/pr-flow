export class JiraCacheNotReadyError extends Error {
  constructor(
    message = "Dados do Jira ainda não foram sincronizados. Aguarde alguns instantes ou verifique a cron."
  ) {
    super(message);
    this.name = "JiraCacheNotReadyError";
  }
}
