export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  return { url, key, configured: Boolean(url && key) };
}

/** MVP: no hard dependency. Wire @supabase/supabase-js later. */
export async function getSupabase(): Promise<null> {
  return null;
}
