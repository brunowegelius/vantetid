import { SOURCES } from "@/lib/catalog";

export function Footer() {
  return (
    <footer style={{ padding: "40px 28px 60px" }}>
      <div className="station" style={{ padding: 28 }}>
        <div className="display-black" style={{ fontSize: 22, marginBottom: 18 }}>Kolofon</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 22 }}>
          <div>
            <div className="caps" style={{ color: "var(--ink-3)", marginBottom: 4 }}>Källor</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>
              {SOURCES.map((s, i) => (
                <span key={s.slug}>
                  <a className="link-ink" href={s.homepage_url} target="_blank" rel="noreferrer" style={{ color: "var(--ink)" }}>
                    {s.name}
                  </a>
                  {i < SOURCES.length - 1 ? " · " : ""}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="caps" style={{ color: "var(--ink-3)", marginBottom: 4 }}>Typsnitt</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>
              Cabinet Grotesk · General Sans · JetBrains Mono
            </div>
          </div>
          <div>
            <div className="caps" style={{ color: "var(--ink-3)", marginBottom: 4 }}>Licens</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>
              Egen data CC BY 4.0. Ursprungskällor anges per mätetal.
            </div>
          </div>
          <div>
            <div className="caps" style={{ color: "var(--ink-3)", marginBottom: 4 }}>© {new Date().getFullYear()}</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>
              Väntetid · öppen översikt över svensk vård
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
