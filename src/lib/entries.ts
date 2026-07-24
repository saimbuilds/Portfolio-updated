import { promises as fs } from "fs";
import path from "path";
import type { Entry } from "@/types/entry";

const dataPath = path.join(process.cwd(), "data", "entries.json");

async function ensureStore() {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  try { await fs.access(dataPath); } catch { await fs.writeFile(dataPath, "[]", "utf8"); }
}

export async function getEntries(): Promise<Entry[]> {
  await ensureStore();
  const raw = await fs.readFile(dataPath, "utf8");
  return (JSON.parse(raw) as Entry[]).sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}

export async function saveEntries(entries: Entry[]) {
  await ensureStore();
  await fs.writeFile(dataPath, JSON.stringify(entries, null, 2) + "\n", "utf8");
}
