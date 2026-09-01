"use client";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

/**
 * A visible, mobile-friendly search box (>=44px touch target) that filters
 * lists client-side as the user types.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "ابحث...",
  label,
}: SearchInputProps) {
  return (
    <div className="relative w-full">
      <svg
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dimmer"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="min-h-11 w-full rounded-lg border border-line bg-surface pr-10 pl-3 font-body text-[13px] text-text outline-none transition-colors placeholder:text-text-dimmer focus:border-accent"
        dir="rtl"
      />
    </div>
  );
}
