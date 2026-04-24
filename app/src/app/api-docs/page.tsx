import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata = { title: "API — Väntetid" };

const ENDPOINTS: { method: string; path: string; desc: string }[] = [
  { method: "GET", path: "/rest/v1/regions?select=*&order=display_order", desc: "Regionkatalog" },
  { method: "GET", path: "/rest/v1/metrics?select=*&is_active=eq.true&order=display_order", desc: "Mätetalkatalog" },
  { method: "GET", path: "/rest/v1/measurements_latest?metric_id=eq.<uuid>&region_id=eq.0001", desc: "Senaste värdet per mätetal × region" },
  { method: "GET", path: "/rest/v1/measurements?region_id=eq.0001&metric_id=eq.<uuid>&order=period.desc", desc: "Hela historiken" },
  { method: "GET", path: "/rest/v1/etl_runs?order=started_at.desc&limit=50", desc: "Senaste ETL-körningar" },
  { method: "GET", path: "/rest/v1/validations?severity=eq.block&order=created_at.desc", desc: "Aktiva anomalier" },
];

export default function ApiDocsPage() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://<projekt>.supabase.co";
  return (
    <>
      <Nav />

      <section style={{ padding: "20px 28px 40px" }}>
        <div className="station" style={{ padding: 40 }}>
          <div className="caps" style={{ color: "var(--c5)", marginBottom: 18 }}>
            FIG 00 · Öppet REST-API · ingen inloggning
          </div>
          <h1 className="display-black" style={{ fontSize: 80, lineHeight: 0.92 }}>
            Publikt<br />API.
          </h1>
          <p style={{ marginTop: 22, maxWidth: 640, fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            All data som visas på sajten är också tillgänglig som JSON via ett öppet REST-gränssnitt. Ingen inloggning krävs för läsning.
          </p>
        </div>
      </section>

      <section style={{ padding: "0 28px 40px" }}>
        <div className="station" style={{ padding: 32 }}>
          <div className="caps" style={{ color: "var(--ink-3)", marginBottom: 14 }}>FIG 01 · Bas-URL</div>
          <div className="mono" style={{ fontSize: 16, background: "var(--bg-2)", padding: "18px 22px", color: "var(--ink)" }}>
            {base}/rest/v1/
          </div>
        </div>
      </section>

      <section style={{ padding: "0 28px 40px" }}>
        <div className="station" style={{ padding: 32 }}>
          <div className="caps" style={{ color: "var(--c4)", marginBottom: 16 }}>FIG 02 · Endpoints</div>
          <div className="display-black" style={{ fontSize: 32, marginBottom: 22 }}>{ENDPOINTS.length} vägar in.</div>
          <div>
            {ENDPOINTS.map((e, i) => (
              <div
                key={e.path}
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr 240px",
                  gap: 20,
                  alignItems: "baseline",
                  padding: "16px 0",
                  borderTop: i === 0 ? "1px solid var(--ink)" : "1px solid var(--bg-2)",
                }}
              >
                <div className="mono" style={{ fontSize: 11, color: "var(--c3)", letterSpacing: "0.08em", fontWeight: 600 }}>
                  {e.method}
                </div>
                <div className="mono" style={{ fontSize: 13, color: "var(--ink)", wordBreak: "break-all" }}>
                  {e.path}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{e.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 28px 40px" }}>
        <div className="station" style={{ padding: 32 }}>
          <div className="caps" style={{ color: "var(--ink-3)", marginBottom: 16 }}>FIG 03 · Headers</div>
          <div className="mono" style={{ fontSize: 14, background: "var(--bg-2)", padding: "18px 22px", whiteSpace: "pre", lineHeight: 1.7 }}>
{`apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>
Authorization: Bearer <NEXT_PUBLIC_SUPABASE_ANON_KEY>
Accept: application/json`}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 28px 40px" }}>
        <div className="station" style={{ padding: 32 }}>
          <div className="caps" style={{ color: "var(--c3)", marginBottom: 14 }}>FIG 04 · Licens</div>
          <div className="display" style={{ fontSize: 28, lineHeight: 1.05 }}>
            Data publiceras under <span style={{ color: "var(--c3)" }}>CC BY 4.0</span>.
          </div>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, marginTop: 14, maxWidth: "64ch" }}>
            Vid vidareanvändning ska ursprungskällan anges enligt attributionstexten per mätetal. Se{" "}
            <Link href="/om-data" className="link-ink" style={{ color: "var(--ink)", borderBottom: "1px solid var(--ink)" }}>Om datan</Link>.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
