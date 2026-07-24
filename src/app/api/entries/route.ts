import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEntries, saveEntries } from "@/lib/entries";
import { categories, type Entry } from "@/types/entry";

export const dynamic = "force-dynamic";

const entrySchema = z.object({
  startedAt: z.string().datetime(),
  durationMinutes: z.number().int().min(1).max(1440),
  category: z.enum(categories),
  title: z.string().trim().min(2).max(100),
  detail: z.string().trim().max(500).default(""),
  evidenceUrl: z.union([z.string().url(), z.literal("")]).optional(),
});

function canWrite(request: NextRequest) {
  const key = process.env.ADMIN_KEY;
  return !key || request.headers.get("x-admin-key") === key;
}

export async function GET() {
  return NextResponse.json(await getEntries());
}

export async function POST(request: NextRequest) {
  if (!canWrite(request)) return NextResponse.json({ error: "Wrong studio key." }, { status: 401 });
  const parsed = entrySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const entry: Entry = {
    ...parsed.data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const entries = await getEntries();
  await saveEntries([entry, ...entries]);
  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!canWrite(request)) return NextResponse.json({ error: "Wrong studio key." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing entry id." }, { status: 400 });
  const entries = await getEntries();
  await saveEntries(entries.filter((entry) => entry.id !== id));
  return NextResponse.json({ ok: true });
}
