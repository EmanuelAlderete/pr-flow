import type { PrSlackShareInfo } from "@/modules/prs/lib/domain";
import { PrCardSlackIcon } from "@/modules/prs/components/pr-card-slack-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  slackShare: PrSlackShareInfo;
}

function formatSlackSharedAt(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

export function PrCardSlackSharedBadge({ slackShare }: Props) {
  const label = `Enviada ao Slack (#${slackShare.channel}) em ${formatSlackSharedAt(slackShare.sharedAt)}`;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span aria-label={label} className="pr-alert-icon pr-slack-shared-icon" role="img">
            <PrCardSlackIcon className="impediment-icon-svg" />
          </span>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
