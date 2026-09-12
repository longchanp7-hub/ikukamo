import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_META } from "@/data/score-weights";
import { findEvent, loadLocalEvents } from "@/lib/events";
import { formatRangeJa } from "@/lib/jst";
import { ScoreBadge } from "@/components/ScoreBadge";
import { DetailActions } from "@/components/DetailActions";

export function generateStaticParams() {
  return loadLocalEvents().map((e) => ({ id: e.id }));
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = findEvent(id);
  if (!event) notFound();
  const cat = CATEGORY_META[event.category];
  const conf = event.confidence === "confirmed" ? "confirmed（公式確認）" : event.confidence === "high" ? "high（主催者・公式SNS）" : "unverified（第三者・シード）";
  return (
    <main className="mx-auto max-w-lg px-4 pb-16 pt-6">
      <Link href="/" className="text-sm" style={{ color: "var(--muted)" }}>← 一覧</Link>
      <div className="mt-4 flex items-start gap-3">
        <ScoreBadge score={event.score} />
        <div>
          {event.isSample && <p className="mb-1 text-xs" style={{ color: "var(--accent)" }}>サンプルデータ（実在イベントではありません）</p>}
          <h1 className="text-2xl font-semibold leading-snug">{event.title.replace("【サンプル】", "")}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{cat.icon} {cat.nameJa} · {event.city}</p>
        </div>
      </div>
      <section className="mt-5 space-y-2 text-sm leading-relaxed">
        <p>{event.description}</p>
        <p className="font-medium">このイベントをおすすめする理由</p>
        <p>{event.recommendReason}</p>
      </section>
      <dl className="mt-6 space-y-2 text-sm">
        <Row label="開催日時">{formatRangeJa(event.startAt, event.endAt)}</Row>
        <Row label="場所">{event.venueName.replace("（サンプル）", "")}（{event.city}）</Row>
        <Row label="豊橋から">約{event.distanceFromToyohashiKm}km / 車 約{event.driveMinutes}分</Row>
        <Row label="料金">{event.priceText || "未確認"}</Row>
        <Row label="駐車場">{event.parkingText || "未確認"}</Row>
        <Row label="情報信頼度">{conf}</Row>
      </dl>
      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        {event.officialUrl && <a className="underline" href={event.officialUrl} target="_blank" rel="noreferrer">公式</a>}
        {event.mapUrl && <a className="underline" href={event.mapUrl} target="_blank" rel="noreferrer">地図</a>}
        {event.instagramUrl && <a className="underline" href={event.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}
        {event.xUrl && <a className="underline" href={event.xUrl} target="_blank" rel="noreferrer">X</a>}
      </div>
      <DetailActions eventId={event.id} />
    </main>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="flex gap-3 border-b py-2" style={{ borderColor: "var(--line)" }}><dt className="w-24 shrink-0" style={{ color: "var(--muted)" }}>{label}</dt><dd>{children}</dd></div>);
}
