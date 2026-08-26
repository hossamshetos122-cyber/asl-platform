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
    <div
      className={`mb-6 sm:mb-8 flex items-baseline justify-between pb-4 sm:pb-5 ${
        bordered ? "border-b border-line" : ""
      }`}
    >
      <h2 className="flex items-center gap-3 section-title">
        {title}
        <span className="badge-gold">
          {tag}
        </span>
      </h2>
      {href ? (
        <Link href={href} className="flex items-center gap-1 font-body text-xs sm:text-sm font-bold text-gold transition-colors hover:text-gold-bright">
          {linkLabel}
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M2 6h8M7 3l3 3-3 3" />
          </svg>
        </Link>
      ) : null}
    </div>
  );
}
