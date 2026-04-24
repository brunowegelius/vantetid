import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABEL, getMetricBySlug, getSourceBySlug } from "@/lib/catalog";
import { getLatestAcrossRegions, lastUpdatedOf } from "@/lib/data";
import { RegionTable } from "@/components/RegionTable";
import { Sparkline } from "@/components/Sparkline";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { formatDate, formatValueBare, performanceScore, formatPeriod, unitLabel } from "@/lib/format";


import { METRICS } from "@/lib/catalog";
export async function generateStaticParams() { return METRICS.map(m => ({ slug: m.slug })); }
const CAT_COLOR: Record<string, string> = {
  specialist: "var(--c4)",
  operation:  "var(--c5)",
  bup:        "var(--c6)",
  cancer:     "var(--c1)",
  perception: "var(--c2)",
  capacity:   "var(--c3)",
  primary:    "var(--c7)",
  emergency:  "var(--c1)",
};

export const revalidate = 1800;

export default async function MetricPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const metric = getMetricBySlug(slug);
  if (!metric) notFound();
  const series = await getLatestAcrossRegions(slug);
  const lastUpdated = lastUpdatedOf(series);
  const riket = series.find(s => s.region.id === "0000");
  const source = getSourceBySlug(metric.source_slug);
  const color = CAT_COLOR[metric.category] ?? "var(--c4)";
  const score = performanceScore(riket?.latest?.value ?? null, metric);

  return (
    <>
      <Nav />

      <section style={{ padding: "20px 28px 40px" }}>
        <div className="station" style={{ padding: 40 }}>
          <div className="caps" style={{ color, marginBottom: 18 }}>
            FIG 00 · {CATEGORY_LABEL[metric.category]} · KPI {metric.source_kpi_id}
          </div>
          <h1 className="display-black" style={{ fontSize: 64, lineHeight: 0.95, maxWidth: "18ch" }}>
            {metric.name_sv}
          </h1>
          <p style={{ marginTop: 22, maxWidth: 720, fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {metric.description_sv}
          </p>

          <div
            style={{
              marginTop: 34,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 24,
              paddingTop: 26,
              borderTop: "1px solid var(--ink)",
            }}
          >
            <div>
              <div className="caps" style={{ color: "var(--ink-3)" }}>Uppdaterad</div>
              <div className="display" style={{ fontSize: 20, marginTop: 6 }}>
                {lastUpdated ? formatDate(lastUpdated) : "—"}
              </div>
            </div>
            <div>
              <div className="caps" style={{ color: "var(--ink-3)" }}>Källa</div>
              <div className="display" style={{ fontSize: 20, marginTop: 6 }}>
                {source && (
                  <a href={source.homepage_url} target="_blank" rel="noreferrer" className="link-ink">{source.name}</a>
                )}
              </div>
            </div>
            {metric.target_value != null && (
              <div>
                <div className="caps" style={{ color: "var(--ink-3)" }}>Vårdgarantimål</div>
                <div className="display" style={{ fontSize: 20, marginTop: 6 }}>
                  {metric.unit === "days" ? `${metric.target_value} dagar` : `${metric.target_value} %`}
                </div>
              </div>
            )}
            <div>
              <div className="caps" style={{ color: "var(--ink-3)" }}>Riktning</div>
              <div className="display" style={{ fontSize: 20, marginTop: 6 }}>
                {metric.better_direction === "lower" ? "Lägre är bättre" : "Högre är bättre"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {riket && (
        <section style={{ padding: "0 28px 40px" }}>
          <div className="station" style={{ padding: 40 }}>
            <div className="caps" style={{ color, marginBottom: 20 }}>FIG 01 · Riket senaste värdet</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(260px, 1fr) minmax(320px, 2fr) minmax(240px, 1fr)",
                gap: 40,
                alignItems: "end",
              }}
            >
              <div>
                <div
                  className="display-black"
                  style={{ fontSize: 144, lineHeight: 0.85, color, letterSpacing: "-0.05em" }}
                >
                  {formatValueBare(riket.latest?.value ?? null, metric.unit)}
                </div>
                <div className="mono" style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 10, letterSpacing: "0.06em" }}>
                  {unitLabel(metric.unit)}
                </div>
              </div>
              <div>
                <Sparkline
                  points={riket.points.slice(-12)}
                  betterDirection={metric.better_direction}
                  target={metric.target_value}
                  width={380}
                  height={120}
                  color={color}
                />
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-2)" }}>
                {riket.latest && (
                  <>
                    <div className="caps" style={{ color: "var(--ink-3)" }}>Period</div>
                    <div className="mono" style={{ marginTop: 4 }}>
                      {formatPeriod(riket.latest.period, /^\d{6}$/.test(riket.latest.period) ? "month" : "year")}
                    </div>
                    <div className="caps" style={{ color: "var(--ink-3)", marginTop: 14 }}>Hämtad</div>
                    <div className="mono" style={{ marginTop: 4 }}>{formatDate(riket.latest.fetched_at)}</div>
                    <div className="caps" style={{ color: "var(--ink-3)", marginTop: 14 }}>Rank</div>
                    <div className="mono" style={{ marginTop: 4, color }}>
                      {score != null ? `${Math.round(score * 100)} / 100` : "—"}
                    </div>
                    <a
                      href={riket.latest.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="caps link-ink"
                      style={{ display: "inline-block", marginTop: 18, color: "var(--ink)" }}
                    >
                      direktlänk till källsvar →
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section style={{ padding: "0 28px 40px" }}>
        <div className="station" style={{ padding: 40 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 16,
            }}
          >
            <div>
              <div className="caps" style={{ color: "var(--ink-3)" }}>FIG 02 · Regionranking</div>
              <div className="display-black" style={{ fontSize: 36, lineHeight: 0.95, marginTop: 8 }}>
                Regionerna — rankade.
              </div>
            </div>
            <div className="caps" style={{ color }}>
              {metric.better_direction === "lower" ? "Lägre är bättre" : "Högre är bättre"}
            </div>
          </div>
          <RegionTable rows={series} unit={metric.unit} />
        </div>
      </section>

      <section style={{ padding: "0 28px 40px" }}>
        <div className="station" style={{ padding: 40 }}>
          <div className="caps" style={{ color: "var(--c3)", marginBottom: 14 }}>FIG 03 · Transparens</div>
          <div className="display" style={{ fontSize: 28, lineHeight: 1.05, marginBottom: 22 }}>
            Exakt vad du tittar på.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: 14 }}>
              <div className="caps" style={{ color }}>Definition</div>
              <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, marginTop: 6 }}>
                {metric.description_sv}
              </p>
            </div>
            <div style={{ borderLeft: `3px solid var(--c3)`, paddingLeft: 14 }}>
              <div className="caps" style={{ color: "var(--c3)" }}>Källa</div>
              <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, marginTop: 6 }}>
                {source?.attribution}. Licens: {source?.license}.
              </p>
            </div>
            <div style={{ borderLeft: `3px solid var(--c1)`, paddingLeft: 14 }}>
              <div className="caps" style={{ color: "var(--c1)" }}>Frekvens</div>
              <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, marginTop: 6 }}>
                Nattlig körning. Värden som avviker {">"} 30 % hålls tillbaka för granskning.
              </p>
            </div>
            <div style={{ borderLeft: `3px solid var(--c4)`, paddingLeft: 14 }}>
              <div className="caps" style={{ color: "var(--c4)" }}>API-mall</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-2)", marginTop: 6, wordBreak: "break-all" }}>
                {metric.source_url_template}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 28 }}>
            <Link href="/jamfor" className="caps link-ink" style={{ color: "var(--ink)", borderBottom: "1px solid var(--ink)" }}>
              Se alla mätetal i matrisen →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
