import type { ImpedimentIconKind } from "@/modules/prs/lib/core/pr-impediments";

interface Props {
  kind: ImpedimentIconKind;
}

const iconProps = {
  "aria-hidden": true,
  className: "impediment-icon-svg",
  fill: "none",
  viewBox: "0 0 24 24",
  xmlns: "http://www.w3.org/2000/svg"
} as const;

export function ImpedimentIcon({ kind }: Props) {
  switch (kind) {
    case "conflicts":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
      );
    case "unresolved-comments":
      return (
        <svg {...iconProps}>
          <path
            d="M7 8h10M7 12h6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3a2 2 0 0 1-2-2V5z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      );
    case "changes-requested":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8v4.5M12 16h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
      );
    case "pending-reviews":
    case "pending-review":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      );
    case "sufficient-approvals":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path
            d="M8 12.5l2.2 2.2L16.5 8.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      );
  }
}
