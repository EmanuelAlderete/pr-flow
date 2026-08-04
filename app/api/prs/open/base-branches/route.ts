import { NextResponse } from "next/server";
import {
  formatZodError,
  openPrBaseBranchesQuerySchema
} from "@/modules/prs/lib/open-pr/open-pr-validation";
import { listOpenPrBaseBranches } from "@/modules/prs/lib/open-pr/open-pr-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = openPrBaseBranchesQuerySchema.safeParse({
    repository: searchParams.get("repository") ?? ""
  });

  if (!parsed.success) {
    return NextResponse.json({ errors: formatZodError(parsed.error) }, { status: 400 });
  }

  const result = await listOpenPrBaseBranches(parsed.data.repository);

  if (result.status === "unauthenticated") {
    return NextResponse.json({ error: result.message }, { status: 401 });
  }

  if (result.status === "error") {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  return NextResponse.json({
    defaultBranch: result.defaultBranch,
    baseBranches: result.baseBranches
  });
}
