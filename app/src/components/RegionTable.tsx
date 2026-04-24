import Link from "next/link";
import { formatValueBare, performanceScore, unitLabel } from "@/lib/format";
import type { Series } from "@/lib/types";

const TIER_COLOR = ["var(--ink-4)", "#FF4D3D", "#F4B63F", "#2F4DE3", "#2E7D6F"] as const;
function scoreTier(v: number | null): 0 | 1 | 2 | 3 | 4 {
  if (v == null) return 0;
  if (v >= 0.85) return 4;
  if (v >= 0.6)  return 3;
  if (v >= 0.4)  return 2;
  return 1;
}

export function RegionTable({
  rows, unit, sortBy = "value",
}: {
  rows: Series[];
  unit: "days" | "percent" | "per_1000" | "index";
  sortBy?: "value" | "name";
}) {
  const metric = rows[0]?.metric;
  const sorted = [...rows].filter(r => r.region.id !== "0000").sort((a, b) => {
    if (sortBy === "name") return a.region.short_name.localeCompare(b.region.short_name, "sv");
    const va = a.latest?.value, vb = b.latest?.value;
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return metric?.better_direction === "lower" ? va - vb : vb - va;
  });
  const riket = rows.find(r => r.region.id === "0000");
  const riketValue = riket?.latest?.value ?? null;

  return (
    <div style={{ padding: "8px 0" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "160px 1fr 90px 60px",
          gap: "0 24px",
          alignItems: "baseline",
        }}
      >
        <div className="caps" style={{ color: "var(--ink-3)" }}>Region</div>
        <div className="caps" style={{ color: "var(--ink-3)" }}>Skala</div>
        <div className="caps" style={{ color: "var(--ink-3)", textAlign: "right" }}>{unitLabel(unit)}</div>
        <div className="caps" style={{ color: "var(--ink-3)", textAlign: "right" }}>Rank</div>
        <div style={{ gridColumn: "1 / -1", borderTop: "1px solid var(--ink)", marginTop: 10 }} />
        {riket && (
          <RowFragment series={riket} unit={unit} emphasized />
        )}
        {sorted.map(s => (
          <RowFragment key={s.region.id} series={s} unit={unit} />
        ))}
      </div>
    </div>
  );
}

function RowFragment({ series, unit, emphasized = false }: { series: Series; unit: string; emphasized?: boolean }) {
  const v = series.latest?.value ?? null;
  const score = performanceScore(v, series.metric);
  const tier = scoreTier(score);
  return (
    <>
      <Link
        href={`/region/${series.region.slug}`}
        className="link-ink"
        style={{
          paddingTop: 10, paddingBottom: 10,
          fontSize: 14,
          fontWeight: emphasized ? 700 : 500,
          borderBottom: "1px solid var(--bg-2)",
          fontFamily: emphasized ? "'Cabinet Grotesk', 'General Sans', sans-serif" : undefined,
        }}
      >
        {series.region.short_name}
      </Link>
      <ScaleBar value={v} score={score} tier={tier} emphasized={emphasized} />
      <div
        className="mono"
        style={{
          textAlign: "right",
          paddingTop: 10, paddingBottom: 10,
          fontSize: 13,
          color: TIER_COLOR[tier],
          fontWeight: emphasized ? 700 : 500,
          borderBottom: "1px solid var(--bg-2)",
        }}
      >
        {formatValueBare(v, unit as "days" | "percent" | "per_1000" | "index")}
      </div>
      <div
        className="mono"
        style={{
          textAlign: "right",
          paddingTop: 10, paddingBottom: 10,
          fontSize: 12,
          color: "var(--ink-3)",
          borderBottom: "1px solid var(--bg-2)",
        }}
      >
        {score != null ? Math.round(score * 100) : "—"}
      </div>
    </>
  );
}

function ScaleBar({
  value, score, tier, emphasized,
}: { value: number | null; score: number | null; tier: 0 | 1 | 2 | 3 | 4; emphasized: boolean }) {
  const pct = Math.round((score ?? 0) * 100);
  return (
    <div
      style={{
        position: "relative",
        height: emphasized ? 10 : 8,
        margin: "14px 0 10px",
        background: "var(--bg-2)",
        borderBottom: "1px solid var(--bg-2)",
      }}
      aria-hidden
    >
      {value != null && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${Math.max(2, pct)}%`,
            background: TIER_COLOR[tier],
          }}
        />
      )}
    </div>
  );
}
