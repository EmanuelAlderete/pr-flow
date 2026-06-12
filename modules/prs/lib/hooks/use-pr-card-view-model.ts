"use client";

import { useMemo } from "react";
import type { MonitoredPr } from "@/modules/prs/lib/domain";
import {
  getPrImpediments,
  hasSufficientApprovalsWithConflict,
  type PrImpediment
} from "@/modules/prs/lib/core/pr-impediments";
import { extractJiraIssueKey, resolvePrTitleHref } from "@/modules/prs/lib/core/jira-issue";

export interface PrCardViewModel {
  pendente: string[];
  solicitouAlteracoes: string[];
  avaliou: string[];
  statusGeral: MonitoredPr["statusGeral"];
  statusClass: string;
  statusLabel: string;
  shouldShowStatusPill: boolean;
  impediments: PrImpediment[];
  titleHref: string;
  jiraIssueKey: string | null;
  githubPrUrl: string;
}

function resolveStatusGeral(pr: MonitoredPr): MonitoredPr["statusGeral"] {
  const pendente = pr.pendente ?? pr.naoAvaliou ?? [];
  const solicitouAlteracoes = pr.solicitouAlteracoes ?? [];

  return (
    pr.statusGeral ??
    (pr.semReviewersSolicitados
      ? "no_reviewers"
      : solicitouAlteracoes.length > 0
        ? "changes_requested"
        : pendente.length > 0
          ? "pending_review"
          : "approved")
  );
}

export function usePrCardViewModel(pr: MonitoredPr): PrCardViewModel {
  return useMemo(() => {
    const pendente = pr.pendente ?? pr.naoAvaliou ?? [];
    const solicitouAlteracoes = pr.solicitouAlteracoes ?? [];
    const avaliou = pr.avaliou ?? [];
    const statusGeral = resolveStatusGeral(pr);

    const sufficientApprovalsWithConflict = hasSufficientApprovalsWithConflict({
      statusGeral,
      hasConflicts: pr.hasConflicts
    });

    const isApprovedBar =
      sufficientApprovalsWithConflict || pr.readyToMerge || statusGeral === "approved";
    const statusClass = isApprovedBar ? "status-approved" : "status-changes";

    const statusLabel = pr.readyToMerge
      ? "ready-to-merge"
      : statusGeral === "approved"
        ? "approved"
        : statusGeral === "changes_requested"
          ? "Alterações solicitadas"
          : statusGeral === "pending_review"
            ? "peding"
            : "Sem reviewers solicitados";

    const shouldShowStatusPill =
      (Boolean(pr.readyToMerge) || statusGeral === "changes_requested" || statusGeral === "approved") &&
      !sufficientApprovalsWithConflict;

    const impediments = getPrImpediments({
      statusGeral,
      hasConflicts: pr.hasConflicts,
      hasUnresolvedComments: pr.hasUnresolvedComments,
      pendingReviewersCount: pendente.length,
      requestedReviewersCount: pr.requestedReviewersCount ?? pendente.length,
      requestedChangesCount: solicitouAlteracoes.length
    });

    const jiraIssueKey = extractJiraIssueKey(pr.title);

    return {
      pendente,
      solicitouAlteracoes,
      avaliou,
      statusGeral,
      statusClass,
      statusLabel,
      shouldShowStatusPill,
      impediments,
      titleHref: resolvePrTitleHref(pr.title, pr.url),
      jiraIssueKey,
      githubPrUrl: pr.url
    };
  }, [pr]);
}
