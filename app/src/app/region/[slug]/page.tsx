import { notFound } from "next/navigation";
import Link from "next/link";
import { REGIONS, METRICS, CATEGORY_LABEL, getRegionBySlug } from "@/lib/catalog";
import { getAllLatestForRegion, lastUpdatedOf } from "@/lib/data";
import { formatDate, formatValue, performanceScore, scoreColor, formatPeriod } from "@/lib/format";
import { Sparkline } from "@/components/Sparkline";

export const revalidate = 1800;
export async function generateStaticParams() {
  return REGIONS.map(r => ({ slug: r.slug }));
}
export default async function RegionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) notFound();
  const series = await getAllLatestForRegion(slug);
  const lastUpdated = lastUpdatedOf(series);

  // Composite score: mean of performance scores on headline metrics (lower = worse)
  const scores = series.map(s => performanceScore(s.latest?.value ?? null, s.metric)).filter(Boolean) as number[];
  const composite = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  return (
    <>
      <section className="grid-wide pt-10 pb-12">
        <div className="text-2xs uppercase tracking-wider text-subtle mb-3">
          <Link href="/" className="link-ink">Översikt</Link> / Region
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <h1 className="serif text-5xl md:text-6xl leading-[1] tracking-[-0.01em]">{region.name}</h1>
            <p className="mt-4 max-w-xl text-muted">
              Sammanställda väntetidsmått för {region.name.toLowerCase()}. Alla värden är senaste rapporterade
              publika siffra per mätetal, hämtade från respektive källas öppna data.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:pl-6">
            <div className="text-2xs uppercase tracking-wider text-subtle">Senast uppdaterad</div>
            <div className="num mt-1 text-lg">{lastUpdated ? formatDate(lastUpdated) : "—"}</div>
            <div className="text-2xs uppercase tracking-wider text-subtle mt-6">Sammanvägd rank</div>
            <div className="num mt-1 text-lg" style={{ color: scoreColor(composite) }}>
              {composite != null ? `${Math.round(composite * 100)} / 100` : "—"}
            </div>
            <div className="text-2xs uppercase tracking-wider text-subtle mt-6">Kolada muni-id</div>
            <div className="num mt-1 text-lg">{region.id}</div>
          </div>
        </div>
      </section>

      <section className="grid-wide pb-16">
        <div className="rule" />
        {METRICS.map(m => {
          const s = series.find(x => x.metric.slug === m.slug)!;
          const v = s.latest?.value ?? null;
          const score = performanceScore(v, m);
          return (
            <article key={m.slug} className="py-10 relative">
              <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "#E4E0D6" }} />
              <div className="grid grid-cols-12 gap-6 items-start">
                <div className="col-span-12 md:col-span-3">
                  <div className="text-2xs uppercase tracking-wider text-subtle">
                    {CATEGORY_LABEL[m.category]}
                  </div>
                  <Link href={`/matt/${m.slug}`} className="link-ink">
                    <h3 className="serif text-xl mt-1 leading-snug">{m.short_name_sv}</h3>
                  </Link>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <div className="serif num text-6xl leading-none" style={{ color: scoreColor(score) }}>
                    {formatValue(v, m.unit).split(" ")[0]}
                  </div>
                  <div className="text-sm text-muted mt-2">
                    {formatValue(v, m.unit).split(" ").slice(1).join(" ") || m.unit}
                  </div>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <Sparkline
                    points={s.points.slice(-8)}
                    betterDirection={m.better_direction}
                    target={m.target_value}
                    width={260}
                  />
                </div>
                <div className="col-span-12 md:col-span-3 text-sm text-muted">
                  <p>{m.description_sv}</p>
                  {s.latest && (
                    <div className="mt-3 text-2xs uppercase tracking-wider text-subtle flex flex-wrap gap-3">
                      <span>{formatPeriod(s.latest.period, /^\d{6}$/.test(s.latest.period) ? "month" : "year")}</span>
                      <span>hämtad {formatDate(s.latest.fetched_at)}</span>
                      <a className="link-ink" href={s.latest.source_url} target="_blank" rel="noreferrer">källa</a>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
