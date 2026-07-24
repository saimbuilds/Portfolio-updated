import { createClient } from "@supabase/supabase-js";

export function hasSupabase() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function isOwnerToken(token?: string | null) {
  if (!token || !hasSupabase()) return false;
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  const allowed = process.env.ADMIN_EMAIL?.toLowerCase();
  return !error && Boolean(data.user?.email) && (!allowed || data.user?.email?.toLowerCase() === allowed);
}
