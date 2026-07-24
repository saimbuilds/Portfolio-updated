import { promises as fs } from "fs";
import path from "path";
import type { Entry } from "@/types/entry";
import { hasSupabase, supabaseAdmin } from "@/lib/supabase";

const dataPath = path.join(process.cwd(), "data", "entries.json");

function fromRow(row: Record<string, unknown>): Entry {
  return {
    id: String(row.id), startedAt: String(row.started_at), endedAt: row.ended_at ? String(row.ended_at) : undefined,
    plannedMinutes: row.planned_minutes == null ? undefined : Number(row.planned_minutes), durationMinutes: Number(row.duration_minutes || 0),
    category: row.category as Entry["category"], title: String(row.title), detail: String(row.detail || ""), reflection: String(row.reflection || ""),
    evidenceUrls: (row.evidence_urls as string[]) || [], status: row.status as Entry["status"], isPublic: Boolean(row.is_public), createdAt: String(row.created_at),
  };
}

function toRow(entry: Entry) {
  return { id: entry.id, started_at: entry.startedAt, ended_at: entry.endedAt || null, planned_minutes: entry.plannedMinutes || null,
    duration_minutes: entry.durationMinutes, category: entry.category, title: entry.title, detail: entry.detail, reflection: entry.reflection || "",
    evidence_urls: entry.evidenceUrls || (entry.evidenceUrl ? [entry.evidenceUrl] : []), status: entry.status || "completed",
    is_public: entry.isPublic ?? true, created_at: entry.createdAt };
}

async function ensureStore() {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  try { await fs.access(dataPath); } catch { await fs.writeFile(dataPath, "[]", "utf8"); }
}

export async function getEntries(options: { includePrivate?: boolean } = {}): Promise<Entry[]> {
  if (hasSupabase()) {
    let query = supabaseAdmin().from("sessions").select("*").order("started_at", { ascending: false });
    if (!options.includePrivate) query = query.eq("is_public", true).neq("status", "active");
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(fromRow);
  }
  await ensureStore();
  const rows = JSON.parse(await fs.readFile(dataPath, "utf8")) as Entry[];
  return rows.filter((entry) => options.includePrivate || ((entry.isPublic ?? true) && entry.status !== "active"))
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export async function createEntry(entry: Entry) {
  if (hasSupabase()) {
    const { error } = await supabaseAdmin().from("sessions").insert(toRow(entry));
    if (error) throw error;
    return;
  }
  const entries = await getEntries({ includePrivate: true });
  await saveEntries([entry, ...entries]);
}

export async function updateEntry(id: string, patch: Partial<Entry>) {
  const entries = await getEntries({ includePrivate: true });
  const current = entries.find((entry) => entry.id === id);
  if (!current) return null;
  const next = { ...current, ...patch };
  if (hasSupabase()) {
    const { error } = await supabaseAdmin().from("sessions").update(toRow(next)).eq("id", id);
    if (error) throw error;
  } else await saveEntries(entries.map((entry) => entry.id === id ? next : entry));
  return next;
}

export async function deleteEntry(id: string) {
  if (hasSupabase()) {
    const { error } = await supabaseAdmin().from("sessions").delete().eq("id", id);
    if (error) throw error;
  } else await saveEntries((await getEntries({ includePrivate: true })).filter((entry) => entry.id !== id));
}

export async function saveEntries(entries: Entry[]) {
  await ensureStore();
  await fs.writeFile(dataPath, JSON.stringify(entries, null, 2) + "\n", "utf8");
}
