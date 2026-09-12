# 行くかも

豊橋市を起点に、「人気かどうか」ではなく **自分が実際に行きそうか** でお出かけ候補を並べる個人向けWebアプリです。

公開URL: https://longchanp7-hub.github.io/ikukamo/

> MVPの一覧はすべて **サンプルデータ** です。実在イベントとして表示していません。

## アプリ概要
- トップは検索ではなくおすすめカード
- 今日 / 明日 / 今週 / 今週末 / 来週 / その先
- 「今日どこ行く？」で今から行ける候補を最大3件
- おすすめスコア 0–100（重みは `src/data/score-weights.ts`）
- 行きたい / 保存 / 興味なし / 行った を記録
- PWA（ホーム画面追加）
- 終了イベントは非表示

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

未設定でもシードでUI全体を確認できます。

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
