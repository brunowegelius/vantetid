// Unified data layer.
// If NEXT_PUBLIC_SUPABASE_URL is set: read from our Supabase PostgREST view
// (authoritative — every row is auditable, includes fetched_at + source_url).
// Otherwise: fall back to Kolada v3 directly so the site still renders in dev.

import { METRICS, REGIONS, getMetricBySlug, getRegionBySlug } from "./catalog";
import type { Metric, Region, Series } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const REVAL = 60 * 30; // 30 min ISR

type KoladaResponse = {
  values: {
    kpi: string; municipality: string; period: number | string;
    values: { gender: "T" | "M" | "K"; count: number; status: string; value: number | null }[];
  }[];
};

type SupabaseRow = {
  metric_slug: string;
  region_slug: string;
  region_id: string;
  period: string;
  period_start: string;
  value: number | null;
  source_url: string;
  fetched_at: string;
};

function sbHeaders() {
  return {
    apikey: SUPABASE_ANON!,
    authorization: `Bearer ${SUPABASE_ANON}`,
    "accept-profile": "vantetid",
  };
}

async function fetchSupabaseSeries(metric: Metric, region: Region): Promise<Series | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON) return null;
  const u = `${SUPABASE_URL}/rest/v1/series_latest` +
    `?select=period,period_start,value,source_url,fetched_at` +
    `&metric_slug=eq.${encodeURIComponent(metric.slug)}` +
    `&region_slug=eq.${encodeURIComponent(region.slug)}` +
    `&order=period.asc`;
  try {
    const res = await fetch(u, { headers: sbHeaders(), next: { revalidate: REVAL } });
    if (!res.ok) return null;
    const rows: SupabaseRow[] = await res.json();
    if (rows.length === 0) return null;
    const points = rows.map(r => ({ period: r.period, period_start: r.period_start, value: r.value }));
    const last = [...rows].filter(r => r.value != null).at(-1) ?? rows.at(-1)!;
    return {
      metric, region, points,
      latest: {
        period: last.period, value: last.value,
        source_url: last.source_url, fetched_at: last.fetched_at,
      },
    };
  } catch { return null; }
}

async function fetchKolada(metric: Metric, region: Region): Promise<Series> {
  const url = metric.source_url_template.replaceAll("{region}", region.id);
  const res = await fetch(url, { next: { revalidate: REVAL } });
  const payload: KoladaResponse = await res.json();
  const points = (payload.values ?? []).map(row => {
    const t = row.values.find(v => v.gender === "T") ?? row.values[0];
    const period = String(row.period);
    const period_start = /^\d{4}$/.test(period) ? `${period}-01-01`
      : /^\d{6}$/.test(period) ? `${period.slice(0,4)}-${period.slice(4,6)}-01`
      : period;
    return { period, period_start, value: t?.value ?? null };
  }).sort((a, b) => a.period.localeCompare(b.period));
  const okPoints = points.filter(p => p.value != null);
  const last = okPoints.at(-1) ?? null;
  return {
    metric, region, points,
    latest: last ? { period: last.period, value: last.value, source_url: url, fetched_at: new Date().toISOString() } : null,
  };
}

export async function getSeries(metricSlug: string, regionSlug: string): Promise<Series | null> {
  const metric = getMetricBySlug(metricSlug);
  const region = getRegionBySlug(regionSlug);
  if (!metric || !region) return null;
  const fromDb = await fetchSupabaseSeries(metric, region);
  if (fromDb) return fromDb;
  return fetchKolada(metric, region);
}

export async function getLatestAcrossRegions(metricSlug: string): Promise<Series[]> {
  return Promise.all(REGIONS.map(r => getSeries(metricSlug, r.slug).then(s => s!)));
}

export async function getAllLatestForRegion(regionSlug: string): Promise<Series[]> {
  return Promise.all(METRICS.map(m => getSeries(m.slug, regionSlug).then(s => s!)));
}

export function lastUpdatedOf(seriesList: Series[]): string | null {
  const times = seriesList.map(s => s.latest?.fetched_at).filter(Boolean) as string[];
  if (times.length === 0) return null;
  return times.reduce((a, b) => (a > b ? a : b));
}
