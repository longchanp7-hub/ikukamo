export type ParsedInstagram =
  | { type: "post"; code: string; url: string }
  | { type: "profile"; user: string; url: string }
  | { type: "tag"; tag: string; url: string };

export function parseInstagramUrl(raw: string): ParsedInstagram | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    const withProto = /^https?:\/\//i.test(text) ? text : `https://${text}`;
    const u = new URL(withProto);
    if (!/(^|\.)instagram\.com$/i.test(u.hostname)) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if ((parts[0] === "p" || parts[0] === "reel" || parts[0] === "reels" || parts[0] === "tv") && parts[1]) {
      const kind = parts[0] === "reels" ? "reel" : parts[0];
      return { type: "post", code: parts[1], url: `https://www.instagram.com/${kind}/${parts[1]}/` };
    }
    if (parts[0] === "explore" && parts[1] === "tags" && parts[2]) {
      return { type: "tag", tag: decodeURIComponent(parts[2]), url: `https://www.instagram.com/explore/tags/${parts[2]}/` };
    }
    if (parts[0] && !['explore', 'accounts', 'stories', 'direct'].includes(parts[0])) {
      return { type: "profile", user: parts[0], url: `https://www.instagram.com/${parts[0]}/` };
    }
    return null;
  } catch {
    return null;
  }
}

export function instagramSearchUrl(query: string): string {
  return `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(query)}`;
}

export function instagramTagUrl(tag: string): string {
  return `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`;
}

export const INSTAGRAM_SEARCHES = [
  { label: "豊橋イベント", query: "豊橋 イベント" },
  { label: "豊橋マルシェ", query: "豊橋 マルシェ" },
  { label: "豊橋夜市", query: "豊橋 夜市" },
  { label: "豊川イベント", query: "豊川 イベント" },
  { label: "田原ワイン", query: "田原 ワイン" },
  { label: "蒲郡クラシックカー", query: "蒲郡 クラシックカー" },
  { label: "浜松ワイン", query: "浜松 ワイン" },
];
