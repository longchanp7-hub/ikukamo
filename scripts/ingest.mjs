import { writeFileSync, mkdirSync } from "node:fs";
const report = {
  ranAt: new Date().toISOString(),
  status: "ok",
  note: "APIキー未設定のため実取得はスキップ。シード更新のみ想定。",
  adapters: {
    x: { status: process.env.X_BEARER_TOKEN ? "token-present" : "skipped" },
    instagram: { status: process.env.INSTAGRAM_ACCESS_TOKEN ? "token-present" : "skipped" },
    web: { status: process.env.DISABLE_WEB_FETCH === "1" ? "skipped" : "placeholder" },
  },
};
mkdirSync("tmp", { recursive: true });
writeFileSync("tmp/ingest-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
