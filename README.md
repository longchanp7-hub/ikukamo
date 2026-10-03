# 行くかも

豊橋周辺のお出かけ候補を、自分の出発地域・訪問日時・好みで選ぶ個人向けWebアプリです。

公開URL: https://longchanp7-hub.github.io/ikukamo/

- 確認済みイベント、写真、公式ページ、地図へのリンク
- 今日/明日/今週/今週末/来週/その先と、候補を最大3件に絞る「今日」
- 明示ボタンによる現在地取得と手動地域、会場までの直線距離
- 会場・訪問時間ごとの無料予報、公式根拠で確認した屋内候補
- 行きたい/保存/行った/非表示、取消・再表示、終了予定を含む履歴
- Instagramリンクから手動予定を作成・編集（投稿の自動読取は行いません）
- ブラウザー内保存、検証とプレビュー付きJSONバックアップ/復元
- ホーム画面追加とオフラインキャッシュ。情報の新しさは公式で確認

Next.js 15 / React 19 / TypeScript / Tailwind CSS 4 / GitHub Pages。アカウント作成、Supabase、AI、有料API、秘密キーは現在の機能・日次運用に不要です。以前の任意連携のコードは残っていますが、アプリや定期workflowから呼びません。

## 起動と検証

Node 24とpnpm 11.19.0を使用します。

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
pnpm lint
pnpm typecheck
pnpm test --maxWorkers=1
node --test tests/collector.test.mjs
pnpm build
```

開発: http://localhost:3000 。Pages向けbuildは `NEXT_PUBLIC_BASE_PATH=/ikukamo`、サンプルは通常非表示です。`.env.example`を参照してください。

## 日次処理と変更

既存の `daily-fetch.yml` が08:20 JST頃に通常のNodeスクリプトで公式ページを取得し、差分があればテスト・build・公開します。取得失敗は前回の正常データを維持して記録します。東三河・西三河・浜松方面の10経路からHTML・RSS・公開JSONを使って新しいイベントを発見し、詳細の日時・開催地を検証してアプリに反映します。取得状況、確認待ち、SNS公開ページで取得不能だった理由もアプリから確認できます。詳細はOPERATIONS.mdを参照してください。

詳しい操作、収集元設定、予報の制限、復元方法、定期処理の停止/再実行と変更依頼は [OPERATIONS.md](OPERATIONS.md) を参照してください。
