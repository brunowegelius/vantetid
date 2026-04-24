import Link from "next/link";
import { formatValueBare, formatDate, performanceScore, formatPeriod, unitLabel } from "@/lib/format";
import type { Series } from "@/lib/types";

export function MetricTile({ series, href }: { series: Series; href?: string }) {
  const v = series.latest?.value ?? null;
  const score = performanceScore(v, series.metric);
  const body = (
    <div className="station" style={{ padding: 24 }}>
      <div className="caps" style={{ color: "var(--ink-3)" }}>{series.metric.short_name_sv}</div>
      <div className="display-black" style={{ fontSize: 64, lineHeight: 0.9, marginTop: 12, letterSpacing: "-0.04em" }}>
        {formatValueBare(v, series.metric.unit)}
      </div>
      <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>
        {unitLabel(series.metric.unit)}
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 14, lineHeight: 1.5, maxWidth: "48ch" }}>
        {series.metric.description_sv}
      </p>
      {series.latest && (
        <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 14, display: "flex", gap: 14, letterSpacing: "0.05em" }}>
          <span>{formatPeriod(series.latest.period, /^\d{6}$/.test(series.latest.period) ? "month" : "year")}</span>
          <span>hämtad {formatDate(series.latest.fetched_at)}</span>
          <a href={series.latest.source_url} target="_blank" rel="noreferrer" className="link-ink" style={{ color: "var(--ink)" }}>källa →</a>
          {score != null && <span style={{ marginLeft: "auto" }}>rank {Math.round(score * 100)}</span>}
        </div>
      )}
    </div>
  );
  return href ? <Link href={href} className="block link-ink">{body}</Link> : body;
}
