import type { Entry } from "@/types/entry";

export const RECORD_START = "2026-07-25";
export const RECORD_TIME_ZONE = "Asia/Karachi";
export const DAY_START_HOUR = 0;

export function formatMinutes(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (!hours) return `${mins}m`;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

/** Public record days follow normal Pakistan calendar days: 00:00–23:59 PKT. */
export function dayKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  const pakistan = new Date(date.getTime() + 5 * 60 * 60 * 1000);
  pakistan.setUTCHours(pakistan.getUTCHours() - DAY_START_HOUR);
  return pakistan.toISOString().slice(0, 10);
}

export function totalMinutes(entries: Entry[]) {
  return entries.reduce((total, entry) => total + (entry.status === "active" ? elapsedMinutes(entry.startedAt) : entry.durationMinutes), 0);
}

export function elapsedMinutes(startedAt: string, endedAt = new Date().toISOString()) {
  return Math.max(0, Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000));
}

export function longDate(value: string) {
  return new Intl.DateTimeFormat("en", { weekday: "long", day: "2-digit", month: "long", timeZone: RECORD_TIME_ZONE }).format(new Date(value));
}

export function recordDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: RECORD_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(typeof value === "string" ? new Date(value) : value);
}
