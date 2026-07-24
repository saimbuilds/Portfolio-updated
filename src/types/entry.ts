export const categories = ["build", "learn", "read", "outreach", "reflect", "life"] as const;

export type Category = (typeof categories)[number];

export type Entry = {
  id: string;
  startedAt: string;
  durationMinutes: number;
  category: Category;
  title: string;
  detail: string;
  evidenceUrl?: string;
  isSample?: boolean;
  createdAt: string;
};
