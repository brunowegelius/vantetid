import Link from "next/link";
import { METRICS, REGIONS, CATEGORY_LABEL } from "@/lib/catalog";
import { getLatestAcrossRegions } from "@/lib/data";
import { formatValueBare, performanceScore, scoreColor, unitLabel } from "@/lib/format";

export const revalidate = 1800;

export default async function ComparePage() {
  // Pull latest for all 11 metrics across all 22 regions (~242 data points)
  const allSeries = await Promise.all(METRICS.map(m => getLatestAcrossRegions(m.slug)));

  // matrix[metric_slug][region_id] = { value, score }
  const matrix: Record<string, Record<string, { value: number | null; score: number | null }>> = {};
  for (const list of allSeries) {
    const slug = list[0]?.metric.slug;
    if (!slug) continue;
    matrix[slug] = {};
    for (const s of list) {
      const v = s.latest?.value ?? null;
      matrix[slug][s.region.id] = {
        value: v,
        score: performanceScore(v, s.metric),
      };
    }
  }

  // Rank regions by average performance score
  const ranked = [...REGIONS].filter(r => r.id !== "0000").map(r => {
    const scores = METRICS.map(m => matrix[m.slug]?.[r.id]?.score).filter(s => s != null) as number[];
    return { region: r, avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
  }).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

  return (
    <>
      <section className="grid-wide pt-10 pb-10">
        <div className="text-2xs uppercase tracking-wider text-subtle mb-3">
          <Link href="/" className="link-ink">Översikt</Link> / Jämför
        </div>
        <h1 className="serif text-5xl md:text-6xl leading-[1] tracking-[-0.01em]">Jämför regioner.</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Alla mätetal × alla regioner. Färgen visar hur värdet står sig mot vårdgarantimålet eller
          mot bästa/sämsta värdet bland regionerna. Klicka på ett mätetal för att se detaljerad ranking.
        </p>
      </section>

      <section className="grid-wide pb-14">
        <div className="rule" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm mt-6" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr className="text-2xs uppercase tracking-wider text-subtle">
                <th className="text-left py-2 pr-4 align-bottom sticky left-0 bg-paper z-10" style={{ minWidth: 180 }}>Region</th>
                {METRICS.map(m => (
                  <th key={m.slug} className="text-right py-2 px-3 align-bottom whitespace-nowrap" style={{ minWidth: 110 }}>
                    <Link href={`/matt/${m.slug}`} className="link-ink">{m.short_name_sv}</Link>
                    <div className="text-subtle font-normal normal-case tracking-normal">{unitLabel(m.unit)}</div>
                  </th>
                ))}
              </tr>
              <tr><td colSpan={METRICS.length + 1}><div className="rule" /></td></tr>
            </thead>
            <tbody>
              {ranked.map(({ region, avg }) => (
                <tr key={region.id}>
                  <td className="py-2 pr-4 sticky left-0 bg-paper z-10">
                    <Link href={`/region/${region.slug}`} className="link-ink">{region.short_name}</Link>
                    <div className="text-2xs uppercase tracking-wider text-subtle num">
                      rank {avg != null ? Math.round(avg * 100) : "—"}
                    </div>
                  </td>
                  {METRICS.map(m => {
                    const cell = matrix[m.slug]?.[region.id];
                    const v = cell?.value ?? null;
                    return (
                      <td key={m.slug} className="text-right py-2 px-3 num whitespace-nowrap"
                          style={{ color: scoreColor(cell?.score ?? null) }}>
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
    </>
  );
}
