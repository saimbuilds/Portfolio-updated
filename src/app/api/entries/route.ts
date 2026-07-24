import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createEntry, deleteEntry, getEntries, updateEntry } from "@/lib/entries";
import { hasSupabase, isOwnerToken } from "@/lib/supabase";
import { categories, entryStatuses, type Entry } from "@/types/entry";
import { dayKey, elapsedMinutes, RECORD_START } from "@/lib/format";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  action: z.enum(["manual", "start"]).default("manual"),
  startedAt: z.string().datetime(), plannedMinutes: z.number().int().min(1).max(120).optional(),
  durationMinutes: z.number().int().min(0).max(120).default(0), category: z.enum(categories),
  title: z.string().trim().min(2).max(100), detail: z.string().trim().max(1000).default(""),
  reflection: z.string().trim().max(1200).default(""), evidenceUrls: z.array(z.string().min(1).max(500)).max(8).default([]),
  isPublic: z.boolean().default(false),
});

const patchSchema = z.object({
  id: z.string().uuid(), action: z.enum(["finish", "publish", "unpublish", "edit"]),
  status: z.enum(entryStatuses).optional(), title: z.string().trim().min(2).max(100).optional(),
  detail: z.string().trim().max(1000).optional(), reflection: z.string().trim().max(1200).optional(),
  evidenceUrls: z.array(z.string().min(1).max(500)).max(8).optional(),
});

async function canWrite(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (await isOwnerToken(bearer)) return true;
  const key = process.env.ADMIN_KEY;
  return !hasSupabase() && Boolean(key && request.headers.get("x-admin-key") === key);
}

export async function GET(request: NextRequest) {
  const includePrivate = request.nextUrl.searchParams.get("private") === "1" && await canWrite(request);
  return NextResponse.json(await getEntries({ includePrivate }));
}

export async function POST(request: NextRequest) {
  if (!await canWrite(request)) return NextResponse.json({ error: "Owner authentication required." }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  if (dayKey(parsed.data.startedAt) < RECORD_START) return NextResponse.json({ error: `The record begins on ${RECORD_START}.` }, { status: 400 });
  const active = parsed.data.action === "start";
  const entry: Entry = { ...parsed.data, id: crypto.randomUUID(), durationMinutes: active ? 0 : parsed.data.durationMinutes,
    status: active ? "active" : "completed", isPublic: active ? false : parsed.data.isPublic, createdAt: new Date().toISOString() };
  await createEntry(entry);
  return NextResponse.json(entry, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!await canWrite(request)) return NextResponse.json({ error: "Owner authentication required." }, { status: 401 });
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const entries = await getEntries({ includePrivate: true });
  const current = entries.find((entry) => entry.id === parsed.data.id);
  if (!current) return NextResponse.json({ error: "Session not found." }, { status: 404 });
  let patch: Partial<Entry> = {};
  if (parsed.data.action === "finish") {
    if (current.status !== "active") return NextResponse.json({ error: "Session is already closed." }, { status: 409 });
    const endedAt = new Date().toISOString();
    const durationMinutes = elapsedMinutes(current.startedAt, endedAt);
    const completed = durationMinutes >= (current.plannedMinutes || 0);
    patch = { endedAt, durationMinutes, status: completed ? "completed" : "interrupted", isPublic: false };
  } else if (parsed.data.action === "publish") patch = { isPublic: true };
  else if (parsed.data.action === "unpublish") patch = { isPublic: false };
  else patch = { title: parsed.data.title, detail: parsed.data.detail, reflection: parsed.data.reflection, evidenceUrls: parsed.data.evidenceUrls, status: parsed.data.status };
  return NextResponse.json(await updateEntry(parsed.data.id, patch));
}

export async function DELETE(request: NextRequest) {
  if (!await canWrite(request)) return NextResponse.json({ error: "Owner authentication required." }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing entry id." }, { status: 400 });
  await deleteEntry(id);
  return NextResponse.json({ ok: true });
}
