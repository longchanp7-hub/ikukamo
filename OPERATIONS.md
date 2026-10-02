# 個人利用とAIを使わない日次運用

公開先: https://longchanp7-hub.github.io/ikukamo/

現在地は「現在地を使う」を押したときだけ要求します。拒否・非対応・時間切れなら手動地域を使えます。GPSは画面のメモリー内だけで、保存・バックアップ・天気サービスへ送りません。距離は出発地から会場付近（手動予定は市の代表地点）への直線距離で、車の時間ではありません。

会場予報は「会場の天気を取得」でOpen-Meteo無料の非商用向けAPIを呼びます。会場座標だけを小数2桁に丸めて送り、最大20地点/1バッチ、最大14日先、30分キャッシュで回数を抑えます。訪問日・時間に該当する会場の予報を表示し、範囲外/失敗/制限は不明とします。有料endpointやAPIキーへの切替はありません。https://open-meteo.com/en/pricing

雨なら公式根拠のある屋内候補を優先します。「天候依存なし」から屋内と推測しません。複数日にまたがる会期には閉場時間も含むことがあるため、当日の開場時刻・天候中止は公式ページを確認してください。

## 保存と復元

「保存」で行きたい/保存/行った/非表示/手動予定を確認し、取消・再表示・手動編集・JSON書出/復元ができます。ブラウザーごとのローカル保存で、アカウント同期はありません。旧v1データは読取時に移行し、書込成功まで元データを維持します。形式違い・破損・容量不足は上書きを止めます。復元はプレビューと上書き確認が必要で、直前の生データを `ikukamo.personal.v2.beforeRestore` に退避します。端末やブラウザーを変える前にJSONを保管してください。

## 毎日の自動処理

既存の `.github/workflows/daily-fetch.yml` を毎日08:20 JST頃に実行します。Nodeだけで動作し、Work/Codexや他のLLMを起動しません。APIキー、カード登録、有料連携は不要です。X/Instagramの投稿の自動取得はありません。Instagram候補はリンクと日時を手動登録します。

`config/official-sources.json` が収集元設定です。最大12ページ・各最大3回・各15秒以下を強制します。
- watch: 現在の3公式ページ(PLAT/リバーサイド/Yamaha)のタイトルと本文ハッシュを取得し、内容変更を記録します。本文から開催日時を推測せず、変更内容の確認は人が行います。
- jsonld: 公式ページが明示するJSON-LD Eventを取得します。時差付き開始/終了、会場名、所在地、座標が揃わない場合は更新を拒否します。勝手な日時補完はしません。

現在の初期設定はwatch3件・自動生成イベント0件です。従来の確認済み候補を `src/data/daily-curated-events.ts` / `live-events.ts` から引き続き表示します。屋内確認の出典は `src/data/venue-evidence.ts` にあります。表示済みの終了判定はブラウザー時刻で更新します。

取得結果はActions summaryとログ、生成データは `src/data/collected-events.json`。取得・形式チェックの失敗時はファイルを書き換えず失敗を記録します。内容に差分があるときだけcommitし、検査付きbuildと公開を呼びます。更新がない日のcommit/deployはありません。未知のページ形式変更は人による修正が必要です。

公開URL・HTML/manifestの検査は `operations.json` / `scripts/ops-health.mjs`。既存日次に接続し、重複スケジュールは作りません。標準Ubuntu runnerを使用し、日次artifactを新たに蓄積せず、Pages artifactは1日保持です。GitHubの条件: https://docs.github.com/en/billing/concepts/product-billing/github-actions

通常チャットで「行くかもの○地域/公式URL/表示/屋内区分を△△へ変更、根拠を保ち検証して公開」と依頼できます。設定・データ・コードを編集する運用です。AIを使った変更作業の枠は使いますが、日次処理はAIに依存しません。

## 検証と再開

Node24、pnpm11.19.0。
```text
pnpm install --frozen-lockfile --ignore-scripts
pnpm lint
pnpm typecheck
pnpm test --maxWorkers=1
node --test tests/collector.test.mjs
pnpm build
node tests/browser-smoke.cjs
node scripts/ingest.mjs
node scripts/ops-health.mjs
```
ビルド時はNEXT_PUBLIC_BASE_PATH=/ikukamo。ブラウザーテストはPlaywrightを別途用意し、WindowsはBROWSER_CHANNEL=msedge。テストは隔離プロファイル・模擬位置/予報を使います。画面幅検証は実機検証ではありません。

ChatGPTの旧日次監視は会話履歴のみ確認できており、スケジュールの存在/有効状態/利用枠消費は未確認です。未ログインのため停止済みとは扱っていません。パスワードや認証コードをAIへ渡す必要はありません。
