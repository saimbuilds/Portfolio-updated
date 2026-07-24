import { NextRequest, NextResponse } from "next/server";
import { getEntries } from "@/lib/entries";
import { hasSupabase, isOwnerToken, supabaseAdmin } from "@/lib/supabase";

async function owner(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (await isOwnerToken(token)) return true;
  return !hasSupabase() && Boolean(process.env.ADMIN_KEY && request.headers.get("x-admin-key") === process.env.ADMIN_KEY);
}

export async function POST(request: NextRequest) {
  if (!await owner(request)) return NextResponse.json({ error: "Owner authentication required." }, { status: 401 });
  if (!hasSupabase()) return NextResponse.json({ error: "Screenshot uploads require Supabase configuration." }, { status: 503 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image." }, { status: 400 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5_242_880) return NextResponse.json({ error: "Use JPG, PNG or WebP under 5 MB." }, { status: 400 });
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `private/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabaseAdmin().storage.from("evidence").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ path });
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path || !hasSupabase()) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!(await getEntries()).some((entry) => entry.evidenceUrls?.includes(path))) return NextResponse.json({ error: "This evidence is private." }, { status: 404 });
  const { data, error } = await supabaseAdmin().storage.from("evidence").createSignedUrl(path, 60);
  if (error) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
