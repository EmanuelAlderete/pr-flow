"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { WorkContextDialog } from "@/modules/work-context/components/work-context-dialog";
import { normalizeJiraIssueKey } from "@/modules/jira-issue-key";

type WorkContextContextValue = {
  openWorkContext: (issueKey: string) => void;
};

const WorkContextContext = createContext<WorkContextContextValue | null>(null);

export function WorkContextProvider({ children }: { children: ReactNode }) {
  const [issueKey, setIssueKey] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const openWorkContext = useCallback((rawKey: string) => {
    const normalized = normalizeJiraIssueKey(rawKey);
    if (!normalized) {
      return;
    }
    setIssueKey(normalized);
    setOpen(true);
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setIssueKey(null);
    }
  }, []);

  const value = useMemo(() => ({ openWorkContext }), [openWorkContext]);

  return (
    <WorkContextContext.Provider value={value}>
      {children}
      {issueKey ? (
        <WorkContextDialog issueKey={issueKey} open={open} onOpenChange={handleOpenChange} />
      ) : null}
    </WorkContextContext.Provider>
  );
}

export function useWorkContext(): WorkContextContextValue {
  const context = useContext(WorkContextContext);
  if (!context) {
    throw new Error("useWorkContext deve ser usado dentro de WorkContextProvider.");
  }
  return context;
}
