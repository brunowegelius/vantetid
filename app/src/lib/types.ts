export type Region = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  display_order: number;
};

export type Source = {
  id: string;
  slug: string;
  name: string;
  homepage_url: string;
  license: string;
  attribution: string;
  notes: string | null;
};

export type Metric = {
  id: string;
  slug: string;
  name_sv: string;
  short_name_sv: string;
  description_sv: string;
  unit: "days" | "percent" | "index" | "per_1000";
  category:
    | "specialist"
    | "operation"
    | "primary"
    | "bup"
    | "cancer"
    | "emergency"
    | "perception"
    | "capacity";
  better_direction: "lower" | "higher";
  source_slug: string;
  source_kpi_id: string;
  source_url_template: string;
  target_value: number | null;
  display_order: number;
};

export type Measurement = {
  metric_slug: string;
  region_id: string;
  period: string;
  period_kind: "year" | "month" | "quarter";
  period_start: string;
  period_end: string;
  gender: "T" | "M" | "K";
  value: number | null;
  value_count: number | null;
  status: "ok" | "missing" | "suppressed";
  source_url: string;
  fetched_at: string;
  anomaly_flag: string | null;
};

export type Series = {
  metric: Metric;
  region: Region;
  points: { period: string; value: number | null; period_start: string }[];
  latest: { period: string; value: number | null; source_url: string; fetched_at: string } | null;
};
