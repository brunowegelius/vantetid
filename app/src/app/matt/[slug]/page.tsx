import { notFound } from "next/navigation";
import Link from "next/link";
import { METRICS, CATEGORY_LABEL, getMetricBySlug, getSourceBySlug } from "@/lib/catalog";
import { getLatestAcrossRegions, lastUpdatedOf } from "@/lib/data";
import { RegionTable } from "@/components/RegionTable";
import { Sparkline } from "@/components/Sparkline";
import { formatDate, formatValue, performanceScore, scoreColor, formatPeriod } from "@/lib/format";

export const revalidate = 1800;
export async function generateStaticParams() {
  return METRICS.map(m => ({ slug: m.slug }));
}
export default async function MetricPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const metric = getMetricBySlug(slug);
  if (!metric) notFound();
  const series = await getLatestAcrossRegions(slug);
  const lastUpdated = lastUpdatedOf(series);
  const riket = series.find(s => s.region.id === "0000");
  const source = getSourceBySlug(metric.source_slug);

  return (
    <>
      <section className="grid-wide pt-10 pb-12">
        <div className="text-2xs uppercase tracking-wider text-subtle mb-3">
          <Link href="/" className="link-ink">Översikt</Link> / {CATEGORY_LABEL[metric.category]}
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <h1 className="serif text-4xl md:text-5xl leading-[1.05] tracking-[-0.01em]">{metric.name_sv}</h1>
            <p className="mt-5 max-w-2xl text-muted">{metric.description_sv}</p>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:pl-6">
            <div className="text-2xs uppercase tracking-wider text-subtle">Senast uppdaterad</div>
            <div className="num mt-1 text-lg">{lastUpdated ? formatDate(lastUpdated) : "—"}</div>
            <div className="text-2xs uppercase tracking-wider text-subtle mt-6">Källa</div>
            <div className="mt-1 text-lg">
              {source && <a className="link-ink" href={source.homepage_url} target="_blank" rel="noreferrer">{source.name}</a>}
            </div>
            <div className="text-2xs uppercase tracking-wider text-subtle mt-6">KPI-id</div>
            <div className="num mt-1 text-lg">{metric.source_kpi_id}</div>
            {metric.target_value != null && (
              <>
                <div className="text-2xs uppercase tracking-wider text-subtle mt-6">Vårdgarantimål</div>
                <div className="num mt-1 text-lg">
                  {metric.unit === "days" ? `${metric.target_value} dagar` : `${metric.target_value} %`}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {riket && (
        <section className="grid-wide pb-10">
          <div className="rule" />
          <div className="grid grid-cols-12 gap-6 py-8">
            <div className="col-span-12 md:col-span-3">
              <div className="text-2xs uppercase tracking-wider text-subtle">Riket — senaste värdet</div>
            </div>
            <div className="col-span-6 md:col-span-3">
              <div className="serif num text-7xl leading-none"
                   style={{ color: scoreColor(performanceScore(riket.latest?.value ?? null, metric)) }}>
                {formatValue(riket.latest?.value ?? null, metric.unit).split(" ")[0]}
              </div>
              <div className="text-sm text-muted mt-2">
                {formatValue(riket.latest?.value ?? null, metric.unit).split(" ").slice(1).join(" ") || metric.unit}
              </div>
            </div>
            <div className="col-span-6 md:col-span-3">
              <Sparkline
                points={riket.points.slice(-12)}
                betterDirection={metric.better_direction}
                target={metric.target_value}
                width={320} height={90}
              />
            </div>
            <div className="col-span-12 md:col-span-3 text-sm text-muted">
              {riket.latest && (
                <>
                  <div className="text-2xs uppercase tracking-wider text-subtle">Period</div>
                  <div className="num">{formatPeriod(riket.latest.period, /^\d{6}$/.test(riket.latest.period) ? "month" : "year")}</div>
                  <div className="mt-3 text-2xs uppercase tracking-wider text-subtle">Hämtad</div>
                  <div>{formatDate(riket.latest.fetched_at)}</div>
                  <a className="link-ink text-2xs uppercase tracking-wider text-subtle mt-3 inline-block"
                     href={riket.latest.source_url} target="_blank" rel="noreferrer">direktlänk till källsvar →</a>
                </>
              )}
            </div>
          </div>
          <div className="rule" />
        </section>
      )}

      <section className="grid-wide pb-16">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="serif text-2xl">Regioner — rankade</h2>
          <div className="text-2xs uppercase tracking-wider text-subtle">
            {metric.better_direction === "lower" ? "Lägre är bättre" : "Högre är bättre"}
          </div>
        </div>
        <RegionTable rows={series} unit={metric.unit} />
      </section>

      <section className="grid-wide pb-16">
        <div className="rule mb-8" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4">
            <div className="text-2xs uppercase tracking-wider text-subtle">Transparens</div>
            <h2 className="serif text-2xl mt-2">Exakt vad du tittar på</h2>
          </div>
          <div className="col-span-12 md:col-span-8 space-y-4 text-sm text-muted">
            <p><span className="text-ink">Definition.</span> {metric.description_sv}</p>
            <p><span className="text-ink">Källa.</span> {source?.attribution}. Licens: {source?.license}.</p>
            <p><span className="text-ink">Uppdateringsfrekvens.</span> Automatisk nattlig körning. Varje värde jämförs mot föregående — avvikelser större än 30 % hålls tillbaka för granskning.</p>
            <p><span className="text-ink">API-mall.</span> <code className="num">{metric.source_url_template}</code></p>
          </div>
        </div>
      </section>
    </>
  );
}
