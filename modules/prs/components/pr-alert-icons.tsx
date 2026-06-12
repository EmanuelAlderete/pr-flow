import type { PrImpediment } from "@/modules/prs/lib/core/pr-impediments";
import { ImpedimentIcon } from "@/modules/prs/components/impediment-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  impediments: PrImpediment[];
}

export function PrAlertIcons({ impediments }: Props) {
  if (impediments.length === 0) {
    return null;
  }

  return (
    <div aria-label="Alertas da PR" className="pr-alert-icons">
      {impediments.map((impediment) => (
        <Tooltip key={impediment.key}>
          <TooltipTrigger
            render={
              <button aria-label={impediment.label} className="pr-alert-icon danger" type="button">
                <ImpedimentIcon kind={impediment.icon} />
              </button>
            }
          />
          <TooltipContent>{impediment.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
