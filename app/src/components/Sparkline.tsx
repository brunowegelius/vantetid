export function Sparkline({
  points, betterDirection, target, width = 320, height = 72,
}: {
  points: { period: string; value: number | null }[];
  betterDirection: "lower" | "higher";
  target?: number | null;
  width?: number; height?: number;
}) {
  const clean = points.filter(p => p.value != null) as { period: string; value: number }[];
  if (clean.length < 2) return <div className="text-2xs uppercase tracking-wider text-subtle">Otillräcklig historik</div>;
  const vals = clean.map(p => p.value);
  const min = Math.min(...vals, target ?? Infinity);
  const max = Math.max(...vals, target ?? -Infinity);
  const pad = 6;
  const x = (i: number) => pad + (i / (clean.length - 1)) * (width - pad * 2);
  const y = (v: number) => {
    const t = (v - min) / Math.max(max - min, 1e-9);
    const normalized = betterDirection === "lower" ? t : 1 - t;
    return pad + normalized * (height - pad * 2);
  };
  const d = clean.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="historik">
      {target != null && (
        <line x1={pad} x2={width - pad} y1={y(target)} y2={y(target)}
              stroke="#9C9A91" strokeDasharray="2 3" strokeWidth={1} />
      )}
      <path d={d} fill="none" stroke="#0E0E0C" strokeWidth={1.5} />
      {clean.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r={i === clean.length - 1 ? 3 : 1.5}
                fill={i === clean.length - 1 ? "#0E0E0C" : "#6B6A64"} />
      ))}
    </svg>
  );
}
