interface Props {
  login: string;
  reviewed: boolean;
}

export function ReviewerListItem({ login, reviewed }: Props) {
  return (
    <li className="reviewer-row">
      <span
        aria-hidden
        className={`reviewer-status-pin ${reviewed ? "reviewer-status-pin--reviewed" : "reviewer-status-pin--pending"}`}
      />
      {login}
    </li>
  );
}
