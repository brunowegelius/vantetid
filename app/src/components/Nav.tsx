import Link from "next/link";

const links = [
  { href: "/jamfor",    label: "Jämför" },
  { href: "/om-data",   label: "Om datan" },
  { href: "/api-docs",  label: "API" },
  { href: "/ladda-ner", label: "Ladda ner" },
];

export function Nav() {
  return (
    <div
      style={{
        padding: "18px 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <Link
        href="/"
        style={{
          background: "var(--ink)",
          color: "var(--bg)",
          padding: "10px 16px",
          display: "inline-flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ width: 8, height: 8, background: "var(--c1)" }} />
        <span className="display" style={{ fontSize: 15 }}>Väntetid · Atlas</span>
        <span className="mono" style={{ fontSize: 10.5, opacity: 0.6, letterSpacing: "0.08em" }}>
          ÅTER TILL KARTAN ←
        </span>
      </Link>
      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="caps"
            style={{
              padding: "10px 14px",
              background: "var(--bg)",
              color: "var(--ink)",
              outline: "1px solid var(--ink)",
            }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
