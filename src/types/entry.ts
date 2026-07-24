export const categories = ["build", "read", "watch"] as const;
export type Category = (typeof categories)[number];

export const entryStatuses = ["active", "completed", "interrupted"] as const;
export type EntryStatus = (typeof entryStatuses)[number];

export type Entry = {
  id: string;
  startedAt: string;
  endedAt?: string;
  plannedMinutes?: number;
  durationMinutes: number;
  category: Category;
  title: string;
  detail: string;
  reflection?: string;
  evidenceUrl?: string;
  evidenceUrls?: string[];
  status?: EntryStatus;
  isPublic?: boolean;
  isSample?: boolean;
  createdAt: string;
};

export type Goal = {
  id: string;
  title: string;
  metric: "minutes" | "count" | "checklist" | "streak";
  target: number;
  current: number;
  period: "week" | "month" | "year" | "custom";
  category?: Category;
  deadline?: string;
  isPublic: boolean;
  createdAt: string;
};
