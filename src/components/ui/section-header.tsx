import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  tag: string;
  href?: string;
  linkLabel?: string;
  bordered?: boolean;
}

export function SectionHeader({
  title,
  tag,
  href,
  linkLabel = "عرض الكل",
  bordered = true,
}: SectionHeaderProps) {
  return (
    <div className={`mb-5 sm:mb-6 flex items-center justify-between ${bordered ? "pb-3 border-b border-line" : ""}`}>
      <h2 className="flex items-center gap-2.5">
        <span className="font-display text-lg sm:text-xl font-black text-text">{title}</span>
        <span className="rounded border border-gold/20 bg-gold/5 px-2 py-0.5 font-utility text-[9px] tracking-[0.15em] text-gold uppercase">
          {tag}
        </span>
      </h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 font-body text-[11px] font-bold text-gold transition-colors hover:bg-gold/5 gold-underline">
          {linkLabel}
          <svg className="h-2.5 w-2.5 rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M2 6h8M7 3l3 3-3 3" />
          </svg>
        </Link>
      )}
    </div>
  );
}
