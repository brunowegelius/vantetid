import Link from "next/link";

export const metadata = { title: "API — Väntetid" };

export default function ApiDocsPage() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://<projekt>.supabase.co";
  return (
    <>
      <section className="grid-wide pt-10 pb-10">
        <div className="text-2xs uppercase tracking-wider text-subtle mb-3">
          <Link href="/" className="link-ink">Översikt</Link> / API
        </div>
        <h1 className="serif text-5xl md:text-6xl leading-[1] tracking-[-0.01em]">Publikt API.</h1>
        <p className="mt-4 max-w-2xl text-muted">
          All data som visas på sajten är också tillgänglig som JSON via ett öppet REST-gränssnitt.
          Ingen inloggning krävs för läsning.
        </p>
      </section>

      <section className="grid-wide pb-16 prose-clean">
        <div className="rule mb-8" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-3">
            <div className="text-2xs uppercase tracking-wider text-subtle">Endpoints</div>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2>Bas-URL</h2>
            <pre className="num text-sm bg-[#EDEAE1] p-4 overflow-x-auto"><code>{base}/rest/v1/</code></pre>

            <h3>Regioner</h3>
            <pre className="num text-sm bg-[#EDEAE1] p-4 overflow-x-auto"><code>GET /rest/v1/regions?select=*&order=display_order</code></pre>

            <h3>Mätetal</h3>
            <pre className="num text-sm bg-[#EDEAE1] p-4 overflow-x-auto"><code>GET /rest/v1/metrics?select=*&is_active=eq.true&order=display_order</code></pre>

            <h3>Senaste värden</h3>
            <pre className="num text-sm bg-[#EDEAE1] p-4 overflow-x-auto"><code>{`GET /rest/v1/measurements_latest?metric_id=eq.<uuid>&region_id=eq.0001`}</code></pre>

            <h3>Hela historiken</h3>
            <pre className="num text-sm bg-[#EDEAE1] p-4 overflow-x-auto"><code>{`GET /rest/v1/measurements?region_id=eq.0001&metric_id=eq.<uuid>&order=period.desc`}</code></pre>

            <h3>ETL-körningar och anomalier</h3>
            <pre className="num text-sm bg-[#EDEAE1] p-4 overflow-x-auto"><code>{`GET /rest/v1/etl_runs?order=started_at.desc&limit=50
GET /rest/v1/validations?severity=eq.block&order=created_at.desc`}</code></pre>

            <h2>Headers</h2>
            <pre className="num text-sm bg-[#EDEAE1] p-4 overflow-x-auto"><code>{`apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>
Authorization: Bearer <NEXT_PUBLIC_SUPABASE_ANON_KEY>
Accept: application/json`}</code></pre>

            <h2>Licens</h2>
            <p>Data publiceras under <span className="text-ink">CC BY 4.0</span>. Vid vidareanvändning ska
               ursprungskällan anges enligt attributionstexten per mätetal.</p>
          </div>
        </div>
      </section>
    </>
  );
}
