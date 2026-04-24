"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import type { Metric, Series } from "@/lib/types";
import { CATEGORY_LABEL, SOURCES } from "@/lib/catalog";
import { formatDate, formatPeriod, formatValueBare, performanceScore, unitLabel } from "@/lib/format";

const P = {
  c1: "#FF4D3D", c2: "#F4B63F", c3: "#2E7D6F", c4: "#2F4DE3",
  c5: "#8B5FBF", c6: "#E66FAE", c7: "#5B6B80",
} as const;

const CAT_COLOR: Record<string, string> = {
  specialist: P.c4,
  operation:  P.c5,
  bup:        P.c6,
  cancer:     P.c1,
  perception: P.c2,
  capacity:   P.c3,
  primary:    P.c7,
  emergency:  P.c1,
};

const REGION_GEO: Record<string, { lat: number; lon: number }> = {
  "0001": { lat: 59.33, lon: 18.07 },
  "0003": { lat: 59.86, lon: 17.64 },
  "0004": { lat: 58.75, lon: 17.01 },
  "0005": { lat: 58.41, lon: 15.62 },
  "0006": { lat: 57.78, lon: 14.16 },
  "0007": { lat: 56.88, lon: 14.81 },
  "0008": { lat: 56.66, lon: 16.36 },
  "0009": { lat: 57.64, lon: 18.30 },
  "0010": { lat: 56.16, lon: 15.59 },
  "0012": { lat: 55.60, lon: 13.00 },
  "0013": { lat: 56.67, lon: 12.86 },
  "0014": { lat: 57.71, lon: 11.97 },
  "0017": { lat: 59.40, lon: 13.51 },
  "0018": { lat: 59.27, lon: 15.21 },
  "0019": { lat: 59.61, lon: 16.55 },
  "0020": { lat: 60.61, lon: 15.63 },
  "0021": { lat: 60.67, lon: 17.14 },
  "0022": { lat: 62.63, lon: 17.94 },
  "0023": { lat: 63.18, lon: 14.64 },
  "0024": { lat: 63.83, lon: 20.26 },
  "0025": { lat: 65.58, lon: 22.16 },
};

export type RegionAgg = {
  id: string; slug: string; name: string; short_name: string;
  avg: number | null;
};

type Props = {
  metrics: Metric[];
  regionAgg: RegionAgg[];
  riketByMetric: Series[];
  lastUpdated: string | null;
};

function scoreTier(v: number | null): 0 | 1 | 2 | 3 | 4 {
  if (v == null) return 0;
  if (v >= 0.85) return 4;
  if (v >= 0.6)  return 3;
  if (v >= 0.4)  return 2;
  return 1;
}
const TIER_COLOR = ["var(--ink-4)", P.c1, P.c2, P.c4, P.c3];

// ——————————————————————————————————————————————
// Visualizations

function Sparkline({
  points, betterDirection, target, width = 320, height = 56, color = "var(--ink)",
}: {
  points: { period: string; value: number | null }[];
  betterDirection: "lower" | "higher";
  target?: number | null;
  width?: number; height?: number; color?: string;
}) {
  const clean = points.filter(p => p.value != null) as { period: string; value: number }[];
  if (clean.length < 2) return <div className="mono" style={{fontSize:10,color:"var(--ink-4)"}}>otillräcklig historik</div>;
  const vals = clean.map(p => p.value);
  const min = Math.min(...vals, target ?? Infinity);
  const max = Math.max(...vals, target ?? -Infinity);
  const pad = 4;
  const x = (i: number) => pad + (i / (clean.length - 1)) * (width - pad * 2);
  const y = (v: number) => {
    const t = (v - min) / Math.max(max - min, 1e-9);
    const n = betterDirection === "lower" ? t : 1 - t;
    return pad + n * (height - pad * 2);
  };
  const d = clean.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const last = clean.at(-1)!;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {target != null && (
        <line x1={pad} x2={width - pad} y1={y(target)} y2={y(target)}
              stroke="var(--ink-4)" strokeDasharray="2 3" strokeWidth={1} />
      )}
      <path d={d} fill="none" stroke={color} strokeWidth={1.75} />
      <circle cx={x(clean.length - 1)} cy={y(last.value)} r={3} fill={color} />
    </svg>
  );
}

