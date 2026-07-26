import type { Entry, Goal } from "@/types/entry";

export function computeGoalProgress(goal: Goal, entries: Entry[]): number {
  const now = new Date();
  let startDate = new Date();

  if (goal.period === "week") {
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    startDate = new Date(now);
    startDate.setDate(now.getDate() + diff);
    startDate.setHours(0, 0, 0, 0);
  } else if (goal.period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (goal.period === "year") {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else if (goal.deadline) {
    startDate = new Date(goal.createdAt);
  } else {
    startDate = new Date(0);
  }

  const validEntries = entries.filter((entry) => {
    if (entry.isSample || entry.status === "active") return false;
    const entryDate = new Date(entry.startedAt);
    if (entryDate < startDate) return false;
    if (goal.category && entry.category !== goal.category) return false;
    return true;
  });

  if (goal.metric === "minutes") {
    return validEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
  } else if (goal.metric === "count") {
    return validEntries.length;
  } else if (goal.metric === "streak") {
    const uniqueDays = new Set(validEntries.map((e) => e.startedAt.slice(0, 10)));
    return uniqueDays.size;
  } else {
    return goal.current || 0;
  }
}
