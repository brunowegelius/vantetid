import Link from "next/link";
import { SOURCES, METRICS, CATEGORY_LABEL } from "@/lib/catalog";

export const metadata = { title: "Om datan — Väntetid" };

export default function AboutPage() {
  return (
    <>
      <section className="grid-wide pt-10 pb-10">
        <div className="text-2xs uppercase tracking-wider text-subtle mb-3">
          <Link href="/" className="link-ink">Översikt</Link> / Om datan
        </div>
        <h1 className="serif text-5xl md:text-6xl leading-[1] tracking-[-0.01em]">Om datan.</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Sajten sammanställer offentligt tillgänglig data om väntetider i svensk vård. Allt som
          visas kan spåras tillbaka till sin ursprungskälla — inget aggregeras utan källhänvisning
          och tidsstämpel.
        </p>
      </section>

      <section className="grid-wide pb-10 prose-clean">
        <div className="rule mb-8" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-3">
            <div className="text-2xs uppercase tracking-wider text-subtle">Metodologi</div>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2>Pålitlighet</h2>
            <p>Varje datapunkt lagras med sin ursprungs-URL, tidpunkten den hämtades och
               en SHA-256-hash av det exakta svaret från källan. Inget skrivs över — historiken är
               append-only och kan reproduceras i efterhand.</p>

            <h3>Validering</h3>
            <p>Varje automatisk körning jämförs mot föregående publicerat värde per (mätetal, region, period).
               Värden som avviker mer än 30 % hålls tillbaka och publiceras inte förrän de granskats manuellt.
               Saknade regioner flaggas men blockerar inte övriga.</p>

            <h3>Uppdateringsfrekvens</h3>
            <p>Kolada-data hämtas varje natt. Socialstyrelsens data hämtas andra torsdagen varje månad
               (den tidpunkt myndigheten själv publicerar). Sveriges dataportal scannas veckovis för att
               upptäcka nya regionala dataset.</p>

            <h3>Räkneregler</h3>
            <p>Värden redovisas precis som källan rapporterar dem — ingen normalisering eller viktning
               sker utöver sidans visuella rank-färgning (som baseras på vårdgarantimål eller bästa/sämsta
               värde bland regionerna).</p>

            <h2>Datakällor</h2>
            <ul>
              {SOURCES.map(s => (
                <li key={s.slug}>
                  <a className="link-ink" href={s.homepage_url} target="_blank" rel="noreferrer">
                    <span className="text-ink">{s.name}</span>
                  </a>
                  {" — "}<span className="text-muted">{s.attribution}. Licens: {s.license}.</span>
                  {s.notes && <div className="text-2xs uppercase tracking-wider text-subtle mt-1">{s.notes}</div>}
                </li>
              ))}
            </ul>

            <h2>Aktuella mätetal</h2>
            <p>Följande {METRICS.length} KPI:er visas idag. Sidan kompletteras löpande när nya öppna dataset
               publiceras av Socialstyrelsen, SKR eller regionerna.</p>
            <ul>
              {METRICS.map(m => (
                <li key={m.slug}>
                  <Link href={`/matt/${m.slug}`} className="link-ink">
                    <span className="text-ink">{m.name_sv}</span>
                  </Link>
                  {" — "}<span className="text-muted">{CATEGORY_LABEL[m.category]}, KPI <span className="num">{m.source_kpi_id}</span></span>
                </li>
              ))}
            </ul>

            <h2>Ansvar och rättelser</h2>
            <p>Innehållet på sajten presenterar endast vidarepublicerad öppen data. Om en siffra ser fel
               ut är första steget att följa källa-länken och kontrollera värdet direkt mot upphovsmannens
               system. Rättelser kan skickas via den publika kontaktkanalen på <Link className="link-ink" href="/api-docs">API-sidan</Link>.</p>
          </div>
        </div>
      </section>
    </>
  );
}
