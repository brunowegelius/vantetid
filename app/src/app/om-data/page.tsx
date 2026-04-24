import Link from "next/link";
import { SOURCES, METRICS, CATEGORY_LABEL } from "@/lib/catalog";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Om datan — Väntetid" };

export default function AboutPage() {
  return (
    <>
      <Nav />

      <section style={{ padding: "20px 28px 40px" }}>
        <div className="station" style={{ padding: 40 }}>
          <div className="caps" style={{ color: "var(--c4)", marginBottom: 18 }}>
            FIG 00 · Metodologi
          </div>
          <h1 className="display-black" style={{ fontSize: 80, lineHeight: 0.92 }}>
            Om datan.
          </h1>
          <p style={{ marginTop: 22, maxWidth: 640, fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Sajten sammanställer offentligt tillgänglig data om väntetider i svensk vård. Allt som visas kan spåras tillbaka till sin ursprungskälla — inget aggregeras utan källhänvisning och tidsstämpel.
          </p>
        </div>
      </section>

      <section style={{ padding: "0 28px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <div className="station" style={{ padding: 28 }}>
            <div className="caps" style={{ color: "var(--c3)" }}>01 · pålitlighet</div>
            <div className="display" style={{ fontSize: 24, marginTop: 10, lineHeight: 1.1 }}>
              Append-only historik.
            </div>
            <p style={{ marginTop: 14, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>
              Varje datapunkt lagras med sin ursprungs-URL, tidpunkten den hämtades och en SHA-256-hash av det exakta svaret från källan. Historiken är append-only och kan reproduceras i efterhand.
            </p>
          </div>

          <div className="station" style={{ padding: 28 }}>
            <div className="caps" style={{ color: "var(--c1)" }}>02 · validering</div>
            <div className="display" style={{ fontSize: 24, marginTop: 10, lineHeight: 1.1 }}>
              Avvikelser stoppas.
            </div>
            <p style={{ marginTop: 14, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>
              Varje automatisk körning jämförs mot föregående värde per (mätetal, region, period). Värden som avviker mer än 30 % hålls tillbaka och publiceras inte förrän de granskats manuellt. Saknade regioner flaggas men blockerar inte övriga.
            </p>
          </div>

          <div className="station" style={{ padding: 28 }}>
            <div className="caps" style={{ color: "var(--c2)" }}>03 · frekvens</div>
            <div className="display" style={{ fontSize: 24, marginTop: 10, lineHeight: 1.1 }}>
              Nattligt ETL-pass.
            </div>
            <p style={{ marginTop: 14, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>
              Kolada hämtas varje natt. Socialstyrelsens data hämtas andra torsdagen varje månad (när myndigheten publicerar). Sveriges dataportal scannas veckovis för att upptäcka nya regionala dataset.
            </p>
          </div>

          <div className="station" style={{ padding: 28 }}>
            <div className="caps" style={{ color: "var(--c5)" }}>04 · räkneregler</div>
            <div className="display" style={{ fontSize: 24, marginTop: 10, lineHeight: 1.1 }}>
              Ingen tyst bearbetning.
            </div>
            <p style={{ marginTop: 14, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>
              Värden redovisas precis som källan rapporterar dem — ingen normalisering eller viktning sker utöver sidans rank-färgning (som baseras på vårdgarantimål eller bästa/sämsta värde bland regionerna).
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: "0 28px 40px" }}>
        <div className="station" style={{ padding: 32 }}>
          <div className="caps" style={{ color: "var(--ink-3)", marginBottom: 16 }}>FIG 05 · Datakällor</div>
          <div className="display-black" style={{ fontSize: 32, marginBottom: 22 }}>Tre källor, en kolumn.</div>
          <div style={{ display: "grid", gap: 20 }}>
            {SOURCES.map(s => (
              <div key={s.slug} style={{ borderLeft: "3px solid var(--ink)", paddingLeft: 18 }}>
                <a
                  className="display link-ink"
                  style={{ fontSize: 20, color: "var(--ink)" }}
                  href={s.homepage_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.name} →
                </a>
                <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6, lineHeight: 1.55 }}>
                  {s.attribution}. Licens: {s.license}.
                </p>
                {s.notes && (
                  <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6, letterSpacing: "0.04em" }}>
                    {s.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 28px 40px" }}>
        <div className="station" style={{ padding: 32 }}>
          <div className="caps" style={{ color: "var(--ink-3)", marginBottom: 16 }}>FIG 06 · Aktuella mätetal</div>
          <div className="display-black" style={{ fontSize: 32, marginBottom: 22 }}>
            {METRICS.length} KPI:er visas idag.
          </div>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: "70ch", marginBottom: 22 }}>
            Sidan kompletteras löpande när nya öppna dataset publiceras av Socialstyrelsen, SKR eller regionerna.
          </p>
          <div style={{ display: "grid", gap: 0 }}>
            {METRICS.map(m => (
              <Link
                key={m.slug}
                href={`/matt/${m.slug}`}
                className="link-ink"
                style={{
                  padding: "14px 0",
                  borderTop: "1px solid var(--bg-2)",
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 16,
                  alignItems: "baseline",
                }}
              >
                <span style={{ fontSize: 14 }}>{m.name_sv}</span>
                <span className="caps" style={{ color: "var(--ink-3)" }}>
                  {CATEGORY_LABEL[m.category]}
                </span>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                  KPI {m.source_kpi_id}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 28px 40px" }}>
        <div className="station" style={{ padding: 32 }}>
          <div className="caps" style={{ color: "var(--c6)", marginBottom: 16 }}>FIG 07 · Rättelser</div>
          <div className="display" style={{ fontSize: 24, lineHeight: 1.1 }}>
            Om en siffra ser fel ut — följ källa-länken.
          </div>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, marginTop: 14, maxWidth: "64ch" }}>
            Innehållet på sajten presenterar endast vidarepublicerad öppen data. Första steget är alltid att kontrollera värdet direkt mot upphovsmannens system. Rättelser kan skickas via den publika kontaktkanalen på{" "}
            <Link href="/api-docs" className="link-ink" style={{ color: "var(--ink)", borderBottom: "1px solid var(--ink)" }}>
              API-sidan
            </Link>.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
