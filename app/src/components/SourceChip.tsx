import { getSourceBySlug } from "@/lib/catalog";

export function SourceChip({ sourceSlug, url }: { sourceSlug: string; url?: string | null }) {
  const src = getSourceBySlug(sourceSlug);
  if (!src) return null;
  const label = src.name;
  return (
    <a href={url ?? src.homepage_url} target="_blank" rel="noreferrer"
       className="text-2xs uppercase tracking-wider text-subtle link-ink">
      {label}
    </a>
  );
}
