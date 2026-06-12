import { NextResponse } from "next/server";
import { listOpenPrRepositories } from "@/modules/prs/lib/open-pr/open-pr-service";

export async function GET() {
  const result = await listOpenPrRepositories();

  if (result.status === "error") {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ repositories: result.repositories });
}
