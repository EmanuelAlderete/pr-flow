function pluralize(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function formatPrOpenDuration(createdAt: string, now: Date = new Date()) {
  const openedAt = Date.parse(createdAt);
  if (Number.isNaN(openedAt)) {
    return "aberta há tempo indeterminado";
  }

  let totalSeconds = Math.max(0, Math.floor((now.getTime() - openedAt) / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  totalSeconds %= 86_400;
  const hours = Math.floor(totalSeconds / 3_600);
  totalSeconds %= 3_600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `aberta há ${pluralize(days, "dia", "dias")}`;
  }
  if (hours > 0) {
    return `aberta há ${pluralize(hours, "hora", "horas")}`;
  }
  if (minutes > 0) {
    return `aberta há ${pluralize(minutes, "minuto", "minutos")}`;
  }

  return `aberta há ${pluralize(seconds, "segundo", "segundos")}`;
}
