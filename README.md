# 行くかも

豊橋市を起点に、「人気かどうか」ではなく **自分が実際に行きそうか** でお出かけ候補を並べる個人向けWebアプリです。

公開URL: https://longchanp7-hub.github.io/ikukamo/

現在は確認済みの実イベントをカード表示します。サンプルデータは通常非表示で、`NEXT_PUBLIC_SHOW_SAMPLE_EVENTS=true` のときだけ表示します。

## アプリ概要
- トップは検索ではなくおすすめカード
- 今日 / 明日 / 今週 / 今週末 / 来週 / その先
- イベントカードにメイン写真を表示
- 写真・イベント名・「公式へ」から公式ページへ直接アクセス
- 地図 / Instagram / X の直接リンク
- 「今日どこ行く？」で今から行ける候補を最大3件
- おすすめスコア 0–100（重みは `src/data/score-weights.ts`）
- 行きたい / 保存 / 興味なし / 行った を記録
- PWA（ホーム画面追加）
- 終了イベントは非表示
- 中止イベントは削除せず一覧に残し、画像へ赤い「中止」スタンプを重ね、中止理由・公式確認先を表示。中止・延期イベントは「今から行ける」候補から除外
- ビアガーデン・季節運行・ナイトZOO等、季節中ずっと/繰り返し開催される準常設イベントは通常候補から除外（単発・短期イベントを優先）

## 技術構成
Next.js 15 / React 19 / TypeScript / Tailwind CSS 4 / Supabase（任意） / GitHub Actions / GitHub Pages または Vercel

## ローカル起動
```bash
npm install
cp .env.example .env.local
npm run dev
```
http://localhost:3000

```bash
npm test
npm run typecheck
npm run lint
npm run build
NEXT_PUBLIC_BASE_PATH=/ikukamo npm run build
```

## 環境変数
`.env.example` 参照。秘密情報はコミットしない。GitHub Secrets へ。

## Supabase設定
1. プロジェクト作成
2. `supabase/schema.sql` を実行
3. URL と anon key を設定

Supabase未設定でも、`src/data/live-events.ts` の確認済みイベントを表示できます。

## GitHub Actions
- `ci.yml` lint / typecheck / test / build
- `daily-fetch.yml` 取得土台（キー未設定でも壊れない）
- `deploy-pages.yml` Pages公開

初回だけ Settings → Pages → Source を **GitHub Actions** にしてください。

## Vercel
このリポジトリを Import。`NEXT_PUBLIC_BASE_PATH` は空。

## X / Instagram
`src/adapters/` が境界。正式APIのみ。無断スクレイピングなし。取得できない情報は未確認。

## ロードマップ
Grok/X本接続、天気、プッシュ、直前空室、自然言語フィルタ
