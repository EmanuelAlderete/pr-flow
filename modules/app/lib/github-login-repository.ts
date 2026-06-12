import { eq } from "drizzle-orm";
import { getDb } from "@/modules/db/lib/db";
import { appSettings } from "@/modules/app/lib/schema";

const SETTINGS_ID = "default";

export async function getGithubLogin(): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({ githubLogin: appSettings.githubLogin })
    .from(appSettings)
    .where(eq(appSettings.id, SETTINGS_ID))
    .limit(1);

  return rows[0]?.githubLogin ?? null;
}

export async function saveGithubLogin(githubLogin: string): Promise<void> {
  const trimmed = githubLogin.trim();
  if (!trimmed) {
    return;
  }

  const db = getDb();
  const now = new Date();

  await db
    .insert(appSettings)
    .values({
      id: SETTINGS_ID,
      githubLogin: trimmed,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        githubLogin: trimmed,
        updatedAt: now
      }
    });
}
