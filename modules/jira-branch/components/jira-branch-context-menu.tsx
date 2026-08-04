"use client";

import { useState } from "react";
import { GitBranch } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { JiraBranchWizardDialog } from "@/modules/jira-branch/components/jira-branch-wizard-dialog";

type Props = {
  issueKey: string;
  issueTypeName?: string;
  summary?: string;
  children: React.ReactNode;
};

export function JiraBranchContextMenu({
  issueKey,
  issueTypeName,
  summary,
  children
}: Props) {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setWizardOpen(true)}>
            <GitBranch className="size-4" aria-hidden />
            Criar branch com IA
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <JiraBranchWizardDialog
        issueKey={issueKey}
        issueTypeName={issueTypeName}
        summary={summary}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />
    </>
  );
}
