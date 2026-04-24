import Link from "next/link";
import { METRICS, CATEGORY_LABEL } from "@/lib/catalog";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Ladda ner — Väntetid" };

export default function DownloadPage() {
  return (
    <>
      <Nav />

      <section style={{ padding: "20px 28px 40px" }}>
        <div className="station" style={{ padding: 40 }}>
          <div className="caps" style={{ color: "var(--c2)", marginBottom: 18 }}>
            FIG 00 · CSV · JSON · genererade från databasen
          </div>
          <h1 className="display-black" style={{ fontSize: 80, lineHeight: 0.92 }}>
            Ladda ner<br />data.
          </h1>
          <p style={{ marginTop: 22, maxWidth: 640, fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            All data tillgänglig som CSV och JSON. Paketen genereras direkt ur databasen och speglar det som visas på sajten.
          </p>
        </div>
      </section>

      <section style={{ padding: "0 28px 40px" }}>
        <div className="station" style={{ padding: 32 }}>
          <div className="caps" style={{ color: "var(--c4)", marginBottom: 14 }}>FIG 01 · Hela datasetet</div>
          <div className="display-black" style={{ fontSize: 32, marginBottom: 22 }}>Komplett export.</div>
          <div>
            {[
              { href: "/export/measurements.csv", name: "measurements.csv", desc: "alla rader, inklusive historik" },
              { href: "/export/measurements_latest.csv", name: "measurements_latest.csv", desc: "senaste publicerade värdet per mätetal × region" },
              { href: "/export/metrics.json", name: "metrics.json", desc: "mätetalskatalog med definitioner" },
              { href: "/export/regions.json", name: "regions.json", desc: "regionkatalog" },
              { href: "/export/sources.json", name: "sources.json", desc: "källkatalog med attribution" },
            ].map((f, i) => (
              <a
                key={f.href}
                href={f.href}
                className="link-ink"
                style={{
                  display: "grid",
                  gridTemplateColumns: "260px 1fr auto",
                  gap: 20,
                  alignItems: "baseline",
                  padding: "16px 0",
                  borderTop: i === 0 ? "1px solid var(--ink)" : "1px solid var(--bg-2)",
                }}
              >
                <span className="mono" style={{ fontSize: 13, color: "var(--ink)" }}>{f.name}</span>
                <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{f.desc}</span>
                <span className="caps" style={{ color: "var(--c4)" }}>Hämta →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 28px 40px" }}>
        <div className="station" style={{ padding: 32 }}>
          <div className="caps" style={{ color: "var(--c5)", marginBottom: 14 }}>FIG 02 · Per mätetal</div>
          <div className="display-black" style={{ fontSize: 32, marginBottom: 22 }}>
            {METRICS.length} CSV-filer.
          </div>
          <div>
            {METRICS.map((m, i) => (
              <a
                key={m.slug}
                href={`/export/metric/${m.slug}.csv`}
                className="link-ink"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 20,
                  alignItems: "baseline",
                  padding: "14px 0",
                  borderTop: i === 0 ? "1px solid var(--ink)" : "1px solid var(--bg-2)",
                }}
              >
                <span style={{ fontSize: 14 }}>{m.short_name_sv}</span>
                <span className="caps" style={{ color: "var(--ink-3)" }}>{CATEGORY_LABEL[m.category]}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>KPI {m.source_kpi_id}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 28px 40px" }}>
        <div className="station" style={{ padding: 32 }}>
          <div className="caps" style={{ color: "var(--c1)", marginBottom: 14 }}>Obs</div>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: "64ch" }}>
            Exportändpunkter aktiveras när systemet är live-deployat (kräver att Supabase-projektet är uppsatt). Fram till dess kan samma data läsas via Kolada-API direkt — se{" "}
            <Link href="/api-docs" className="link-ink" style={{ color: "var(--ink)", borderBottom: "1px solid var(--ink)" }}>API-sidan</Link>.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
