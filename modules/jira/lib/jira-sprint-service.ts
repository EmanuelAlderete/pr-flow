import { jiraAgileFetch } from "@/modules/jira/lib/jira-agile-client";
import {
  getJiraSprintBoardIdOverride,
  getJiraSprintProjectKey
} from "@/modules/jira/lib/jira-config";
import { JiraApiError } from "@/modules/jira/lib/jira-errors";
import type { JiraSprintDto, JiraSprintsResponse } from "@/modules/jira/lib/domain";

type JiraBoard = {
  id: number;
  name: string;
  type: string;
};

type JiraBoardListResponse = {
  values: JiraBoard[];
};

type JiraSprintApi = {
  id: number;
  name: string;
  state: "active" | "future" | "closed";
  startDate?: string;
  endDate?: string;
};

type JiraSprintListResponse = {
  values: JiraSprintApi[];
};

const SPRINT_STATE_ORDER: Record<JiraSprintDto["state"], number> = {
  active: 0,
  future: 1,
  closed: 2
};

function mapSprint(sprint: JiraSprintApi): JiraSprintDto {
  return {
    id: sprint.id,
    name: sprint.name,
    state: sprint.state,
    startDate: sprint.startDate ?? null,
    endDate: sprint.endDate ?? null
  };
}

function sortSprints(a: JiraSprintDto, b: JiraSprintDto): number {
  const stateDiff = SPRINT_STATE_ORDER[a.state] - SPRINT_STATE_ORDER[b.state];
  if (stateDiff !== 0) {
    return stateDiff;
  }

  const aEnd = a.endDate ? Date.parse(a.endDate) : 0;
  const bEnd = b.endDate ? Date.parse(b.endDate) : 0;
  return bEnd - aEnd;
}

export async function resolveSprintBoard(): Promise<{ boardId: number; boardName: string }> {
  const override = getJiraSprintBoardIdOverride();
  if (override) {
    const board = await jiraAgileFetch<JiraBoard>(`/board/${override}`);
    return { boardId: board.id, boardName: board.name };
  }

  const projectKey = getJiraSprintProjectKey();
  const boards = await jiraAgileFetch<JiraBoardListResponse>(
    `/board?projectKeyOrId=${encodeURIComponent(projectKey)}`
  );

  const scrumBoard = boards.values.find((board) => board.type === "scrum") ?? boards.values[0];
  if (!scrumBoard) {
    throw new JiraApiError(`Nenhum board encontrado para o projeto ${projectKey}.`, 404);
  }

  return { boardId: scrumBoard.id, boardName: scrumBoard.name };
}

export async function fetchJiraSprints(maxResults = 50): Promise<JiraSprintsResponse> {
  const { boardId, boardName } = await resolveSprintBoard();

  const payload = await jiraAgileFetch<JiraSprintListResponse>(
    `/board/${boardId}/sprint?state=active,future,closed&maxResults=${maxResults}`
  );

  const sprints = (payload.values ?? []).map(mapSprint).sort(sortSprints);

  return {
    boardId,
    boardName,
    projectKey: getJiraSprintProjectKey(),
    sprints,
    cachedAt: null
  };
}
