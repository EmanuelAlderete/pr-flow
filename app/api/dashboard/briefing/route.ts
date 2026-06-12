import { NextResponse } from "next/server";
import { getDashboardBriefing } from "@/modules/dashboard/lib/dashboard-briefing-service";
import type { DashboardBriefingResponse } from "@/modules/dashboard/lib/dashboard-briefing-types";

function dayFromRequest(request: Request): string | undefined {
  const { searchParams } = new URL(request.url);
  return searchParams.get("day") ?? undefined;
}

function jsonForResult(result: DashboardBriefingResponse) {
  if (result.status === "missing_api_key") {
    return NextResponse.json(result, { status: 503 });
  }

  if (result.status === "rate_limited") {
    return NextResponse.json(result, { status: 429 });
  }

  if (result.status === "no_input") {
    return NextResponse.json(result, { status: 422 });
  }

  if (result.status === "error") {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function GET(request: Request) {
  const result = await getDashboardBriefing(dayFromRequest(request));
  return jsonForResult(result);
}
