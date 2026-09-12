export function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full" style={{ background: "var(--accent-soft)", color: "var(--score)" }}>
      <span className="font-display text-lg leading-none">{score}</span>
    </div>
  );
}
