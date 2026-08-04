import type { ComponentType, SVGProps } from "react";
import type { ShortcutIconId } from "@/modules/shortcut-deck/lib/shortcut-deck-validation";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

function SlackIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.5 10V6.5a1.5 1.5 0 1 1 3 0V10" />
      <path d="M9.5 14v3.5a1.5 1.5 0 1 1-3 0V14" />
      <path d="M10 9.5H6.5a1.5 1.5 0 1 1 0-3H10" />
      <path d="M14 14.5h3.5a1.5 1.5 0 1 1 0 3H14" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </Svg>
  );
}

function GithubIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 19c-4.3 1.4-4.3-2.1-6-2.5" />
      <path d="M15 22v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.1-1.5 6.1-6.7A5.2 5.2 0 0 0 19 5.4a4.8 4.8 0 0 0-.1-3.5S17.7 1.6 15 3.4a11.4 11.4 0 0 0-6 0C6.3 1.6 5.2 1.9 5.2 1.9a4.8 4.8 0 0 0-.1 3.5A5.2 5.2 0 0 0 3.8 8.8c0 5.2 3.1 6.4 6.1 6.7a3.4 3.4 0 0 0-.9 2.6V22" />
    </Svg>
  );
}

function GitlabIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m12 20 4.5-13.5L14.5 4 12 10 9.5 4 7.5 6.5 12 20Z" />
      <path d="M7.5 6.5 3 16.5 12 20" />
      <path d="M16.5 6.5 21 16.5 12 20" />
    </Svg>
  );
}

function ArgoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v6" />
      <path d="m8 7 4 2 4-2" />
      <circle cx="12" cy="15" r="6" />
      <path d="M12 12v6" />
      <path d="m9.5 14.5 2.5 1.5 2.5-1.5" />
    </Svg>
  );
}

function AwsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 15c2 2.5 5.5 4 8 4s6-1.5 8-4" />
      <path d="M8 7h3l1 3 1-3h3" />
      <path d="M7 11h2.5" />
    </Svg>
  );
}

function ParameterStoreIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8" />
      <path d="M8 12h8" />
      <path d="M8 15h5" />
      <circle cx="16.5" cy="15" r="1.25" fill="currentColor" stroke="none" />
    </Svg>
  );
}

function JiraIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 4.5 10.5 12 18l7.5-7.5L12 3Z" />
      <path d="M12 8.5 8.5 12 12 15.5 15.5 12 12 8.5Z" />
    </Svg>
  );
}

function ConfluenceIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 17c3-6 6-8 12-10" />
      <path d="M18 7c-3 6-6 8-12 10" />
    </Svg>
  );
}

function GrafanaIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
      <path d="M8 5.5c1.5-1 3-1.5 4-1.5" />
    </Svg>
  );
}

function DockerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 13h14v3a4 4 0 0 1-4 4H9a6 6 0 0 1-6-6v-1Z" />
      <path d="M6 10h2v3H6z" />
      <path d="M9 10h2v3H9z" />
      <path d="M12 10h2v3h-2z" />
      <path d="M9 7h2v3H9z" />
      <path d="M12 7h2v3h-2z" />
      <path d="M17 13h3c1 0 2 .8 2 2" />
    </Svg>
  );
}

function KubernetesIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 4v3" />
      <path d="M12 17v3" />
      <path d="m6.5 7.5 2.2 2.2" />
      <path d="m15.3 14.3 2.2 2.2" />
      <path d="m17.5 7.5-2.2 2.2" />
      <path d="m8.7 14.3-2.2 2.2" />
      <path d="M4 12h3" />
      <path d="M17 12h3" />
    </Svg>
  );
}

function TerminalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="m7 10 3 2-3 2" />
      <path d="M12 14h5" />
    </Svg>
  );
}

function LinkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" />
    </Svg>
  );
}

const SHORTCUT_ICON_COMPONENTS: Record<ShortcutIconId, ComponentType<IconProps>> = {
  slack: SlackIcon,
  github: GithubIcon,
  gitlab: GitlabIcon,
  argo: ArgoIcon,
  aws: AwsIcon,
  "parameter-store": ParameterStoreIcon,
  jira: JiraIcon,
  confluence: ConfluenceIcon,
  grafana: GrafanaIcon,
  docker: DockerIcon,
  kubernetes: KubernetesIcon,
  terminal: TerminalIcon,
  link: LinkIcon
};

export const SHORTCUT_ICON_LABELS: Record<ShortcutIconId, string> = {
  slack: "Slack",
  github: "GitHub",
  gitlab: "GitLab",
  argo: "Argo",
  aws: "AWS",
  "parameter-store": "Parameter Store",
  jira: "Jira",
  confluence: "Confluence",
  grafana: "Grafana",
  docker: "Docker",
  kubernetes: "Kubernetes",
  terminal: "Terminal",
  link: "Link"
};

export function ShortcutIcon({
  iconId,
  className
}: {
  iconId: ShortcutIconId;
  className?: string;
}) {
  const Icon = SHORTCUT_ICON_COMPONENTS[iconId];
  return <Icon className={className ?? "size-4"} />;
}
