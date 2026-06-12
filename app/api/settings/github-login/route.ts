import { NextResponse } from "next/server";
import { getGithubLogin } from "@/modules/app/lib/github-login-repository";

export async function GET() {
  try {
    const githubLogin = await getGithubLogin();
    return NextResponse.json({ githubLogin });
  } catch {
    return NextResponse.json({ githubLogin: null }, { status: 503 });
  }
}
