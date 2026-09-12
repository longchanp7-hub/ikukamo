import { parseInstagramInput, type InstagramRef } from "@/lib/instagram-url";

const KEY = "ikukamo_instagram_picks_v1";

export interface InstagramPick {
  id: string;
  ref: InstagramRef;
  label: string;
  addedAt: string;
}

export function loadInstagramPicks(): InstagramPick[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw.slice(0, 30) : [];
  } catch {
    return [];
  }
}

export function saveInstagramPick(input: string): { pick?: InstagramPick; error?: string } {
  const ref = parseInstagramInput(input);
  if (!ref) return { error: "InstagramのURLか@ユーザー名を貼ってください。" };
  const pick: InstagramPick = {
    id: ref.kind === "profile" ? `ig-${ref.username}` : `ig-${ref.kind}-${ref.shortcode}`,
    ref,
    label: ref.kind === "profile" ? `@${ref.username}` : ref.kind === "reel" ? "リール" : "投稿",
    addedAt: new Date().toISOString(),
  };
  const next = [pick, ...loadInstagramPicks().filter((p) => p.id !== pick.id)].slice(0, 30);
  localStorage.setItem(KEY, JSON.stringify(next));
  return { pick };
}

export function removeInstagramPick(id: string) {
  localStorage.setItem(KEY, JSON.stringify(loadInstagramPicks().filter((p) => p.id !== id)));
}
