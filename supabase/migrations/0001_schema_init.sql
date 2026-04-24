-- Väntetid: dedicated schema for healthcare wait times.
-- Safe to run against any fresh Supabase project. Everything lives in schema `vantetid`.

create schema if not exists vantetid;

grant usage on schema vantetid to anon, authenticated, service_role;
alter default privileges in schema vantetid grant select on tables to anon, authenticated;
alter default privileges in schema vantetid grant select on sequences to anon, authenticated;

create table vantetid.regions (
  id            text primary key,
  slug          text not null unique,
  name          text not null,
  short_name    text not null,
  population    integer,
  lan_code      text,
  kolada_id     text,
  display_order integer not null default 100,
  created_at    timestamptz not null default now()
);

create table vantetid.sources (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  homepage_url text not null,
  license      text not null,
  attribution  text not null,
  notes        text,
  created_at   timestamptz not null default now()
);

create table vantetid.metrics (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  name_sv             text not null,
  short_name_sv       text not null,
  description_sv      text not null,
  unit                text not null,
  category            text not null,
  better_direction    text not null check (better_direction in ('lower','higher')),
  source_id           uuid not null references vantetid.sources(id),
  source_kpi_id       text not null,
  source_url_template text,
  target_value        numeric,
  display_order       integer not null default 100,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

create table vantetid.etl_runs (
  id           uuid primary key default gen_random_uuid(),
  source_id    uuid not null references vantetid.sources(id),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null default 'running' check (status in ('running','success','failed','validation_hold')),
  stats        jsonb not null default '{}'::jsonb,
  error        text
);

create table vantetid.raw_snapshots (
  id             uuid primary key default gen_random_uuid(),
  run_id         uuid not null references vantetid.etl_runs(id) on delete cascade,
  source_url     text not null,
  fetched_at     timestamptz not null default now(),
  payload_sha256 text not null,
  payload        jsonb not null,
  bytes          integer,
  created_at     timestamptz not null default now()
);
create index on vantetid.raw_snapshots (payload_sha256);
create index on vantetid.raw_snapshots (run_id);

create table vantetid.measurements (
  id           bigserial primary key,
  run_id       uuid not null references vantetid.etl_runs(id),
  snapshot_id  uuid not null references vantetid.raw_snapshots(id),
  metric_id    uuid not null references vantetid.metrics(id),
  region_id    text not null references vantetid.regions(id),
  period       text not null,
  period_kind  text not null check (period_kind in ('year','month','quarter')),
  period_start date not null,
  period_end   date not null,
  gender       text not null default 'T' check (gender in ('T','M','K')),
  value        numeric,
  value_count  integer,
  status       text not null default 'ok' check (status in ('ok','missing','suppressed')),
  source_url   text not null,
  fetched_at   timestamptz not null,
  is_latest    boolean not null default false,
  anomaly_flag text,
  created_at   timestamptz not null default now()
);
create index on vantetid.measurements (metric_id, region_id, period);
create index on vantetid.measurements (metric_id, region_id, is_latest) where is_latest;
create index on vantetid.measurements (fetched_at desc);

create table vantetid.validations (
  id             uuid primary key default gen_random_uuid(),
  run_id         uuid not null references vantetid.etl_runs(id),
  measurement_id bigint references vantetid.measurements(id),
  rule           text not null,
  severity       text not null check (severity in ('info','warn','block')),
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index on vantetid.validations (severity, created_at desc);

create view vantetid.measurements_latest as
select m.id, m.metric_id, m.region_id, m.period, m.period_kind, m.period_start, m.period_end,
       m.gender, m.value, m.value_count, m.status, m.source_url, m.fetched_at, m.anomaly_flag
from vantetid.measurements m
where m.is_latest = true and m.status = 'ok';

alter table vantetid.regions       enable row level security;
alter table vantetid.sources       enable row level security;
alter table vantetid.metrics       enable row level security;
alter table vantetid.etl_runs      enable row level security;
alter table vantetid.raw_snapshots enable row level security;
alter table vantetid.measurements  enable row level security;
alter table vantetid.validations   enable row level security;

create policy "public read regions"       on vantetid.regions       for select using (true);
create policy "public read sources"       on vantetid.sources       for select using (true);
create policy "public read metrics"       on vantetid.metrics       for select using (true);
create policy "public read etl_runs"      on vantetid.etl_runs      for select using (true);
create policy "public read measurements"  on vantetid.measurements  for select using (true);
create policy "public read validations"   on vantetid.validations   for select using (true);
