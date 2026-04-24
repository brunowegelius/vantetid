import Link from "next/link";
import { formatValueBare, performanceScore, scoreColor, unitLabel } from "@/lib/format";
import type { Series } from "@/lib/types";

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
    <div className="py-6">
      <div className="grid grid-cols-[auto_1fr_auto] gap-x-6 gap-y-2 items-baseline text-sm">
        <div className="text-2xs uppercase tracking-wider text-subtle">Region</div>
        <div className="text-2xs uppercase tracking-wider text-subtle">Skala</div>
        <div className="text-2xs uppercase tracking-wider text-subtle text-right">{unitLabel(unit)}</div>
        <div className="col-span-3"><div className="rule" /></div>
        {riket && (
          <>
            <div className="font-medium">Riket</div>
            <ScaleBar value={riketValue} series={riket} />
            <div className="num text-right">{formatValueBare(riketValue, unit)}</div>
            <div className="col-span-3"><div className="rule opacity-60" /></div>
          </>
        )}
        {sorted.map(s => {
          const v = s.latest?.value ?? null;
          return (
            <RowFragment key={s.region.id} series={s} unit={unit} v={v} />
          );
        })}
      </div>
    </div>
  );
}

function RowFragment({ series, unit, v }: { series: Series; unit: string; v: number | null }) {
  return (
    <>
      <Link href={`/region/${series.region.slug}`} className="link-ink">{series.region.short_name}</Link>
      <ScaleBar value={v} series={series} />
      <div className="num text-right">{formatValueBare(v, unit as "days"|"percent"|"per_1000"|"index")}</div>
      <div className="col-span-3"><div className="rule opacity-60" /></div>
    </>
  );
}

function ScaleBar({ value, series }: { value: number | null; series: Series }) {
  const score = performanceScore(value, series.metric);
  const pct = Math.round((score ?? 0) * 100);
  return (
    <div className="h-2 w-full relative" style={{ background: "#EDEAE1" }} aria-hidden>
      {value != null && (
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${Math.max(2, pct)}%`, background: scoreColor(score) }}
        />
      )}
    </div>
  );
}
