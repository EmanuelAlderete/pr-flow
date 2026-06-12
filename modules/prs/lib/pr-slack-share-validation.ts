import { z } from "zod";

const prSlackShareRecordSchema = z.object({
  url: z.string().url("URL da PR inválida."),
  prId: z.string().trim().min(1).optional()
});

export const prSlackShareBodySchema = z
  .object({
    title: z.string().trim().min(1, "Título da PR é obrigatório."),
    url: z.string().url("URL da PR inválida."),
    prId: z.string().trim().min(1).optional(),
    selectedPrUrls: z.array(z.string().url("URL da PR inválida.")).min(1).optional(),
    prRecords: z.array(prSlackShareRecordSchema).min(1).optional()
  })
  .transform((body) => {
    const selectedPrUrls = body.selectedPrUrls ?? [body.url];
    const uniqueUrls = [...new Set(selectedPrUrls)];
    const recordsByUrl = new Map(
      (body.prRecords ?? [{ url: body.url, prId: body.prId }]).map((record) => [record.url, record.prId ?? null])
    );

    return {
      title: body.title,
      url: body.url,
      prId: body.prId ?? null,
      selectedPrUrls: uniqueUrls,
      prRecords: uniqueUrls.map((url) => ({
        url,
        prId: recordsByUrl.get(url) ?? (url === body.url ? (body.prId ?? null) : null)
      }))
    };
  });

export type PrSlackShareBody = z.infer<typeof prSlackShareBodySchema>;
