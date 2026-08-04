import { NextResponse } from "next/server";
import { getDayCalendar } from "@/modules/day-calendar/lib/day-calendar-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get("day") ?? undefined;
  const result = await getDayCalendar(day);

  if (result.status === "missing_config") {
    return NextResponse.json(result, { status: 503 });
  }

  if (result.status === "error") {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
