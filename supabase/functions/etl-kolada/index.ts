// Supabase Edge Function: etl-kolada
// Fetches every active metric with source = Kolada for every region,
// stores raw snapshots (SHA-256 hashed) and append-only measurements,
// runs validation rules, and flips is_latest only after passing them.
//
// Deploy:  supabase functions deploy etl-kolada --no-verify-jwt
// Schedule via pg_cron (see migrations/0003_cron.sql).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type Metric = {
  id: string;
  slug: string;
  source_id: string;
  source_kpi_id: string;
  source_url_template: string;
  unit: string;
  better_direction: "lower" | "higher";
};
type Region = { id: string };
type KoladaRow = {
  kpi: string;
  municipality: string;
  period: number | string;
  values: { gender: "T" | "M" | "K"; count: number; status: string; value: number | null }[];
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DELTA_BLOCK_PCT = 0.30; // 30% swing -> hold for review
const USER_AGENT = "vantetid-etl/0.1 (+https://vantetid.se)";

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function yearBounds(period: string): { start: string; end: string; kind: "year" | "month" } {
  if (/^\d{4}$/.test(period)) return { start: `${period}-01-01`, end: `${period}-12-31`, kind: "year" };
  // YYYYMM (Kolada monthly periods)
  if (/^\d{6}$/.test(period)) {
    const y = period.slice(0, 4), m = period.slice(4, 6);
    const last = new Date(Number(y), Number(m), 0).getDate();
    return { start: `${y}-${m}-01`, end: `${y}-${m}-${String(last).padStart(2, "0")}`, kind: "month" };
  }
  const y = new Date().getUTCFullYear();
  return { start: `${y}-01-01`, end: `${y}-12-31`, kind: "year" };
}

Deno.serve(async (_req) => {
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
    db: { schema: "vantetid" },
    auth: { persistSession: false },
  });

  const { data: source, error: sErr } = await sb.from("sources").select("id").eq("slug", "kolada").single();
  if (sErr || !source) return json({ ok: false, error: "kolada source not found" }, 500);

  const { data: run, error: rErr } = await sb.from("etl_runs")
    .insert({ source_id: source.id, status: "running" })
    .select("id").single();
  if (rErr || !run) return json({ ok: false, error: rErr?.message ?? "run not created" }, 500);
  const runId: string = run.id;

  const stats = { fetched: 0, snapshots: 0, measurements: 0, anomalies_block: 0, anomalies_warn: 0, errors: 0 };

  try {
    const [{ data: metrics }, { data: regions }] = await Promise.all([
      sb.from("metrics").select("id, slug, source_id, source_kpi_id, source_url_template, unit, better_direction")
        .eq("source_id", source.id).eq("is_active", true).order("display_order"),
      sb.from("regions").select("id").order("display_order"),
    ]);

    if (!metrics || !regions) throw new Error("no metrics or regions");

    for (const metric of metrics as Metric[]) {
      const insertedMeasurementIds: number[] = [];

      for (const region of regions as Region[]) {
        const url = (metric.source_url_template ??
          "https://api.kolada.se/v3/data/kpi/{kpi}/municipality/{region}")
          .replaceAll("{kpi}", metric.source_kpi_id)
          .replaceAll("{region}", region.id);

        let payload: { values: KoladaRow[] };
        try {
          const res = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "application/json" } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          payload = await res.json();
          stats.fetched++;
        } catch (e) {
          stats.errors++;
          console.warn("fetch fail", url, String(e));
          continue;
        }

        const body = JSON.stringify(payload);
        const hash = await sha256Hex(body);
        const fetched_at = new Date().toISOString();

        const { data: snap, error: snapErr } = await sb.from("raw_snapshots").insert({
          run_id: runId, source_url: url, fetched_at,
          payload_sha256: hash, payload, bytes: body.length,
        }).select("id").single();
        if (snapErr || !snap) { stats.errors++; continue; }
        stats.snapshots++;

        for (const row of payload.values ?? []) {
          const period = String(row.period);
          const { start, end, kind } = yearBounds(period);
          for (const v of row.values ?? []) {
            const status: "ok" | "missing" | "suppressed" =
              v.status === "Missing" ? "missing" : v.value == null ? "missing" : "ok";

            const { data: inserted, error: mErr } = await sb.from("measurements").insert({
              run_id: runId, snapshot_id: snap.id, metric_id: metric.id, region_id: region.id,
              period, period_kind: kind, period_start: start, period_end: end,
              gender: v.gender, value: v.value, value_count: v.count,
              status, source_url: url, fetched_at,
            }).select("id").single();
            if (mErr || !inserted) { stats.errors++; continue; }
            stats.measurements++;
            insertedMeasurementIds.push(inserted.id);
          }
        }
      }

      // Validation pass per metric: compare each new OK measurement to latest prior OK
      // for (metric, region, period). Block if delta > DELTA_BLOCK_PCT.
      for (const id of insertedMeasurementIds) {
        const { data: m } = await sb.from("measurements").select("*").eq("id", id).single();
        if (!m || m.status !== "ok" || m.value == null) continue;

        const { data: prev } = await sb.from("measurements")
          .select("value, fetched_at")
          .eq("metric_id", m.metric_id).eq("region_id", m.region_id).eq("period", m.period)
          .eq("status", "ok").eq("is_latest", true).neq("id", id)
          .order("fetched_at", { ascending: false }).limit(1).maybeSingle();

        let anomaly: string | null = null;
        if (prev && prev.value != null && Number(prev.value) !== 0) {
          const delta = Math.abs((Number(m.value) - Number(prev.value)) / Number(prev.value));
          if (delta > DELTA_BLOCK_PCT) {
            anomaly = "spike";
            await sb.from("validations").insert({
              run_id: runId, measurement_id: id, rule: "delta>30pct", severity: "block",
              details: { prev: prev.value, next: m.value, delta_pct: Math.round(delta * 1000) / 10 },
            });
            stats.anomalies_block++;
          }
        }

        if (!anomaly) {
          // Mark prior is_latest false for this (metric, region, period), then set current true.
          await sb.from("measurements").update({ is_latest: false })
            .eq("metric_id", m.metric_id).eq("region_id", m.region_id).eq("period", m.period);
          await sb.from("measurements").update({ is_latest: true }).eq("id", id);
        } else {
          await sb.from("measurements").update({ anomaly_flag: anomaly }).eq("id", id);
        }
      }
    }

    const overallStatus = stats.anomalies_block > 0 ? "validation_hold" : "success";
    await sb.from("etl_runs").update({
      status: overallStatus, finished_at: new Date().toISOString(), stats,
    }).eq("id", runId);

    return json({ ok: true, run_id: runId, status: overallStatus, stats });
  } catch (e) {
    await sb.from("etl_runs").update({
      status: "failed", finished_at: new Date().toISOString(),
      error: e instanceof Error ? e.message : String(e), stats,
    }).eq("id", runId);
    return json({ ok: false, error: String(e), stats }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status, headers: { "content-type": "application/json" },
  });
}
