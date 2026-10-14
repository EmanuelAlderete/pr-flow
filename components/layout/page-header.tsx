import type { ReactNode } from "react";
import { HelpHint } from "@/components/ui/help-hint";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--app-text)]">{title}</h1>
        {description ? <HelpHint side="bottom">{description}</HelpHint> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
