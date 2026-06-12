import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { appSettings } from "@/modules/app/lib/schema";
import { notes } from "@/modules/journal/lib/schema";
import {
  jiraIssueDetails,
  jiraIssuesCache,
  jiraSprintsCache,
  jiraSyncMeta
} from "@/modules/jira/lib/schema";
import {
  prMonitorCache,
  prReviewContextCache,
  prReviewerQueueCache,
  prSyncMeta,
  prTimelineEvents
} from "@/modules/prs/lib/schema";
import { summaries } from "@/modules/summaries/lib/schema";
import { tasks } from "@/modules/tasks/lib/schema";

const schema = {
  tasks,
  notes,
  appSettings,
  summaries,
  jiraSyncMeta,
  jiraSprintsCache,
  jiraIssuesCache,
  jiraIssueDetails,
  prSyncMeta,
  prMonitorCache,
  prReviewerQueueCache,
  prReviewContextCache,
  prTimelineEvents
};

let client: ReturnType<typeof postgres> | null = null;
let database: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!client) {
    client = postgres(url, { max: 1 });
    database = drizzle(client, { schema });
  }

  return database!;
}

export async function closeDb() {
  if (client) {
    await client.end();
    client = null;
    database = null;
  }
}
