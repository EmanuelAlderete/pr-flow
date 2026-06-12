import {
  getMetricsContentType,
  getMetricsText
} from "@/modules/observability/lib/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const body = await getMetricsText();

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": getMetricsContentType(),
      "Cache-Control": "no-store"
    }
  });
}
