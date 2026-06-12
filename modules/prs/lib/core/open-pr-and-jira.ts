import { getJiraBrowseUrl } from "@/modules/prs/lib/core/jira-issue";

export interface OpenPrAndJiraInput {
  prUrl: string;
  jiraIssueKey: string | null;
}

let linkTargetCounter = 0;

function nextLinkTarget(): string {
  linkTargetCounter += 1;
  return `_pr_flow_tab_${linkTargetCounter}`;
}

/** Tenta devolver o foco para a aba atual após abrir outra (comportamento depende do navegador). */
function keepFocusOnCurrentTab(tab: Window | null): void {
  if (!tab) {
    return;
  }

  try {
    tab.opener = null;
  } catch {
    // Cross-origin: ignorar se o navegador bloquear.
  }

  if (typeof tab.blur === "function") {
    tab.blur();
  }

  if (typeof window.focus === "function") {
    window.focus();
  }
}

/** Dispara abertura em nova aba com target único (evita reutilizar a mesma aba). */
export function openUrlInNewTab(url: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const tab = window.open(url, nextLinkTarget());
  if (tab) {
    keepFocusOnCurrentTab(tab);
    return;
  }

  if (typeof document === "undefined") {
    return;
  }

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = nextLinkTarget();
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.focus();
}

export function openUrlsInNewTabs(urls: string[]): void {
  for (const url of urls) {
    openUrlInNewTab(url);
  }
}

export function openPrAndJiraLinks(
  input: OpenPrAndJiraInput,
  openUrl: (url: string) => void = openUrlInNewTab
): void {
  const urls = [input.prUrl];

  if (input.jiraIssueKey) {
    urls.push(getJiraBrowseUrl(input.jiraIssueKey));
  }

  for (const url of urls) {
    openUrl(url);
  }
}

export function getOpenPrAndJiraAriaLabel(jiraIssueKey: string | null): string {
  if (jiraIssueKey) {
    return `Abrir PR no GitHub e ${jiraIssueKey} no Jira`;
  }

  return "Abrir PR no GitHub";
}
