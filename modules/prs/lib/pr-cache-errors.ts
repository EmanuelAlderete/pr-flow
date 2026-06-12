export class PrCacheNotReadyError extends Error {
  constructor(
    message = "Dados do GitHub ainda não foram sincronizados. Aguarde alguns instantes ou use o botão de sincronizar."
  ) {
    super(message);
    this.name = "PrCacheNotReadyError";
  }
}
