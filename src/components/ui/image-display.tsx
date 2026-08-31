"use client";

import Image from "next/image";
import { useState } from "react";

type ImageType = "team-logo" | "player" | "tournament" | "cover" | "avatar" | "news";

interface ImageDisplayProps {
  src: string | null | undefined;
  alt: string;
  type?: ImageType;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fill?: boolean;
  priority?: boolean;
  shortCode?: string;
}

const SIZE_MAP = {
  xs: { container: "h-6 w-6", text: "text-[10px]" },
  sm: { container: "h-8 w-8", text: "text-xs" },
  md: { container: "h-12 w-12", text: "text-sm" },
  lg: { container: "h-20 w-20", text: "text-xl" },
  xl: { container: "h-24 w-24", text: "text-2xl" },
} as const;

function TeamLogoFallback({ shortCode, size }: { shortCode?: string; size: string }) {
  return (
    <div className={`${size} flex items-center justify-center rounded-2xl border border-accent/25 bg-gradient-to-br from-[#123B6B] to-purple-bright/30`}>
      <span className="font-display font-black text-accent-bright">{shortCode || "FK"}</span>
    </div>
  );
}

function PlayerFallback({ size }: { size: string }) {
  return (
    <div className={`${size} flex items-center justify-center rounded-xl border border-accent/20 bg-gradient-to-br from-[#123B6B] to-surface-raised2`}>
      <svg className="h-1/2 w-1/2 text-accent" viewBox="0 0 24 24" fill="currentColor" opacity="0.55">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
}

function TournamentFallback({ size }: { size: string }) {
  return (
    <div className={`${size} flex items-center justify-center rounded-xl border border-accent/20 bg-gradient-to-br from-[#123B6B] to-surface-raised2`}>
      <svg className="h-1/2 w-1/2 text-accent-bright" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55">
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6m12 5h1.5a2.5 2.5 0 000-5H18M4 22h16M10 22V8a2 2 0 012-2h0a2 2 0 012 2v14" />
      </svg>
    </div>
  );
}

function CoverFallback({ size }: { size: string }) {
  return (
    <div className={`${size} flex items-center justify-center rounded-xl border border-accent/15 bg-gradient-to-br from-[#123B6B] via-purple to-bg`}>
      <div className="text-center">
        <svg className="mx-auto h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <span className="mt-1 block font-utility text-[8px] tracking-wider text-text-dim">ASL</span>
      </div>
    </div>
  );
}

function AvatarFallback({ name, size }: { name: string; size: string }) {
  const initial = ((name || "").trim().charAt(0) || "؟").toUpperCase();

  return (
    <div className={`${size} flex items-center justify-center rounded-full border border-accent/25 bg-gradient-to-br from-[#123B6B] to-purple-bright/30`}>
      <span className="font-display font-black text-accent-bright">{initial}</span>
    </div>
  );
}

function getFallback(type: ImageType, size: string, shortCode?: string, alt?: string) {
  switch (type) {
    case "team-logo":
      return <TeamLogoFallback shortCode={shortCode} size={size} />;
    case "player":
      return <PlayerFallback size={size} />;
    case "tournament":
      return <TournamentFallback size={size} />;
    case "cover":
      return <CoverFallback size={size} />;
    case "news":
      return <CoverFallback size={size} />;
    case "avatar":
      return <AvatarFallback name={alt || ""} size={size} />;
    default:
      return <PlayerFallback size={size} />;
  }
}

export function ImageDisplay({
  src,
  alt,
  type = "player",
  className = "",
  size = "md",
  fill = false,
  priority = false,
  shortCode,
}: ImageDisplayProps) {
  const [error, setError] = useState(false);
  const sizeConfig = SIZE_MAP[size];

  const oversizedDataUri = !!src && src.startsWith("data:") && src.length > 5_000_000;

  if (!src || oversizedDataUri || error) {
    return (
      <div className={className}>
        {getFallback(type, sizeConfig.container, shortCode || alt, alt)}
      </div>
    );
  }

  const borderRadius =
    type === "team-logo" ? "rounded-2xl" :
    type === "player" ? "rounded-xl" :
    type === "avatar" ? "rounded-full" :
    "rounded-xl";

  const objectFit = type === "player" || type === "cover" || type === "news" ? "object-cover" : "object-contain";

  if (fill) {
    return (
      <div className={`relative overflow-hidden ${borderRadius} ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          className={objectFit}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={96}
      height={96}
      className={`${sizeConfig.container} ${borderRadius} ${objectFit} ${className}`}
      priority={priority}
      onError={() => setError(true)}
    />
  );
}
