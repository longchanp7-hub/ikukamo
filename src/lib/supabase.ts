export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  return { url, key, configured: Boolean(url && key) };
}
export async function getSupabase(): Promise<null | { from: (t: string) => unknown }> {
  const { url, key, configured } = getSupabaseEnv();
  if (!configured) return null;
  try {
    const mod = await import("@supabase/supabase-js").catch(() => null);
    if (!mod) return null;
    return mod.createClient(url as string, key as string);
  } catch { return null; }
}
