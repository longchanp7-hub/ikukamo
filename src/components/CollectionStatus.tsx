import collected from "@/data/collected-events.json";
type Source = {id:string; name:string; url:string; status:string; checkedAt:string; lastSuccessAt:string|null; discovered:number; accepted:number; retained:number; skipped:number; errors:number; cityCounts:Record<string,number>;methods?:Record<string,number>};
type Review = {sourceId:string; url:string; title?:string; reason:string};
type Snapshot = {events:{city:string;collectionExpired?:boolean;status?:string}[];sources:Source[];reviews:Review[];social?:{crawl?:{sources:{url:string;checkedAt:string;status:string}[];posts:unknown[];embeddedPosts?:unknown[]}}};
const snapshot = collected as unknown as Snapshot;
const date = (v:string|null) => v ? new Date(v).toLocaleString("ja-JP",{timeZone:"Asia/Tokyo"}) : "成功記録なし";
export function CollectionStatus() {
  return <details className="mb-4 rounded-2xl border p-3 text-xs" data-testid="collection-status"><summary>公式情報の取得状況・確認待ち</summary>
    <p className="my-3">毎朝8:20ごろ、公式一覧から新しい候補と更新を取得します。開始は遅れる場合があります。時刻未確認の候補は「この日時ならどこ行く？」から除外します。確認から7日を過ぎた自動収集情報は新規おすすめに出しません。</p>
    {snapshot.sources.map(s=><div key={s.id} className="my-3 border-t pt-2"><a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.name}</a><p>{({ok:"取得成功",partial:"一部失敗",failed:"取得失敗",review:"要確認"} as Record<string,string>)[s.status]||s.status} · 発見{s.discovered} / 採用{s.accepted} / 前回分保持{s.retained} / スキップ{s.skipped} / エラー{s.errors}</p><p>確認 {date(s.checkedAt)} / 最終成功 {date(s.lastSuccessAt)}</p><p>{Object.entries(s.cityCounts).map(([city,n])=>`${city} ${n}件`).join("・")||"採用できた地域なし"}</p></div>)}
    <p className="my-3">Instagramのアカウント連携とXの有料APIは使用しません。ログイン不要の公開ページ本文・公式サイト内の埋め込み本文・SNSリンクを確認し、取得結果を以下に表示します。アクセス制限がある場合は巡回を停止します。手動での追加も利用できます。</p>
    <details className="my-3"><summary>公開SNSページの巡回結果</summary><p>直接取得できた本文 {snapshot.social?.crawl?.posts.length||0}件 / 公式サイト内の埋め込み本文 {snapshot.social?.crawl?.embeddedPosts?.length||0}件</p>{snapshot.social?.crawl?.sources.map(s=><p key={s.url} className="my-2"><a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.url.replace(/^https:\/\//,"")}</a>：{({public_post_text:"公開投稿本文を取得",public_post_links:"投稿リンクのみ",no_public_post_body:"公開本文を取得できません",login_or_access_required:"ログイン・アクセス制限のため停止",host_limited:"同じサイトの制限により追加取得を停止",network_error:"通信失敗"} as Record<string,string>)[s.status]||s.status} · {date(s.checkedAt)}</p>)}</details>
    <details><summary>確認待ち {snapshot.reviews.length}件（予定への採用前）</summary>{snapshot.reviews.map((r,i)=><p key={r.url+i} className="my-2"><a href={r.url} target="_blank" rel="noreferrer" className="underline">{r.title||r.sourceId}</a>：{r.reason}</p>)}</details>
    <a href="https://github.com/longchanp7-hub/ikukamo/actions/workflows/daily-fetch.yml" target="_blank" rel="noreferrer" className="mt-3 inline-block underline">日次の実行履歴・障害の詳細</a>
  </details>;
}
