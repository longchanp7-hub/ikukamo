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
  const conf = event.confidence === "confirmed" ? "公式確認" : event.confidence === "high" ? "高（主催者・公式SNS）" : "未確認";
  const photoHref = event.officialUrl || event.instagramUrl || event.imageUrl;
  return (
    <main className="app-bg mx-auto min-h-dvh max-w-lg px-4 pb-16 safe-top">
      <Link href="/" className="text-sm" style={{ color: "var(--muted)" }}>← もどる</Link>

      {event.imageUrl && (
        photoHref ? (
          <a href={photoHref} target="_blank" rel="noreferrer" className="mt-5 block overflow-hidden rounded-[28px]" aria-label={event.title + "の公式情報を開く"}>
            <div className="h-60 w-full bg-cover bg-center" style={{ backgroundImage: `url("${event.imageUrl}")` }} />
          </a>
        ) : (
          <div className="mt-5 h-60 w-full rounded-[28px] bg-cover bg-center" style={{ backgroundImage: `url("${event.imageUrl}")` }} />
        )
      )}

      <div className="mt-6 flex items-start gap-3">
        <ScoreBadge score={event.score} />
        <div>
          {event.isSample && <p className="mb-1 text-xs" style={{ color: "var(--accent)" }}>サンプル</p>}
          <h1 className="font-display text-[28px] leading-snug">{event.title.replace("【サンプル】", "")}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{cat.nameJa} · {event.city}</p>
        </div>
      </div>
      <section className="mt-6 space-y-3 text-sm leading-7">
        <p>{event.description}</p>
        <p className="font-display text-base">なぜ今か</p>
        <p>{event.recommendReason}</p>
      </section>
      <dl className="mt-6 space-y-1 text-sm">
        <Row label="日時">{formatRangeJa(event.startAt, event.endAt)}</Row>
        <Row label="場所">{event.venueName.replace("（サンプル）", "")} / {event.city}</Row>
        <Row label="距離">{event.distanceFromToyohashiKm}km / 車{event.driveMinutes}分</Row>
        <Row label="料金">{event.priceText || "未確認"}</Row>
        <Row label="駐車場">{event.parkingText || "未確認"}</Row>
        <Row label="確度">{conf}</Row>
      </dl>
      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        {event.officialUrl && <a className="rounded-full px-3 py-1.5 font-medium" style={{ background: "var(--accent)", color: "#fffaf1" }} href={event.officialUrl} target="_blank" rel="noreferrer">公式へ</a>}
        {event.mapUrl && <a className="rounded-full px-3 py-1.5" style={{ background: "var(--chip)" }} href={event.mapUrl} target="_blank" rel="noreferrer">地図</a>}
        {event.instagramUrl && <a className="rounded-full px-3 py-1.5" style={{ background: "var(--chip)" }} href={event.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}
        {event.xUrl && <a className="rounded-full px-3 py-1.5" style={{ background: "var(--chip)" }} href={event.xUrl} target="_blank" rel="noreferrer">X</a>}
      </div>
      <DetailActions eventId={event.id} />
    </main>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="flex gap-3 border-b py-3" style={{ borderColor: "var(--line)" }}><dt className="w-16 shrink-0" style={{ color: "var(--muted)" }}>{label}</dt><dd>{children}</dd></div>);
}
