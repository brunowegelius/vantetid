import { notFound } from "next/navigation";
import Link from "next/link";
import { METRICS, CATEGORY_LABEL, getRegionBySlug } from "@/lib/catalog";
import { getAllLatestForRegion, lastUpdatedOf } from "@/lib/data";
import { formatDate, formatValueBare, performanceScore, formatPeriod, unitLabel } from "@/lib/format";
import { Sparkline } from "@/components/Sparkline";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";


import { REGIONS } from "@/lib/catalog";
export async function generateStaticParams() { return REGIONS.map(r => ({ slug: r.slug })); }
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

const TIER_COLOR = ["var(--ink-4)", "var(--c1)", "var(--c2)", "var(--c4)", "var(--c3)"] as const;
function tier(v: number | null): 0 | 1 | 2 | 3 | 4 {
  if (v == null) return 0;
  if (v >= 0.85) return 4;
  if (v >= 0.6)  return 3;
  if (v >= 0.4)  return 2;
  return 1;
}

export const revalidate = 1800;

export default async function RegionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) notFound();
  const series = await getAllLatestForRegion(slug);
  const lastUpdated = lastUpdatedOf(series);

  const scores = series.map(s => performanceScore(s.latest?.value ?? null, s.metric)).filter(Boolean) as number[];
  const composite = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const compositeTier = tier(composite);

  return (
    <>
      <Nav />

      <section style={{ padding: "20px 28px 40px" }}>
        <div className="station" style={{ padding: 40 }}>
          <div className="caps" style={{ color: TIER_COLOR[compositeTier], marginBottom: 18 }}>
            FIG 00 · Region · Kolada muni-id {region.id}
          </div>
          <h1 className="display-black" style={{ fontSize: 88, lineHeight: 0.92 }}>
            {region.name}.
          </h1>
          <p style={{ marginTop: 22, maxWidth: 640, fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Sammanställda väntetidsmått för {region.name.toLowerCase()}. Alla värden är senaste rapporterade publika siffra per mätetal, direkt från respektive källas öppna data.
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
              <div className="caps" style={{ color: "var(--ink-3)" }}>Senast uppdaterad</div>
              <div className="display" style={{ fontSize: 20, marginTop: 6 }}>
                {lastUpdated ? formatDate(lastUpdated) : "—"}
              </div>
            </div>
            <div>
              <div className="caps" style={{ color: "var(--ink-3)" }}>Sammanvägd rank</div>
              <div
                className="display-black"
                style={{ fontSize: 48, lineHeight: 0.9, marginTop: 6, color: TIER_COLOR[compositeTier] }}
              >
                {composite != null ? Math.round(composite * 100) : "—"}
                <span className="mono" style={{ fontSize: 14, color: "var(--ink-3)", marginLeft: 8 }}>
                  / 100
                </span>
              </div>
            </div>
            <div>
              <div className="caps" style={{ color: "var(--ink-3)" }}>Mätetal inräknade</div>
              <div className="display" style={{ fontSize: 20, marginTop: 6 }}>
                {scores.length} / {METRICS.length}
              </div>
            </div>
            <div>
              <div className="caps" style={{ color: "var(--ink-3)" }}>Kolada muni-id</div>
              <div className="mono" style={{ fontSize: 18, marginTop: 6 }}>{region.id}</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "0 28px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
          {METRICS.map((m, i) => {
            const s = series.find(x => x.metric.slug === m.slug)!;
            const v = s.latest?.value ?? null;
            const score = performanceScore(v, m);
            const color = CAT_COLOR[m.category] ?? "var(--c4)";
            const label = (i + 1).toString().padStart(2, "0");
            return (
              <Link
                key={m.slug}
                href={`/matt/${m.slug}`}
                className="station link-ink"
                style={{ padding: 24, display: "block" }}
              >
                <div className="caps" style={{ color }}>
                  FIG {label} · {CATEGORY_LABEL[m.category]}
                </div>
                <div className="display" style={{ fontSize: 18, marginTop: 8, lineHeight: 1.2 }}>
                  {m.short_name_sv}
                </div>
                <div
                  className="display-black"
                  style={{ fontSize: 64, lineHeight: 0.9, marginTop: 18, color }}
                >
                  {formatValueBare(v, m.unit)}
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
                  {unitLabel(m.unit)}
                </div>

                <div style={{ marginTop: 18 }}>
                  <Sparkline
                    points={s.points.slice(-10)}
                    betterDirection={m.better_direction}
                    target={m.target_value}
                    width={320}
                    height={50}
                    color={color}
                  />
                </div>

                {s.latest && (
                  <div
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      color: "var(--ink-3)",
                      marginTop: 16,
                      display: "flex",
                      gap: 14,
                      flexWrap: "wrap",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <span>
                      {formatPeriod(s.latest.period, /^\d{6}$/.test(s.latest.period) ? "month" : "year")}
                    </span>
                    <span>hämtad {formatDate(s.latest.fetched_at)}</span>
                    <span style={{ marginLeft: "auto", color }}>
                      rank {score != null ? Math.round(score * 100) : "—"}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <Footer />
    </>
  );
}
