import Link from "next/link";

const links = [
  { href: "/",            label: "Översikt" },
  { href: "/jamfor",      label: "Jämför" },
  { href: "/om-data",     label: "Om datan" },
  { href: "/api-docs",    label: "API" },
  { href: "/ladda-ner",   label: "Ladda ner" },
];

export function Nav() {
  return (
    <header className="pt-8 pb-4">
      <div className="grid-wide flex items-baseline justify-between gap-8">
        <Link href="/" className="flex items-baseline gap-3 link-ink">
          <span className="serif text-2xl leading-none">Väntetid</span>
          <span className="text-2xs uppercase tracking-wider text-muted">öppen data om svensk vård</span>
        </Link>
        <nav className="flex items-baseline gap-6 text-sm">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="link-ink text-ink/80 hover:text-muted">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="grid-wide mt-6"><div className="rule" /></div>
    </header>
  );
}
