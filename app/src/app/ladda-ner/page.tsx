import Link from "next/link";
import { METRICS, CATEGORY_LABEL } from "@/lib/catalog";

export const metadata = { title: "Ladda ner — Väntetid" };

export default function DownloadPage() {
  return (
    <>
      <section className="grid-wide pt-10 pb-10">
        <div className="text-2xs uppercase tracking-wider text-subtle mb-3">
          <Link href="/" className="link-ink">Översikt</Link> / Ladda ner
        </div>
        <h1 className="serif text-5xl md:text-6xl leading-[1] tracking-[-0.01em]">Ladda ner data.</h1>
        <p className="mt-4 max-w-2xl text-muted">
          All data tillgänglig som CSV och JSON. Paketen genereras direkt ur databasen och speglar
          det som visas på sajten.
        </p>
      </section>

      <section className="grid-wide pb-16 prose-clean">
        <div className="rule mb-8" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-3">
            <div className="text-2xs uppercase tracking-wider text-subtle">Paket</div>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2>Hela datasetet</h2>
            <p>Komplett exportering av alla datapunkter, från första körningen till nu.</p>
            <ul>
              <li><a className="link-ink text-ink" href="/export/measurements.csv">measurements.csv</a> — alla rader, inklusive historik</li>
              <li><a className="link-ink text-ink" href="/export/measurements_latest.csv">measurements_latest.csv</a> — senaste publicerade värdet per mätetal × region</li>
              <li><a className="link-ink text-ink" href="/export/metrics.json">metrics.json</a> — mätetalskatalog med definitioner</li>
              <li><a className="link-ink text-ink" href="/export/regions.json">regions.json</a> — regionkatalog</li>
              <li><a className="link-ink text-ink" href="/export/sources.json">sources.json</a> — källkatalog med attribution</li>
            </ul>

            <h2>Per mätetal</h2>
            <ul>
              {METRICS.map(m => (
                <li key={m.slug}>
                  <a className="link-ink text-ink" href={`/export/metric/${m.slug}.csv`}>{m.short_name_sv}</a>
                  {" — "}<span className="text-muted">{CATEGORY_LABEL[m.category]}, KPI <span className="num">{m.source_kpi_id}</span></span>
                </li>
              ))}
            </ul>

            <p className="text-muted mt-4">
              Exportändpunkter aktiveras när systemet är live-deployat (kräver att Supabase-projektet
              är uppsatt). Fram till dess kan samma data läsas via Kolada-API direkt — se
              <Link href="/api-docs" className="link-ink"> API-sidan</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
