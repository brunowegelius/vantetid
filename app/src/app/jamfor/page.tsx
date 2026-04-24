import Link from "next/link";
import { METRICS, REGIONS } from "@/lib/catalog";
import { getLatestAcrossRegions } from "@/lib/data";
import { formatValueBare, performanceScore, unitLabel } from "@/lib/format";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const revalidate = 1800;
export const dynamic = "force-dynamic";

const TIER_COLOR = ["var(--ink-4)", "#FF4D3D", "#F4B63F", "#2F4DE3", "#2E7D6F"] as const;
function tier(v: number | null): 0 | 1 | 2 | 3 | 4 {
  if (v == null) return 0;
  if (v >= 0.85) return 4;
  if (v >= 0.6)  return 3;
  if (v >= 0.4)  return 2;
  return 1;
}

export default async function ComparePage() {
  const allSeries = await Promise.all(METRICS.map(m => getLatestAcrossRegions(m.slug)));

  const matrix: Record<string, Record<string, { value: number | null; score: number | null }>> = {};
  for (const list of allSeries) {
    const slug = list[0]?.metric.slug;
    if (!slug) continue;
    matrix[slug] = {};
    for (const s of list) {
      const v = s.latest?.value ?? null;
      matrix[slug][s.region.id] = { value: v, score: performanceScore(v, s.metric) };
    }
  }

  const ranked = [...REGIONS].filter(r => r.id !== "0000").map(r => {
    const scores = METRICS.map(m => matrix[m.slug]?.[r.id]?.score).filter(s => s != null) as number[];
    return { region: r, avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
  }).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

  return (
    <>
      <Nav />

      <section style={{ padding: "20px 28px 40px" }}>
        <div className="station" style={{ padding: 40 }}>
          <div className="caps" style={{ color: "var(--c5)", marginBottom: 18 }}>
            FIG 00 · Matrisen · {METRICS.length} mätetal × {REGIONS.length - 1} regioner
          </div>
          <h1 className="display-black" style={{ fontSize: 80, lineHeight: 0.92 }}>
            Jämför<br/>regioner.
          </h1>
          <p style={{ marginTop: 22, maxWidth: 600, fontSize: 15, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Alla mätetal × alla regioner. Färgen visar tier-indelningen mot vårdgarantimål eller bästa/sämsta värdet bland regionerna. Klicka på ett mätetal för detaljerad ranking.
          </p>
        </div>
      </section>

      <section style={{ padding: "0 28px 40px" }}>
        <div className="station" style={{ padding: 28, overflow: "auto" }}>
          <div className="caps" style={{ color: "var(--ink-3)", marginBottom: 16 }}>
            FIG 01 · matrisen
          </div>
          <table
            style={{
              minWidth: "100%",
              fontSize: 13,
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
            <thead>
              <tr>
                <th
                  className="caps"
                  style={{
                    textAlign: "left",
                    padding: "8px 16px 8px 0",
                    verticalAlign: "bottom",
                    position: "sticky",
                    left: 0,
                    background: "var(--bg)",
                    color: "var(--ink-3)",
                    minWidth: 180,
                    zIndex: 2,
                  }}
                >
                  Region
                </th>
                {METRICS.map(m => (
                  <th
                    key={m.slug}
                    style={{
                      textAlign: "right",
                      padding: "8px 12px",
                      verticalAlign: "bottom",
                      whiteSpace: "nowrap",
                      minWidth: 110,
                    }}
                  >
                    <Link href={`/matt/${m.slug}`} className="link-ink" style={{ fontSize: 12, fontWeight: 500 }}>
                      {m.short_name_sv}
                    </Link>
                    <div className="mono" style={{ color: "var(--ink-4)", fontSize: 10.5, marginTop: 3 }}>
                      {unitLabel(m.unit)}
                    </div>
                  </th>
                ))}
              </tr>
              <tr>
                <td colSpan={METRICS.length + 1}>
                  <div style={{ borderTop: "1px solid var(--ink)" }} />
                </td>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ region, avg }) => (
                <tr key={region.id}>
                  <td
                    style={{
                      padding: "10px 16px 10px 0",
                      position: "sticky",
                      left: 0,
                      background: "var(--bg)",
                      borderBottom: "1px solid var(--bg-2)",
                    }}
                  >
                    <Link
                      href={`/region/${region.slug}`}
                      className="link-ink display"
                      style={{ fontSize: 14 }}
                    >
                      {region.short_name}
                    </Link>
                    <div
                      className="mono"
                      style={{
                        fontSize: 10.5,
                        color: TIER_COLOR[tier(avg)],
                        letterSpacing: "0.05em",
                        marginTop: 2,
                      }}
                    >
                      rank {avg != null ? Math.round(avg * 100) : "—"}
                    </div>
                  </td>
                  {METRICS.map(m => {
                    const cell = matrix[m.slug]?.[region.id];
                    const v = cell?.value ?? null;
                    const t = tier(cell?.score ?? null);
                    return (
                      <td
                        key={m.slug}
                        className="mono"
                        style={{
                          textAlign: "right",
                          padding: "10px 12px",
                          whiteSpace: "nowrap",
                          color: TIER_COLOR[t],
                          borderBottom: "1px solid var(--bg-2)",
                        }}
                      >
                        {formatValueBare(v, m.unit)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Footer />
    </>
  );
}
