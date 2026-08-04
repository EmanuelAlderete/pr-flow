export function formatDayCalendarTimeRange(
  startsAt: string,
  endsAt: string,
  allDay: boolean,
  timeZone: string
): string {
  if (allDay) {
    return "Dia todo";
  }

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const timeFormat = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit"
  });

  return `${timeFormat.format(start)} – ${timeFormat.format(end)}`;
}
