-- Schedule ETL runs. Requires `pg_cron` and `pg_net` extensions (enable in Supabase dashboard).
-- Replace <PROJECT_REF> and the anon key before applying.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 03:15 Stockholm every day (CEST = 01:15 UTC in summer, CET = 02:15 UTC in winter).
-- Use UTC 02:15 as a safe middle ground; tweak as needed.
select cron.schedule(
  'vantetid-etl-kolada-nightly',
  '15 2 * * *',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/etl-kolada',
      headers := jsonb_build_object(
        'content-type', 'application/json',
        'authorization', 'Bearer <SERVICE_ROLE_KEY>'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- To remove:  select cron.unschedule('vantetid-etl-kolada-nightly');
