import { NextResponse } from "next/server";
import {
  formatZodError,
  openPrBranchesQuerySchema
} from "@/modules/prs/lib/open-pr/open-pr-validation";
import { listOpenPrBranches } from "@/modules/prs/lib/open-pr/open-pr-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = openPrBranchesQuerySchema.safeParse({
    repository: searchParams.get("repository") ?? ""
  });

  if (!parsed.success) {
    return NextResponse.json({ errors: formatZodError(parsed.error) }, { status: 400 });
  }

  const result = await listOpenPrBranches(parsed.data.repository);

  if (result.status === "unauthenticated") {
    return NextResponse.json({ error: result.message }, { status: 401 });
  }

  if (result.status === "error") {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  return NextResponse.json({
    branches: result.branches,
    githubLogin: result.githubLogin,
    branchSource: result.branchSource
  });
}
