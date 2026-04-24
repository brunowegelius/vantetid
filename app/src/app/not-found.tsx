import Link from "next/link";

export default function NotFound() {
  return (
    <section className="grid-wide pt-24 pb-48">
      <div className="text-2xs uppercase tracking-wider text-subtle">404</div>
      <h1 className="serif text-5xl md:text-6xl mt-2 leading-[1] tracking-[-0.01em]">Sidan hittades inte.</h1>
      <p className="mt-4 max-w-xl text-muted">
        Mätetalet eller regionen existerar inte. Gå tillbaka till <Link href="/" className="link-ink text-ink">översikten</Link>.
      </p>
    </section>
  );
}
