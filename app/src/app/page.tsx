import Link from "next/link";
import { METRICS, CATEGORY_LABEL } from "@/lib/catalog";
import { getSeries, lastUpdatedOf } from "@/lib/data";
import { MetricTile } from "@/components/MetricTile";
import { formatDate, formatPeriod, formatValue, performanceScore, scoreColor } from "@/lib/format";
import { Sparkline } from "@/components/Sparkline";

export const revalidate = 1800;

// headline metrics — one representative per category, in editorial order
const HEADLINE = [
  "specialist-forsta-kontakt-vantande-median",
  "operation-vantande-median",
  "bup-forsta-besok-inom-90-dagar",
  "upplevd-vantetid-vardcentral",
  "prostatacancer-forsta-besok-14d",
];

export default async function HomePage() {
  const headline = await Promise.all(
    HEADLINE.map(slug => getSeries(slug, "riket").then(s => s!))
  );
  const lastUpdated = lastUpdatedOf(headline);

  // Group all 11 metrics for the full list
  const byCategory = METRICS.reduce<Record<string, typeof METRICS>>((acc, m) => {
    (acc[m.category] ||= []).push(m); return acc;
  }, {});
  const rikets = await Promise.all(METRICS.map(m => getSeries(m.slug, "riket").then(s => s!)));

  return (
    <>
      {/* Hero */}
      <section className="grid-wide pt-10 pb-16">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-9">
            <h1 className="serif text-5xl md:text-7xl leading-[0.95] tracking-[-0.01em]">
              Så ser väntetiderna ut<br />i svensk vård just nu.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted">
              En öppen sammanställning av all tillgänglig, offentlig data om väntetider.
              Automatiskt uppdaterad. Varje siffra spårbar till sin källa.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-3 lg:pl-6">
            <div className="text-2xs uppercase tracking-wider text-subtle">Senast uppdaterad</div>
            <div className="num mt-1 text-lg">{lastUpdated ? formatDate(lastUpdated) : "—"}</div>
            <div className="text-2xs uppercase tracking-wider text-subtle mt-6">Regioner</div>
            <div className="num mt-1 text-lg">21 + Riket</div>
            <div className="text-2xs uppercase tracking-wider text-subtle mt-6">Mätetal</div>
            <div className="num mt-1 text-lg">{METRICS.length}</div>
          </div>
        </div>
      </section>

      {/* Headline numbers — Riket */}
      <section className="grid-wide pt-6 pb-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="serif text-2xl">Riket just nu</h2>
          <div className="text-2xs uppercase tracking-wider text-subtle">Senaste rapporterade värde</div>
        </div>
        <div className="rule mb-0" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {headline.map(s => (
            <div key={s.metric.slug}
                 className="py-8 border-b border-transparent relative">
              <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "#E4E0D6" }} />
              <div className="text-2xs uppercase tracking-wider text-subtle">{s.metric.short_name_sv}</div>
              <div className="mt-3 flex items-baseline gap-3">
                <div className="serif num text-6xl leading-none"
                     style={{ color: scoreColor(performanceScore(s.latest?.value ?? null, s.metric)) }}>
                  {formatValue(s.latest?.value ?? null, s.metric.unit).split(" ")[0]}
                </div>
                <div className="text-sm text-muted">
                  {formatValue(s.latest?.value ?? null, s.metric.unit).split(" ").slice(1).join(" ") || s.metric.unit}
                </div>
              </div>
              <div className="mt-5"><Sparkline
                points={s.points.slice(-8)}
                betterDirection={s.metric.better_direction}
                target={s.metric.target_value}
              /></div>
              {s.latest && (
                <div className="mt-4 text-2xs uppercase tracking-wider text-subtle flex gap-4">
                  <span>{formatPeriod(s.latest.period, /^\d{6}$/.test(s.latest.period) ? "month" : "year")}</span>
                  <a className="link-ink" href={s.latest.source_url} target="_blank" rel="noreferrer">källa</a>
                  <Link className="link-ink ml-auto" href={`/matt/${s.metric.slug}`}>Jämför regioner →</Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* All metrics by category */}
      <section className="grid-wide pb-16">
        <h2 className="serif text-2xl mb-6">Alla mätetal</h2>
        <div className="rule" />
        {Object.entries(byCategory).map(([cat, metrics]) => (
          <div key={cat} className="py-10">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-3">
                <h3 className="serif text-xl">{CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL]}</h3>
              </div>
              <div className="col-span-12 md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
                {metrics.map(m => {
                  const s = rikets.find(r => r.metric.slug === m.slug)!;
                  return (
                    <Link href={`/matt/${m.slug}`} key={m.slug} className="block link-ink">
                      <div className="py-5 relative">
                        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "#E4E0D6" }} />
                        <div className="flex items-baseline justify-between gap-4">
                          <div className="pr-4">
                            <div className="text-sm">{m.short_name_sv}</div>
                            <div className="text-2xs uppercase tracking-wider text-subtle mt-1">
                              KPI {m.source_kpi_id}
                            </div>
                          </div>
                          <div className="serif num text-3xl whitespace-nowrap"
                               style={{ color: scoreColor(performanceScore(s.latest?.value ?? null, m)) }}>
                            {formatValue(s.latest?.value ?? null, m.unit).split(" ")[0]}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="rule mt-2" />
          </div>
        ))}
      </section>

      {/* Transparency footer */}
      <section className="grid-wide pb-16">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-5">
            <h2 className="serif text-2xl leading-tight">Hur vi garanterar att siffrorna stämmer</h2>
          </div>
          <div className="col-span-12 md:col-span-7 text-muted space-y-4">
            <p>
              Varje datapunkt i systemet lagras tillsammans med sin ursprungs-URL, tidpunkten den
              hämtades, och en SHA-256-hash av det exakta svaret från källan. Inget skrivs över —
              historiken är append-only.
            </p>
            <p>
              Varje automatisk körning jämförs mot föregående. Värden som avviker mer än 30 %
              hålls tillbaka och publiceras inte förrän de granskats manuellt.
            </p>
            <p>
              <Link href="/om-data" className="text-ink underline-offset-2 hover:underline">Läs mer om metodologin →</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
