import { describe, expect, it } from "vitest";
import { parseInstagramInput } from "../src/lib/instagram-url";

describe("parseInstagramInput", () => {
  it("parses a post url", () => {
    const r = parseInstagramInput("https://www.instagram.com/p/AbC123_-xy/");
    expect(r?.kind).toBe("post");
    if (r?.kind === "post") expect(r.shortcode).toBe("AbC123_-xy");
  });
  it("parses a reel url", () => {
    const r = parseInstagramInput("https://instagram.com/reel/ReelCode99");
    expect(r?.kind).toBe("reel");
  });
  it("parses @username", () => {
    const r = parseInstagramInput("@toyohashi_kanko");
    expect(r).toEqual({
      kind: "profile",
      username: "toyohashi_kanko",
      url: "https://www.instagram.com/toyohashi_kanko/",
      embedUrl: null,
    });
  });
  it("rejects non-instagram urls", () => {
    expect(parseInstagramInput("https://x.com/toyohashi")).toBeNull();
  });
});