function BubbleMap({
  regions, W = 440, H = 620,
}: {
  regions: (RegionAgg & { lat: number; lon: number })[];
  W?: number; H?: number;
}) {
  const lonMin = 10.5, lonMax = 24.5, latMin = 55.0, latMax = 69.0;
  const project = (lat: number, lon: number): [number, number] => [
    ((lon - lonMin) / (lonMax - lonMin)) * W,
    H - ((lat - latMin) / (latMax - latMin)) * H,
  ];
  const [hover, setHover] = useState<string | null>(null);
  const sweden = "M 180 20 Q 230 50 240 100 Q 250 140 220 180 Q 260 220 275 270 Q 290 320 265 370 Q 255 420 230 460 Q 210 500 195 540 Q 175 570 145 580 Q 115 560 115 520 Q 95 475 110 430 Q 85 395 100 355 Q 75 310 95 270 Q 70 230 85 190 Q 95 150 125 120 Q 145 80 165 50 Q 172 30 180 20 Z";
  return (
    <svg viewBox={`-10 -10 ${W + 100} ${H + 30}`} width={W + 80} height={H + 20}>
      <path d={sweden} fill="var(--bg-2)" />
      {regions.map(r => {
        const [x, y] = project(r.lat, r.lon);
        const tier = scoreTier(r.avg);
        const rad = r.avg != null ? 10 + r.avg * 22 : 8;
        const active = hover === r.id;
        return (
          <g key={r.id} onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)} style={{ cursor: "default" }}>
            <circle cx={x} cy={y} r={rad} fill={TIER_COLOR[tier]} fillOpacity={active ? 0.98 : 0.65} stroke={active ? "var(--ink)" : "none"} strokeWidth={1.5} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={rad > 16 ? 10 : 9} fill={tier >= 3 ? "var(--bg)" : "var(--ink)"} fontWeight={600}>
              {rad > 18 ? r.short_name : ""}
            </text>
            {active && (
              <g transform={`translate(${x + rad + 10}, ${y})`}>
                <rect x={0} y={-26} width={150} height={52} fill="var(--ink)" />
                <text x={8} y={-10} fontSize={11} fill="var(--bg)" fontWeight={600}>{r.name}</text>
                <text x={8} y={6} fontSize={10.5} fill="var(--bg)" fontFamily="JetBrains Mono" opacity={0.85}>
                  rank {r.avg != null ? Math.round(r.avg * 100) : "—"} / 100
                </text>
                <text x={8} y={20} fontSize={10} fill={TIER_COLOR[tier]} fontFamily="JetBrains Mono">tier {tier}</text>
              </g>
            )}
          </g>
        );
      })}
      <g transform={`translate(${W + 6}, 20)`}>
        <text x={0} y={0} fontSize={10} fill="var(--ink-3)" fontFamily="JetBrains Mono" letterSpacing="0.12em">RANK</text>
        {[4, 3, 2, 1].map((t, i) => (
          <g key={t} transform={`translate(0, ${16 + i * 20})`}>
            <circle cx={8} cy={0} r={6} fill={TIER_COLOR[t]} opacity={0.8} />
            <text x={22} y={4} fontSize={10} fill="var(--ink-2)" fontFamily="JetBrains Mono">
              {["≥85","60-84","40-59","<40"][i]}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function DistBar({
  tiers, W = 1200, H = 70,
}: { tiers: { label: string; count: number; color: string; note: string }[]; W?: number; H?: number; }) {
  const total = tiers.reduce((s, t) => s + t.count, 0) || 1;
  let x = 0;
  return (
    <svg viewBox={`0 0 ${W} ${H + 64}`} width={W} height={H + 64}>
      {tiers.map(t => {
        const w = (t.count / total) * W;
        const el = (
          <g key={t.label}>
            <rect x={x} y={0} width={Math.max(0, w - 2)} height={H} fill={t.color} />
            {w > 60 && (
              <text x={x + w / 2} y={H / 2 + 6} textAnchor="middle" fontSize={16} fill="var(--bg)" fontFamily="JetBrains Mono" fontWeight={500}>
                {t.count}
              </text>
            )}
            <line x1={x} x2={x} y1={H + 8} y2={H + 18} stroke={t.color} strokeWidth={2} />
            <text x={x + 4} y={H + 34} fontSize={11} fill="var(--ink-2)" fontFamily="JetBrains Mono" letterSpacing="0.04em">{t.label}</text>
            <text x={x + 4} y={H + 50} fontSize={10} fill="var(--ink-4)" fontFamily="JetBrains Mono">{t.note}</text>
          </g>
        );
        x += w;
        return el;
      })}
    </svg>
  );
}

// ——————————————————————————————————————————————
// Station content renderers

function TinyMetric({ series, color }: { series: Series; color: string }) {
  const v = series.latest?.value ?? null;
  return (
    <Link href={`/matt/${series.metric.slug}`} className="block" style={{ padding: "16px 0", borderTop: "1px solid var(--ink-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "baseline" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{series.metric.short_name_sv}</div>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)", marginTop: 3, letterSpacing: "0.04em" }}>
            KPI {series.metric.source_kpi_id} · {unitLabel(series.metric.unit)}
          </div>
        </div>
        <div className="display-black" style={{ fontSize: 32, lineHeight: 0.9, color }}>
          {formatValueBare(v, series.metric.unit)}
        </div>
      </div>
    </Link>
  );
}

function CategoryStation({
  cat, metrics, riketByMetric, color,
}: {
  cat: string;
  metrics: Metric[];
  riketByMetric: Series[];
  color: string;
}) {
  const items = metrics.map(m => riketByMetric.find(s => s.metric.slug === m.slug)).filter(Boolean) as Series[];
  return (
    <div style={{ padding: 26 }}>
      <div className="caps" style={{ color }}>Kategori · {metrics.length} mätetal</div>
      <div className="display-black" style={{ fontSize: 30, marginTop: 10, lineHeight: 0.95 }}>
        {CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL]}
      </div>
      <div style={{ marginTop: 18 }}>
        {items.map(s => <TinyMetric key={s.metric.slug} series={s} color={color} />)}
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————
// Atlas

const CANVAS_W = 5000;
const CANVAS_H = 3200;

export function AtlasClient({ metrics, regionAgg, riketByMetric, lastUpdated }: Props) {
  const HEADLINE_SLUGS = [
    "specialist-forsta-kontakt-vantande-median",
    "operation-vantande-median",
    "bup-forsta-besok-inom-90-dagar",
    "upplevd-vantetid-vardcentral",
    "prostatacancer-forsta-besok-14d",
  ];
  const headline = HEADLINE_SLUGS.map(slug => riketByMetric.find(s => s.metric.slug === slug)).filter(Boolean) as Series[];

  const byCategory = metrics.reduce<Record<string, Metric[]>>((acc, m) => {
    (acc[m.category] ||= []).push(m); return acc;
  }, {});

  const geoRegions = regionAgg
    .filter(r => REGION_GEO[r.id])
    .map(r => ({ ...r, ...REGION_GEO[r.id] }));

  const ranked = [...regionAgg].sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  const top3 = ranked.slice(0, 3);
  const bottom3 = ranked.filter(r => r.avg != null).slice(-3).reverse();

  const distTiers = [1, 2, 3, 4].map(t => ({
    t,
    count: regionAgg.filter(r => scoreTier(r.avg) === t).length,
    color: TIER_COLOR[t],
    label: ["", "Under 40", "40 – 59", "60 – 84", "85 eller högre"][t],
    note: ["", "rank / 100", "rank / 100", "rank / 100", "rank / 100"][t],
  }));

  const STATIONS = useMemo(() => {
    const S: { id: string; num: string; label: string; x: number; y: number; w: number; h: number; render: () => React.ReactNode }[] = [];

    // 00 Title
    S.push({
      id: "title", num: "00", label: "Titelblad",
      x: 200, y: 200, w: 1400, h: 900,
      render: () => (
        <div style={{ padding: "56px 60px" }}>
          <div className="caps" style={{ color: P.c1, marginBottom: 24 }}>
            Öppen data · svensk vård · utgåva {lastUpdated ? lastUpdated.slice(0, 7) : "—"}
          </div>
          <h1 className="display-black" style={{ fontSize: 168, lineHeight: 0.82, letterSpacing: "-0.05em" }}>
            Så <span style={{ color: P.c1 }}>länge</span><br />
            väntar<br />
            <span style={{ color: P.c4 }}>Sverige</span><br />
            på vård.
          </h1>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 28, letterSpacing: "0.08em" }}>
            5000 × 3200 MM · {metrics.length} MÄTETAL · {regionAgg.length} REGIONER · CC BY 4.0
          </div>
        </div>
      ),
    });

    // 01 Ingress
    S.push({
      id: "ingress", num: "01", label: "Ingress",
      x: 1750, y: 200, w: 700, h: 900,
      render: () => (
        <div style={{ padding: 40 }}>
          <div className="caps" style={{ color: "var(--ink-3)", marginBottom: 22 }}>Ingress</div>
          <p style={{ fontSize: 22, lineHeight: 1.4, color: "var(--ink-2)", marginBottom: 24 }}>
            En öppen sammanställning av <b style={{ color: P.c1 }}>all tillgänglig</b> offentlig data om väntetider i svensk vård.
          </p>
          <p style={{ fontSize: 22, lineHeight: 1.4, color: "var(--ink-2)", marginBottom: 34 }}>
            Automatiskt uppdaterad. Varje siffra <b style={{ color: P.c4 }}>spårbar</b> till sin källa.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 36, paddingTop: 28, borderTop: "1px solid var(--ink)" }}>
            <div>
              <div className="display-black" style={{ fontSize: 56, lineHeight: 0.9 }}>{metrics.length}</div>
              <div className="caps" style={{ color: "var(--ink-3)", marginTop: 8 }}>mätetal</div>
            </div>
            <div>
              <div className="display-black" style={{ fontSize: 56, lineHeight: 0.9 }}>{regionAgg.length}+1</div>
              <div className="caps" style={{ color: "var(--ink-3)", marginTop: 8 }}>regioner + riket</div>
            </div>
            <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
              <div className="mono" style={{ fontSize: 13, color: "var(--ink-2)" }}>
                SENAST UPPDATERAD
              </div>
              <div className="display" style={{ fontSize: 26, marginTop: 6 }}>
                {lastUpdated ? formatDate(lastUpdated) : "—"}
              </div>
            </div>
          </div>
        </div>
      ),
    });

    // 02a-e headline metrics
    headline.forEach((s, i) => {
      const color = CAT_COLOR[s.metric.category] ?? P.c4;
      const score = performanceScore(s.latest?.value ?? null, s.metric);
      S.push({
        id: `headline-${i}`, num: `02${"abcde"[i]}`, label: s.metric.short_name_sv,
        x: 2600 + i * 480, y: 200, w: 460, h: 900,
        render: () => (
          <div style={{ padding: 26, height: "100%", display: "flex", flexDirection: "column" }}>
            <div className="caps" style={{ color }}>
              {CATEGORY_LABEL[s.metric.category]}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div className="display-black" style={{ fontSize: 96, lineHeight: 0.88, color, letterSpacing: "-0.05em" }}>
                {formatValueBare(s.latest?.value ?? null, s.metric.unit)}
              </div>
              <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8, letterSpacing: "0.06em" }}>
                {unitLabel(s.metric.unit)}
              </div>
              <div className="display" style={{ fontSize: 19, marginTop: 20, lineHeight: 1.1 }}>
                {s.metric.short_name_sv}
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ink-3)", marginTop: 10 }}>
                {s.metric.description_sv.slice(0, 160)}{s.metric.description_sv.length > 160 ? "…" : ""}
              </p>
            </div>
            <div style={{ marginTop: 16 }}>
              <Sparkline points={s.points.slice(-10)} betterDirection={s.metric.better_direction} target={s.metric.target_value} width={400} height={58} color={color} />
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 10, letterSpacing: "0.06em", display: "flex", justifyContent: "space-between" }}>
              <span>{s.latest ? formatPeriod(s.latest.period, /^\d{6}$/.test(s.latest.period) ? "month" : "year") : "—"}</span>
              <span>rank {score != null ? Math.round(score * 100) : "—"}</span>
            </div>
          </div>
        ),
      });
    });

    // 03 Map
    S.push({
      id: "map", num: "03", label: "Geografi",
      x: 200, y: 1280, w: 700, h: 780,
      render: () => (
        <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
          <BubbleMap regions={geoRegions} W={440} H={620} />
        </div>
      ),
    });

    // 03· Map caption
    S.push({
      id: "map-caption", num: "03·", label: "",
      x: 960, y: 1320, w: 520, h: 380,
      render: () => (
        <div style={{ padding: 32 }}>
          <div className="caps" style={{ color: P.c3, marginBottom: 14 }}>Fig. 03 · landet</div>
          <div className="display" style={{ fontSize: 30, lineHeight: 1.05, marginBottom: 18 }}>
            Landet är inte ett väntrum. Det är {regionAgg.length}.
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}>
            Bubblans storlek: sammanvägd rank (0 – 100) baserad på alla {metrics.length} mätetal. Färgen: tier.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", marginTop: 12 }}>
            Varje siffra bakom bubblan kommer direkt från öppna register — Kolada, Socialstyrelsen, SKR.
          </p>
        </div>
      ),
    });

    // 03+ Ranking
    S.push({
      id: "ranking", num: "03+", label: "Ranking",
      x: 960, y: 1760, w: 520, h: 300,
      render: () => (
        <div style={{ padding: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          <div>
            <div className="caps" style={{ color: P.c3, marginBottom: 12 }}>↓ bäst rank</div>
            {top3.map(r => (
              <Link key={r.id} href={`/region/${r.slug}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--bg-2)" }}>
                <span className="display" style={{ fontSize: 15 }}>{r.short_name}</span>
                <span className="mono" style={{ fontSize: 12, color: P.c3 }}>
                  {r.avg != null ? Math.round(r.avg * 100) : "—"}
                </span>
              </Link>
            ))}
          </div>
          <div>
            <div className="caps" style={{ color: P.c1, marginBottom: 12 }}>↑ svagast rank</div>
            {bottom3.map(r => (
              <Link key={r.id} href={`/region/${r.slug}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--bg-2)" }}>
                <span className="display" style={{ fontSize: 15 }}>{r.short_name}</span>
                <span className="mono" style={{ fontSize: 12, color: P.c1 }}>
                  {r.avg != null ? Math.round(r.avg * 100) : "—"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ),
    });

    // 04 Category-hero
    S.push({
      id: "cat-hero", num: "04", label: "Alla mätetal",
      x: 1540, y: 1280, w: 2420, h: 140,
      render: () => (
        <div style={{ padding: "28px 32px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <div className="caps" style={{ color: P.c5 }}>Fig. 04 · katalogen</div>
            <div className="display-black" style={{ fontSize: 48, marginTop: 6, lineHeight: 0.95 }}>
              Alla {metrics.length} mätetal, grupperade.
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-3)", maxWidth: 420, lineHeight: 1.55 }}>
            Varje kort visar Rikets senaste värde. Klicka för regionjämförelse.
          </p>
        </div>
      ),
    });

    // 04a-f one station per category
    const CAT_ORDER: string[] = ["specialist", "operation", "bup", "perception", "cancer", "capacity"];
    const positions = [
      [1540, 1460, 780, 440],
      [2340, 1460, 780, 440],
      [3140, 1460, 820, 440],
      [1540, 1920, 780, 440],
      [2340, 1920, 780, 440],
      [3140, 1920, 820, 440],
    ];
    CAT_ORDER.forEach((cat, i) => {
      const ms = byCategory[cat] ?? [];
      if (!ms.length) return;
      const [x, y, w, h] = positions[i];
      S.push({
        id: `cat-${cat}`, num: `04${"abcdef"[i]}`, label: CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL],
        x, y, w, h,
        render: () => <CategoryStation cat={cat} metrics={ms} riketByMetric={riketByMetric} color={CAT_COLOR[cat]} />,
      });
    });

    // 05 Trends hero + grid
    S.push({
      id: "trends-hero", num: "05", label: "Trender",
      x: 4000, y: 1280, w: 800, h: 140,
      render: () => (
        <div style={{ padding: "28px 28px" }}>
          <div className="caps" style={{ color: P.c4 }}>Fig. 05 · historik</div>
          <div className="display-black" style={{ fontSize: 32, marginTop: 6, lineHeight: 0.95 }}>
            Så har Riket rört sig.
          </div>
        </div>
      ),
    });

    S.push({
      id: "trends-grid", num: "05·", label: "",
      x: 4000, y: 1460, w: 800, h: 900,
      render: () => (
        <div style={{ padding: 20 }}>
          {riketByMetric.map((s) => {
            const color = CAT_COLOR[s.metric.category] ?? P.c4;
            return (
              <div key={s.metric.slug} style={{ padding: "10px 0", borderBottom: "1px solid var(--bg-2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{s.metric.short_name_sv}</div>
                  <div className="mono" style={{ fontSize: 11, color }}>
                    {formatValueBare(s.latest?.value ?? null, s.metric.unit)} {unitLabel(s.metric.unit).split(" ")[0]}
                  </div>
                </div>
                <div style={{ marginTop: 4 }}>
                  <Sparkline
                    points={s.points.slice(-12)}
                    betterDirection={s.metric.better_direction}
                    target={s.metric.target_value}
                    width={760} height={36} color={color}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ),
    });

    // 06 Distribution
    S.push({
      id: "distribution", num: "06", label: "Fördelning",
      x: 200, y: 2200, w: 1580, h: 400,
      render: () => (
        <div style={{ padding: 32 }}>
          <div className="caps" style={{ color: P.c2, marginBottom: 12 }}>Fig. 06 · fördelningen</div>
          <div className="display-black" style={{ fontSize: 30, lineHeight: 1, marginBottom: 24 }}>
            Regionerna i fyra nivåer.
          </div>
          <DistBar tiers={distTiers} W={1500} H={70} />
          <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 20, lineHeight: 1.55, maxWidth: 780 }}>
            Sammanvägd rank = medelvärde av prestationspoäng per mätetal mot vårdgarantimål. Lägre = längre väntetider eller färre patienter hanterade i tid.
          </p>
        </div>
      ),
    });

    // 07 Transparency
    S.push({
      id: "transparency", num: "07", label: "Metod",
      x: 1820, y: 2200, w: 1340, h: 400,
      render: () => (
        <div style={{ padding: 32 }}>
          <div className="caps" style={{ color: P.c4, marginBottom: 12 }}>Fig. 07 · pålitlighet</div>
          <div className="display" style={{ fontSize: 30, lineHeight: 1.05, marginBottom: 18 }}>
            Varje siffra spårbar till sin källa.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 12 }}>
            <div style={{ borderLeft: `3px solid ${P.c3}`, paddingLeft: 14 }}>
              <div className="caps" style={{ color: P.c3 }}>Append-only</div>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)", marginTop: 4 }}>
                Varje datapunkt lagras med ursprungs-URL, tidpunkt och SHA-256-hash. Inget skrivs över.
              </p>
            </div>
            <div style={{ borderLeft: `3px solid ${P.c1}`, paddingLeft: 14 }}>
              <div className="caps" style={{ color: P.c1 }}>Avvikelsekontroll</div>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)", marginTop: 4 }}>
                Värden som avviker {">"}30 % från föregående körning hålls tillbaka för granskning.
              </p>
            </div>
            <div style={{ borderLeft: `3px solid ${P.c4}`, paddingLeft: 14 }}>
              <div className="caps" style={{ color: P.c4 }}>Öppet</div>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)", marginTop: 4 }}>
                Allt som visas finns också som JSON/CSV. Se API-sidan.
              </p>
            </div>
            <div style={{ borderLeft: `3px solid ${P.c2}`, paddingLeft: 14 }}>
              <div className="caps" style={{ color: P.c2 }}>Fortlöpande</div>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)", marginTop: 4 }}>
                Nattlig ETL från Kolada. Socialstyrelsens fulla tabeller aktiveras våren 2026.
              </p>
            </div>
          </div>
        </div>
      ),
    });

    // 08 API-note
    S.push({
      id: "api-note", num: "08", label: "Resurser",
      x: 3200, y: 2200, w: 760, h: 400,
      render: () => (
        <div style={{ padding: 30, display: "flex", flexDirection: "column", height: "100%" }}>
          <div className="caps" style={{ color: P.c6, marginBottom: 14 }}>Fig. 08 · vidare</div>
          <div className="display-black" style={{ fontSize: 44, lineHeight: 0.9, color: P.c6 }}>
            JSON<br />CSV<br />API
          </div>
          <div style={{ marginTop: "auto", display: "grid", gap: 10 }}>
            <Link href="/jamfor" className="display" style={{ fontSize: 17, borderTop: "1px solid var(--ink-4)", paddingTop: 10 }}>
              Jämför alla regioner →
            </Link>
            <Link href="/api-docs" className="display" style={{ fontSize: 17, borderTop: "1px solid var(--ink-4)", paddingTop: 10 }}>
              Publikt REST-API →
            </Link>
            <Link href="/ladda-ner" className="display" style={{ fontSize: 17, borderTop: "1px solid var(--ink-4)", paddingTop: 10 }}>
              Ladda ner datasetet →
            </Link>
            <Link href="/om-data" className="display" style={{ fontSize: 17, borderTop: "1px solid var(--ink-4)", paddingTop: 10 }}>
              Om datan & metod →
            </Link>
          </div>
        </div>
      ),
    });

    // 09 Colophon
    S.push({
      id: "colophon", num: "∞", label: "Kolofon",
      x: 4000, y: 2440, w: 800, h: 520,
      render: () => (
        <div style={{ padding: 30 }}>
          <div className="display-black" style={{ fontSize: 26, marginBottom: 20 }}>Kolofon</div>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div className="caps" style={{ color: "var(--ink-3)", marginBottom: 4 }}>Källor</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>
                {SOURCES.map((s, i) => (
                  <span key={s.slug}>
                    <a className="link-ink" href={s.homepage_url} target="_blank" rel="noreferrer" style={{ color: "var(--ink)" }}>{s.name}</a>
                    {i < SOURCES.length - 1 ? " · " : ""}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="caps" style={{ color: "var(--ink-3)", marginBottom: 4 }}>Typsnitt</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>
                Cabinet Grotesk · General Sans · JetBrains Mono
              </div>
            </div>
            <div>
              <div className="caps" style={{ color: "var(--ink-3)", marginBottom: 4 }}>Licens</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>
                Egen data CC BY 4.0. Vidareanvändning ska ange ursprungskällor enligt attribution per mätetal.
              </div>
            </div>
            <div>
              <div className="caps" style={{ color: "var(--ink-3)", marginBottom: 4 }}>Nästa</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>
                Nattlig ETL · avvikelsekontroll · append-only historik
              </div>
            </div>
          </div>
        </div>
      ),
    });

    return S;
  }, [metrics, regionAgg, riketByMetric, lastUpdated, headline, geoRegions, top3, bottom3, distTiers, byCategory]);

  // Decorative connections
  const CONNECTIONS: [string, string, string][] = [
    ["title", "ingress", P.c7],
    ["ingress", "headline-0", P.c1],
    ["map", "map-caption", P.c3],
    ["map-caption", "ranking", "#B4B4BC"],
    ["cat-hero", "trends-hero", P.c4],
    ["distribution", "transparency", P.c2],
  ];

  // ———————————————————————————
  // Interaction

  const [view, setView] = useState({ x: 0, y: 0, z: 0.5 });
  const [focused, setFocused] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const s = STATIONS.find(st => st.id === "title")!;
    const padX = Math.min(240, rect.width * 0.14);
    const padY = Math.min(90, rect.height * 0.1);
    const z = Math.min(
      (rect.width - padX * 2) / s.w,
      (rect.height - padY * 2) / s.h,
      0.9,
    );
    setView({
      x: rect.width / 2 - (s.x + s.w / 2) * z,
      y: rect.height / 2 - (s.y + s.h / 2) * z,
      z,
    });
  }, []); // eslint-disable-line

  const zoomTo = useCallback((id: string, targetZ: number | "fit" = 1) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const s = STATIONS.find(s => s.id === id);
    if (!s) return;
    const rect = vp.getBoundingClientRect();
    const pad = Math.min(80, Math.min(rect.width, rect.height) * 0.08);
    const zFit = Math.min((rect.width - pad * 2) / s.w, (rect.height - pad * 2) / s.h);
    const z = Math.min(targetZ === "fit" ? zFit : (targetZ as number), 1.2);
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    setView({
      x: rect.width / 2 - cx * z,
      y: rect.height / 2 - cy * z,
      z,
    });
    setFocused(id);
  }, [STATIONS]);

  const resetView = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const padL = Math.min(240, rect.width * 0.18);
    const padR = Math.min(240, rect.width * 0.18);
    const padT = Math.min(90, rect.height * 0.12);
    const padB = Math.min(90, rect.height * 0.12);
    const availW = Math.max(200, rect.width - padL - padR);
    const availH = Math.max(200, rect.height - padT - padB);
    const zFit = Math.min(availW / CANVAS_W, availH / CANVAS_H);
    setView({
      x: padL + (availW - CANVAS_W * zFit) / 2,
      y: padT + (availH - CANVAS_H * zFit) / 2,
      z: zFit,
    });
    setFocused(null);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    draggingRef.current = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = draggingRef.current;
    if (!d) return;
    setView(v => ({ ...v, x: d.vx + (e.clientX - d.sx), y: d.vy + (e.clientY - d.sy) }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    setView(v => {
      const nz = Math.max(0.15, Math.min(2.0, v.z * factor));
      const k = nz / v.z;
      return {
        z: nz,
        x: mx - (mx - v.x) * k,
        y: my - (my - v.y) * k,
      };
    });
  };

  useEffect(() => {
    const navStations = STATIONS.filter(s => s.label);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Home") resetView();
      const ix = navStations.findIndex(s => s.id === focused);
      if (e.key === "ArrowRight" || e.key === "n") {
        const next = navStations[(ix + 1 + navStations.length) % navStations.length];
        zoomTo(next.id, "fit");
      }
      if (e.key === "ArrowLeft" || e.key === "p") {
        const prev = navStations[(ix - 1 + navStations.length) % navStations.length];
        zoomTo(prev.id, "fit");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focused, zoomTo, resetView, STATIONS]);

  const connLines = CONNECTIONS.map(([a, b, color], i) => {
    const sa = STATIONS.find(s => s.id === a);
    const sb = STATIONS.find(s => s.id === b);
    if (!sa || !sb) return null;
    const x1 = sa.x + sa.w / 2, y1 = sa.y + sa.h / 2;
    const x2 = sb.x + sb.w / 2, y2 = sb.y + sb.h / 2;
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} strokeDasharray="4 6" opacity={0.35} />;
  });

  return (
    <>
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        style={{
          position: "fixed",
          inset: 0,
          cursor: draggingRef.current ? "grabbing" : "grab",
          userSelect: "none",
          background: "var(--bg)",
          overflow: "hidden",
          touchAction: "none",
        }}
      >
        <div style={{
          position: "absolute",
          width: CANVAS_W,
          height: CANVAS_H,
          transformOrigin: "0 0",
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
          transition: draggingRef.current ? "none" : "transform 500ms cubic-bezier(.2,.8,.2,1)",
        }}>
          <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width={CANVAS_W} height={CANVAS_H}>
            <defs>
              <pattern id="dots" width="64" height="64" patternUnits="userSpaceOnUse">
                <circle cx={1} cy={1} r={1} fill="var(--ink-4)" opacity={0.4} />
              </pattern>
            </defs>
            <rect width={CANVAS_W} height={CANVAS_H} fill="url(#dots)" />
            {connLines}
          </svg>

          {STATIONS.map(s => {
            const isFocused = focused === s.id;
            return (
              <div
                key={s.id}
                onDoubleClick={() => zoomTo(s.id, "fit")}
                style={{
                  position: "absolute",
                  left: s.x, top: s.y, width: s.w, height: s.h,
                  background: "var(--bg)",
                  outline: isFocused ? `2px solid ${P.c1}` : `1px solid var(--ink)`,
                  outlineOffset: isFocused ? 6 : 0,
                  transition: "outline-offset 300ms",
                  overflow: "hidden",
                }}
              >
                {s.label && (
                  <div style={{
                    position: "absolute", top: -30, left: 0,
                    display: "flex", alignItems: "baseline", gap: 10,
                  }}>
                    <div className="mono" style={{ fontSize: 13, color: "var(--ink-3)", letterSpacing: "0.06em" }}>
                      FIG {s.num}
                    </div>
                    <div className="display" style={{ fontSize: 15, color: "var(--ink)" }}>
                      {s.label}
                    </div>
                  </div>
                )}
                {s.render()}
              </div>
            );
          })}

          <div style={{ position: "absolute", right: 200, top: 100, display: "flex", alignItems: "baseline", gap: 14 }}>
            <div className="mono" style={{ fontSize: 14, color: "var(--ink-3)", letterSpacing: "0.08em" }}>
              ÖPPEN DATA · VÄRD CC BY 4.0 · SPÅRBAR TILL KÄLLA
            </div>
          </div>
        </div>
      </div>

      <TopBar onReset={resetView} lastUpdated={lastUpdated} />
      <StationIndex stations={STATIONS.filter(s => s.label)} focused={focused} onPick={id => zoomTo(id, "fit")} />
      <MiniMap view={view} stations={STATIONS} focused={focused} onJump={id => zoomTo(id, "fit")} />
      <ZoomPanel view={view} setView={setView} onReset={resetView} />
      <HelpPill />
    </>
  );
}

// ——————————————————————————————————————————————
// Chrome

function TopBar({ onReset, lastUpdated }: { onReset: () => void; lastUpdated: string | null }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0,
      padding: "18px 28px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      pointerEvents: "none", zIndex: 10,
    }}>
      <div style={{
        pointerEvents: "auto",
        background: "var(--ink)",
        color: "var(--bg)",
        padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{ width: 8, height: 8, background: P.c1 }} />
        <div className="display" style={{ fontSize: 15 }}>Väntetid · Atlas</div>
        <div className="mono" style={{ fontSize: 10.5, opacity: 0.6, letterSpacing: "0.08em" }}>
          {lastUpdated ? lastUpdated.slice(0, 7).toUpperCase() : "—"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
        <Link href="/jamfor" className="caps" style={{ padding: "10px 14px", background: "var(--bg)", color: "var(--ink)", outline: "1px solid var(--ink)" }}>
          Jämför
        </Link>
        <Link href="/om-data" className="caps" style={{ padding: "10px 14px", background: "var(--bg)", color: "var(--ink)", outline: "1px solid var(--ink)" }}>
          Om datan
        </Link>
        <Link href="/api-docs" className="caps" style={{ padding: "10px 14px", background: "var(--bg)", color: "var(--ink)", outline: "1px solid var(--ink)" }}>
          API
        </Link>
        <Link href="/ladda-ner" className="caps" style={{ padding: "10px 14px", background: "var(--bg)", color: "var(--ink)", outline: "1px solid var(--ink)" }}>
          Ladda ner
        </Link>
        <button onClick={onReset} className="caps" style={{ padding: "10px 14px", background: "var(--bg)", color: "var(--ink)", outline: "1px solid var(--ink)" }}>
          Översikt
        </button>
      </div>
    </div>
  );
}

function StationIndex({
  stations, focused, onPick,
}: {
  stations: { id: string; num: string; label: string }[];
  focused: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div style={{
      position: "fixed",
      left: 28, top: 90, bottom: 160,
      width: 210,
      pointerEvents: "auto",
      zIndex: 10,
      display: "flex", flexDirection: "column",
      background: "var(--bg)",
      padding: "14px 0",
      outline: "1px solid var(--ink)",
      overflow: "auto",
    }}>
      <div className="caps" style={{ color: "var(--ink-3)", padding: "0 16px 14px", borderBottom: "1px solid var(--ink-4)" }}>
        Index
      </div>
      {stations.map(s => (
        <button key={s.id} onClick={() => onPick(s.id)} style={{
          padding: "12px 16px",
          textAlign: "left",
          background: focused === s.id ? "var(--ink)" : "transparent",
          color: focused === s.id ? "var(--bg)" : "var(--ink)",
          display: "flex", alignItems: "baseline", gap: 10,
          borderBottom: "1px solid var(--bg-2)",
          width: "100%",
        }}>
          <span className="mono" style={{ fontSize: 10.5, opacity: 0.6, letterSpacing: "0.06em" }}>{s.num}</span>
          <span className="display" style={{ fontSize: 14 }}>{s.label}</span>
        </button>
      ))}
    </div>
  );
}

function MiniMap({
  view, stations, focused, onJump,
}: {
  view: { x: number; y: number; z: number };
  stations: { id: string; x: number; y: number; w: number; h: number; label: string }[];
  focused: string | null;
  onJump: (id: string) => void;
}) {
  const mW = 220;
  const mH = (mW / CANVAS_W) * CANVAS_H;
  const scale = mW / CANVAS_W;
  const [vpRect, setVpRect] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const update = () => setVpRect({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const vx = -view.x / view.z * scale;
  const vy = -view.y / view.z * scale;
  const vw = vpRect.w / view.z * scale;
  const vh = vpRect.h / view.z * scale;
  return (
    <div style={{
      position: "fixed",
      right: 28, bottom: 28,
      width: mW, height: mH + 44,
      background: "var(--bg)",
      outline: "1px solid var(--ink)",
      pointerEvents: "auto",
      zIndex: 10,
      padding: 8,
    }}>
      <div style={{ position: "relative", width: mW - 16, height: mH }}>
        {stations.map(s => {
          const isFocused = focused === s.id;
          return (
            <div key={s.id} onClick={() => onJump(s.id)} style={{
              position: "absolute",
              left: s.x * scale,
              top: s.y * scale,
              width: s.w * scale,
              height: s.h * scale,
              background: isFocused ? P.c1 : "var(--ink-4)",
              opacity: isFocused ? 1 : 0.5,
              cursor: "pointer",
            }} />
          );
        })}
        <div style={{
          position: "absolute",
          left: Math.max(0, vx),
          top: Math.max(0, vy),
          width: Math.min(vw, mW - 16 - Math.max(0, vx)),
          height: Math.min(vh, mH - Math.max(0, vy)),
          border: `1.5px solid ${P.c4}`,
          pointerEvents: "none",
        }} />
      </div>
      <div className="caps" style={{ color: "var(--ink-3)", marginTop: 8, fontSize: 9.5, letterSpacing: "0.1em" }}>
        Översikt · {Math.round(view.z * 100)}%
      </div>
    </div>
  );
}

function ZoomPanel({
  view, setView, onReset,
}: {
  view: { x: number; y: number; z: number };
  setView: React.Dispatch<React.SetStateAction<{ x: number; y: number; z: number }>>;
  onReset: () => void;
}) {
  const bump = (f: number) => setView(v => {
    const vp = { w: window.innerWidth, h: window.innerHeight };
    const nz = Math.max(0.15, Math.min(2.0, v.z * f));
    const k = nz / v.z;
    const cx = vp.w / 2, cy = vp.h / 2;
    return { z: nz, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
  });
  return (
    <div style={{
      position: "fixed",
      left: 28, bottom: 28,
      display: "flex",
      background: "var(--bg)",
      outline: "1px solid var(--ink)",
      pointerEvents: "auto",
      zIndex: 10,
    }}>
      <button onClick={() => bump(0.83)} className="mono" style={{ padding: "10px 14px", fontSize: 16, borderRight: "1px solid var(--ink-4)" }}>−</button>
      <div className="mono" style={{ padding: "10px 14px", fontSize: 12, minWidth: 56, textAlign: "center", borderRight: "1px solid var(--ink-4)" }}>
        {Math.round(view.z * 100)}%
      </div>
      <button onClick={() => bump(1.2)} className="mono" style={{ padding: "10px 14px", fontSize: 16, borderRight: "1px solid var(--ink-4)" }}>+</button>
      <button onClick={onReset} className="caps" style={{ padding: "10px 14px" }}>Passa</button>
    </div>
  );
}

function HelpPill() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 8000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div style={{
      position: "fixed",
      bottom: 28,
      left: "50%",
      transform: "translateX(-50%)",
      background: "var(--ink)",
      color: "var(--bg)",
      padding: "12px 20px",
      display: "flex", alignItems: "center", gap: 22,
      zIndex: 20,
      pointerEvents: "auto",
    }}>
      <span className="caps">Navigera</span>
      <span className="mono" style={{ fontSize: 11, opacity: 0.85 }}>dra för att panorera</span>
      <span className="mono" style={{ fontSize: 11, opacity: 0.85 }}>scrolla för att zooma</span>
      <span className="mono" style={{ fontSize: 11, opacity: 0.85 }}>← → mellan figurer</span>
      <button onClick={() => setShow(false)} className="mono" style={{ fontSize: 12, color: P.c2, marginLeft: 8 }}>×</button>
    </div>
  );
}
