import { getSourceBySlug } from "@/lib/catalog";

export function SourceChip({ sourceSlug, url }: { sourceSlug: string; url?: string | null }) {
  const src = getSourceBySlug(sourceSlug);
  if (!src) return null;
  return (
    <a
      href={url ?? src.homepage_url}
      target="_blank"
      rel="noreferrer"
      className="caps link-ink"
      style={{ color: "var(--ink-2)" }}
    >
      {src.name}
    </a>
  );
}
