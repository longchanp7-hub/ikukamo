export function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl" style={{ background: "var(--chip)", color: "var(--score)" }}>
      <span className="text-[10px] tracking-wide opacity-80">おすすめ</span>
      <span className="text-xl font-semibold leading-none">{score}</span>
    </div>
  );
}
