import type { Entry } from "@/types/entry";

export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}m`;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

export function dayKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export function totalMinutes(entries: Entry[]) {
  return entries.reduce((total, entry) => total + entry.durationMinutes, 0);
}

export function longDate(value: string) {
  return new Intl.DateTimeFormat("en", { weekday: "long", day: "2-digit", month: "long" }).format(new Date(value));
}
