"use client";

import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ptBR } from "@/modules/messages/pt-BR";

type HelpHintProps = {
  children: ReactNode;
  className?: string;
  /** Accessible name for the trigger; defaults to shared pt-BR label. */
  label?: string;
  side?: "top" | "bottom" | "left" | "right";
};

/**
 * Quiet info affordance for explanatory copy that would otherwise sit under a title.
 * Prefer this over always-visible helper paragraphs on dense widgets and page headers.
 * Keep empty states, live status, and errors as visible text.
 */
export function HelpHint({
  children,
  className,
  label = ptBR.helpHint.ariaLabel,
  side = "top"
}: HelpHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            className={cn(
              "inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-[var(--app-text-muted)]",
              "transition-colors hover:text-[var(--app-text)]",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              className
            )}
          >
            <CircleHelp className="size-3.5" aria-hidden />
          </button>
        }
      />
      <TooltipContent side={side} className="max-w-xs text-left leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
