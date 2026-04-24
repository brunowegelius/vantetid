import type { Metric } from "./types";

export function formatValue(value: number | null | undefined, unit: Metric["unit"]): string {
  if (value == null || Number.isNaN(value)) return "—";
  switch (unit) {
    case "days":     return `${Math.round(value)} dagar`;
    case "percent":  return `${value.toFixed(0)} %`;
    case "per_1000": return value.toFixed(2);
    case "index":    return value.toFixed(1);
  }
}
export function formatValueBare(value: number | null | undefined, unit: Metric["unit"]): string {
  if (value == null || Number.isNaN(value)) return "—";
  switch (unit) {
    case "days":     return Math.round(value).toString();
    case "percent":  return `${value.toFixed(0)}`;
    case "per_1000": return value.toFixed(2);
    case "index":    return value.toFixed(1);
  }
}
export function unitLabel(unit: Metric["unit"]): string {
  return unit === "days" ? "dagar" : unit === "percent" ? "%" : unit === "per_1000" ? "per 1 000 inv" : "index";
}
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });
}
export function formatPeriod(period: string, kind: "year" | "month" | "quarter"): string {
  if (kind === "year") return period;
  if (kind === "month" && /^\d{6}$/.test(period)) {
    const y = period.slice(0, 4), m = period.slice(4, 6);
    const names = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];
    return `${names[Number(m)-1]} ${y}`;
  }
  return period;
}
// scale 0..1 where 1 = best performance
export function performanceScore(value: number | null, metric: Metric): number | null {
  if (value == null) return null;
  if (metric.unit === "percent") {
    const target = metric.target_value ?? 100;
    if (metric.better_direction === "higher") return Math.max(0, Math.min(1, value / target));
    return Math.max(0, Math.min(1, 1 - value / target));
  }
  if (metric.unit === "days") {
    const target = metric.target_value ?? 90;
    const ratio = target / Math.max(value, 1);
    return metric.better_direction === "lower"
      ? Math.max(0, Math.min(1, ratio))
      : Math.max(0, Math.min(1, 1 - ratio));
  }
  return null;
}
export function scoreColor(score: number | null): string {
  if (score == null) return "#9C9A91";
  if (score >= 0.85) return "#2E6B3F";
  if (score >= 0.6)  return "#6B6A2E";
  if (score >= 0.4)  return "#9C6B2E";
  return "#B8392B";
}
