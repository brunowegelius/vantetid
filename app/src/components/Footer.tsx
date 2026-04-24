import Link from "next/link";
import { SOURCES } from "@/lib/catalog";

export function Footer() {
  return (
    <footer className="mt-32 pb-16">
      <div className="grid-wide">
        <div className="rule mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-sm">
          <div>
            <div className="serif text-xl leading-none">Väntetid</div>
            <p className="text-muted mt-3 max-w-xs">
              Öppen, verifierbar översikt över väntetider i svensk vård. Automatiskt uppdaterad.
              Varje datapunkt spårbar till sin källa.
            </p>
          </div>
          <div>
            <div className="text-2xs uppercase tracking-wider text-subtle mb-3">Sajten</div>
            <ul className="space-y-1.5">
              <li><Link className="link-ink" href="/">Översikt</Link></li>
              <li><Link className="link-ink" href="/jamfor">Jämför regioner</Link></li>
              <li><Link className="link-ink" href="/om-data">Metodologi</Link></li>
              <li><Link className="link-ink" href="/api-docs">Publikt API</Link></li>
              <li><Link className="link-ink" href="/ladda-ner">Ladda ner data</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-2xs uppercase tracking-wider text-subtle mb-3">Källor</div>
            <ul className="space-y-1.5">
              {SOURCES.map(s => (
                <li key={s.slug}>
                  <a className="link-ink" href={s.homepage_url} target="_blank" rel="noreferrer">
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-2xs uppercase tracking-wider text-subtle mb-3">Licens</div>
            <p className="text-muted">
              All egen data publiceras under <span className="text-ink">CC BY 4.0</span>. Vidareanvändning
              ska ange ursprungskällorna enligt attributionstext per mätetal.
            </p>
          </div>
        </div>
        <div className="rule mt-10 mb-6" />
        <div className="text-2xs uppercase tracking-wider text-subtle flex justify-between">
          <span>© {new Date().getFullYear()} Väntetid</span>
          <span>byggd med öppna källor</span>
        </div>
      </div>
    </footer>
  );
}
