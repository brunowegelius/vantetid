// Unified data layer.
// If NEXT_PUBLIC_SUPABASE_URL is set: read from Supabase PostgREST (authoritative).
// Otherwise: fetch live from Kolada v3 directly with Next.js fetch caching.
// Same return types either way so page components never branch on the source.

import { METRICS, REGIONS, getMetricBySlug, getRegionBySlug } from "./catalog";
import type { Metric, Region, Series } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Revalidate on the server every 30 min for Kolada fallback; Supabase path
// uses its own caching on PostgREST. ISR on the pages is set separately.
const REVAL = 60 * 30;

type KoladaResponse = {
  values: {
    kpi: string; municipality: string; period: number | string;
    values: { gender: "T" | "M" | "K"; count: number; status: string; value: number | null }[];
  }[];
};

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
    latest: last ? {
      period: last.period, value: last.value,
      source_url: url, fetched_at: new Date().toISOString(),
    } : null,
  };
}

async function fetchSupabaseLatest(metric: Metric, region: Region): Promise<Series | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON) return null;
  const endpoint = `${SUPABASE_URL}/rest/v1/measurements_latest` +
    `?select=period,period_start,value,source_url,fetched_at` +
    `&metric_id=eq.${encodeURIComponent(metric.id)}` +
    `&region_id=eq.${encodeURIComponent(region.id)}` +
    `&gender=eq.T` +
    `&order=period.asc`;
  try {
    const res = await fetch(endpoint, {
      headers: { apikey: SUPABASE_ANON, authorization: `Bearer ${SUPABASE_ANON}` },
      next: { revalidate: REVAL, tags: ["measurements"] },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    const points = rows.map((r: { period: string; period_start: string; value: number | null }) => ({
      period: r.period, period_start: r.period_start, value: r.value,
    }));
    const okPoints = points.filter((p: { value: number | null }) => p.value != null);
    const last = rows.at(-1);
    return {
      metric, region, points,
      latest: last && last.value != null ? {
        period: last.period, value: last.value,
        source_url: last.source_url, fetched_at: last.fetched_at,
      } : okPoints.at(-1) ?? null,
    };
  } catch {
    return null;
  }
}

export async function getSeries(metricSlug: string, regionSlug: string): Promise<Series | null> {
  const metric = getMetricBySlug(metricSlug);
  const region = getRegionBySlug(regionSlug);
  if (!metric || !region) return null;
  const fromDb = await fetchSupabaseLatest(metric, region);
  if (fromDb) return fromDb;
  return fetchKolada(metric, region);
}

export async function getLatestAcrossRegions(metricSlug: string): Promise<Series[]> {
  const metric = getMetricBySlug(metricSlug);
  if (!metric) return [];
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
