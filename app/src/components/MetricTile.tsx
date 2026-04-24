import Link from "next/link";
import { formatValue, formatDate, performanceScore, scoreColor, formatPeriod } from "@/lib/format";
import type { Series } from "@/lib/types";

export function MetricTile({ series, href }: { series: Series; href?: string }) {
  const v = series.latest?.value ?? null;
  const score = performanceScore(v, series.metric);
  const color = scoreColor(score);
  const body = (
    <article className="py-8">
      <div className="text-2xs uppercase tracking-wider text-subtle">{series.metric.short_name_sv}</div>
      <div className="mt-3 flex items-baseline gap-3">
        <div className="serif num text-6xl leading-none" style={{ color }}>
          {formatValue(v, series.metric.unit).split(" ")[0]}
        </div>
        <div className="text-sm text-muted">{formatValue(v, series.metric.unit).split(" ").slice(1).join(" ") || series.metric.unit}</div>
      </div>
      <div className="mt-4 text-sm text-muted max-w-md">
        {series.metric.description_sv}
      </div>
      {series.latest && (
        <div className="mt-4 text-2xs uppercase tracking-wider text-subtle flex gap-4">
          <span>{formatPeriod(series.latest.period, /^\d{6}$/.test(series.latest.period) ? "month" : "year")}</span>
          <span>hämtad {formatDate(series.latest.fetched_at)}</span>
          <a className="link-ink" href={series.latest.source_url} target="_blank" rel="noreferrer">källa</a>
        </div>
      )}
    </article>
  );
  return href ? <Link href={href} className="block link-ink">{body}</Link> : body;
}
