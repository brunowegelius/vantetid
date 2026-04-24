import { METRICS, REGIONS } from "@/lib/catalog";
import { getLatestAcrossRegions, lastUpdatedOf } from "@/lib/data";
import { performanceScore } from "@/lib/format";
import { AtlasClient, type RegionAgg } from "@/components/AtlasClient";
import type { Series } from "@/lib/types";

export const revalidate = 1800;
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // One call per metric -> all regions. 11 parallel calls.
  const seriesByMetric: Series[][] = await Promise.all(
    METRICS.map(m => getLatestAcrossRegions(m.slug)),
  );

  const regionAgg: RegionAgg[] = REGIONS.filter(r => r.id !== "0000").map(r => {
    const scores: number[] = [];
    for (const list of seriesByMetric) {
      const s = list.find(x => x.region.id === r.id);
      if (!s) continue;
      const sc = performanceScore(s.latest?.value ?? null, s.metric);
      if (sc != null) scores.push(sc);
    }
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      short_name: r.short_name,
      avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    };
  });

  const riketByMetric: Series[] = seriesByMetric
    .map(list => list.find(s => s.region.id === "0000"))
    .filter(Boolean) as Series[];

  const lastUpdated = lastUpdatedOf(riketByMetric);

  return (
    <AtlasClient
      metrics={METRICS}
      regionAgg={regionAgg}
      riketByMetric={riketByMetric}
      lastUpdated={lastUpdated}
    />
  );
}
