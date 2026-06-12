import type { MonitoredPr } from "@/modules/prs/lib/domain";

function normalizeSearchTerm(term: string) {
  return term.trim().toLowerCase();
}

function collectSearchableValues(pr: MonitoredPr) {
  return [
    pr.title,
    String(pr.number),
    pr.repository,
    ...pr.avaliou,
    ...pr.naoAvaliou,
    ...pr.aprovou,
    ...pr.solicitouAlteracoes,
    ...pr.pendente
  ];
}

export function matchesPrSearch(pr: MonitoredPr, rawTerm: string) {
  const term = normalizeSearchTerm(rawTerm);
  if (!term) {
    return true;
  }

  return collectSearchableValues(pr).some((value) => value.toLowerCase().includes(term));
}

export function filterPrsBySearch(prs: MonitoredPr[], rawTerm: string) {
  return prs.filter((pr) => matchesPrSearch(pr, rawTerm));
}
