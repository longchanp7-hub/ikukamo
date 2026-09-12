export type InstagramRef =
  | { kind: "post"; shortcode: string; url: string; embedUrl: string }
  | { kind: "reel"; shortcode: string; url: string; embedUrl: string }
  | { kind: "profile"; username: string; url: string; embedUrl: null };

const USER_RE = /^[A-Za-z0-9._]{1,30}$/;

export function parseInstagramInput(raw: string): InstagramRef | null {
  const text = String(raw || "").trim();
  if (!text) return null;
  const cleaned = text.replace(/^@/, "");
  let url: URL | null = null;
  try {
    url = new URL(cleaned.startsWith("http") ? cleaned : `https://www.instagram.com/${cleaned.replace(/^\/+/, "")}`);
  } catch {
    if (USER_RE.test(cleaned)) {
      return { kind: "profile", username: cleaned.toLowerCase(), url: `https://www.instagram.com/${cleaned.toLowerCase()}/`, embedUrl: null };
    }
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "instagram.com" && host !== "instagr.am") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "p" && parts[1]) {
    const code = parts[1];
    return { kind: "post", shortcode: code, url: `https://www.instagram.com/p/${code}/`, embedUrl: `https://www.instagram.com/p/${code}/embed/` };
  }
  if ((parts[0] === "reel" || parts[0] === "reels") && parts[1]) {
    const code = parts[1];
    return { kind: "reel", shortcode: code, url: `https://www.instagram.com/reel/${code}/`, embedUrl: `https://www.instagram.com/reel/${code}/embed/` };
  }
  if (parts[0] && USER_RE.test(parts[0]) && !["p", "reel", "reels", "stories", "explore", "accounts"].includes(parts[0])) {
    const username = parts[0].toLowerCase();
    return { kind: "profile", username, url: `https://www.instagram.com/${username}/`, embedUrl: null };
  }
  return null;
}

export function instagramSearchUrl(query: string): string {
  return `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(query)}`;
}
