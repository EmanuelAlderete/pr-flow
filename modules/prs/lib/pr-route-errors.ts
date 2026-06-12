import { NextResponse } from "next/server";
import { PrCacheNotReadyError } from "@/modules/prs/lib/pr-cache-errors";

export function prErrorResponse(error: unknown, fallbackMessage: string): NextResponse {
  if (error instanceof PrCacheNotReadyError) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { status: "error", message: fallbackMessage },
    { status: 500 }
  );
}
