import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Nav />
      <section style={{ padding: "40px 28px 120px" }}>
        <div className="station" style={{ padding: 60 }}>
          <div className="caps" style={{ color: "var(--c1)", marginBottom: 18 }}>
            FIG 404 · sidan saknas
          </div>
          <h1 className="display-black" style={{ fontSize: 120, lineHeight: 0.88 }}>
            Fanns <span style={{ color: "var(--c1)" }}>inte</span>.
          </h1>
          <p style={{ marginTop: 22, maxWidth: 520, fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Mätetalet eller regionen existerar inte. Gå tillbaka till{" "}
            <Link href="/" className="link-ink" style={{ color: "var(--ink)", borderBottom: "1px solid var(--ink)" }}>
              atlasen
            </Link>.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
