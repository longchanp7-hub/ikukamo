import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_META } from "@/data/score-weights";
import { findEvent, loadLocalEvents } from "@/lib/events";
import { formatRangeJa } from "@/lib/jst";
import { ScoreBadge } from "@/components/ScoreBadge";
import { DetailActions } from "@/components/DetailActions";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

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
  const cancelled = event.status === "cancelled";
  const postponed = event.status === "postponed";

  const photo = event.imageUrl ? (
    <div className="relative h-60 w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${event.imageUrl}")`, filter: cancelled ? "saturate(.68) brightness(.88)" : undefined }}
      />
      {cancelled && (
        <Image
          src={`${base}/cancelled-stamp.svg`}
          alt=""
          aria-hidden="true"
          width={720}
          height={320}
          unoptimized
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-auto w-[72%] -translate-x-1/2 -translate-y-1/2 -rotate-[12deg]"
        />
      )}
    </div>
  ) : null;

  return (
    <main className="app-bg mx-auto min-h-dvh max-w-lg px-4 pb-16 safe-top">
      <Link href="/" className="text-sm" style={{ color: "var(--muted)" }}>← もどる</Link>

      {event.imageUrl && (
        photoHref ? (
          <a href={photoHref} target="_blank" rel="noreferrer" className="mt-5 block overflow-hidden rounded-[28px]" aria-label={event.title + "の公式情報を開く"}>
            {photo}
          </a>
        ) : (
          <div className="mt-5 overflow-hidden rounded-[28px]">{photo}</div>
        )
      )}

      <div className="mt-6 flex items-start gap-3">
        <ScoreBadge score={event.score} />
        <div>
          <div className="mb-1 flex flex-wrap gap-1.5">
            {cancelled && <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: "#b42318", color: "#fff" }}>{event.statusText || "中止"}</span>}
            {postponed && <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: "#9a6700", color: "#fff" }}>{event.statusText || "延期"}</span>}
            {event.isSample && <span className="text-xs" style={{ color: "var(--accent)" }}>サンプル</span>}
          </div>
          <h1 className="font-display text-[28px] leading-snug">{event.title.replace("【サンプル】", "")}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{cat.nameJa} · {event.city}</p>
        </div>
      </div>

      {cancelled && (
        <section className="mt-5 rounded-[22px] px-4 py-4" style={{ background: "rgba(180, 35, 24, 0.10)", border: "1px solid rgba(180, 35, 24, 0.22)" }}>
          <p className="font-display text-xl font-bold" style={{ color: "#b42318" }}>本日は中止</p>
          <p className="mt-1 text-sm leading-6">{event.statusReason || "主催者発表により開催中止"}</p>
          {event.statusSourceUrl && (
            <a href={event.statusSourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium underline underline-offset-2" style={{ color: "#b42318" }}>
              主催者の中止情報を確認 ↗
            </a>
          )}
        </section>
      )}

      {postponed && (
        <section className="mt-5 rounded-[22px] px-4 py-4" style={{ background: "rgba(154, 103, 0, 0.10)", border: "1px solid rgba(154, 103, 0, 0.22)" }}>
          <p className="font-display text-xl font-bold" style={{ color: "#9a6700" }}>開催延期</p>
          <p className="mt-1 text-sm leading-6">{event.statusReason || "主催者発表により延期"}</p>
        </section>
      )}

      <section className="mt-6 space-y-3 text-sm leading-7">
        <p>{event.description}</p>
        <p className="font-display text-base">なぜ今か</p>
        <p>{event.recommendReason}</p>
      </section>
      <dl className="mt-6 space-y-1 text-sm">
        <Row label="日時">{formatRangeJa(event.startAt, event.endAt)}</Row>
        <Row label="場所">{event.venueName.replace("（サンプル）", "")} / {event.city}</Row>
        <Row label="住所">{event.address || `${event.prefecture}${event.city} ${event.venueName.replace("（サンプル）", "")}`}</Row>
        <Row label="距離">{event.distanceFromToyohashiKm}km / 車{event.driveMinutes}分</Row>
        <Row label="料金">{event.priceText || "未確認"}</Row>
        <Row label="駐車場">{event.parkingText || "未確認"}</Row>
        <Row label="確度">{conf}</Row>
        {(cancelled || postponed) && <Row label="状態">{event.statusText || (cancelled ? "中止" : "延期")}</Row>}
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
  return (
    <div className="flex gap-3 border-b py-3" style={{ borderColor: "var(--line)" }}>
      <dt className="w-16 shrink-0" style={{ color: "var(--muted)" }}>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
