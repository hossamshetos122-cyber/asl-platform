interface PageHeroProps {
  title: string;
  tag: string;
  description?: string;
}

/**
 * Premium page banner used atop the browse/stat pages.
 * Renders inside the page container above the content: gold glow, hairlines,
 * display title + tag pill — matching the black/charcoal/gold identity.
 */
export function PageHero({ title, tag, description }: PageHeroProps) {
  return (
    <div className="relative mb-7 overflow-hidden rounded-xl border border-line bg-surface/40 px-5 py-7 sm:px-7">
      <div className="hero-glow-orb -top-24 right-10 h-56 w-72 bg-accent/[0.07]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-3">
          <span className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-text tracking-tight">
            {title}
          </span>
          <span className="rounded border border-accent/30 bg-accent/10 px-2.5 py-1 font-utility text-[9px] tracking-[0.2em] text-accent-bright uppercase">
            {tag}
          </span>
        </h1>
      </div>
      {description && (
        <p className="relative mt-2.5 max-w-xl font-body text-sm text-text-dim leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}