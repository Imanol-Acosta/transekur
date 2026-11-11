const timeZone = "America/Santo_Domingo";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function dominicanDay(now = new Date()) {
  const parts = dayFormatter.formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function dateLabel(date: string, style: "long" | "short" = "long") {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    ...(style === "long" ? { weekday: "long", month: "long", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" }),
  }).format(new Date(`${date}T12:00:00Z`));
}

export function pickupTimeLabel(time: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(`2000-01-01T${time}:00Z`));
}

export function sentTimeLabel(instant: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(instant));
}
