import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import { getSiteConfig, siteCssVars } from "@/lib/data/site-config";
import "./globals.css";

// Self-hosted at build time by next/font — no runtime request to Google Fonts,
// which also means no layout shift and better Core Web Vitals / SEO.
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-cairo",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
});

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getSiteConfig();
  return {
    title: cfg.leagueName,
    description: `المنصة الرسمية لإدارة وتنظيم بطولات كرة القدم للهواة في ${cfg.cityName} — نتائج مباشرة، جداول ترتيب، وإدارة فرق.`,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cfg = await getSiteConfig();
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${tajawal.variable}`}
    >
      <body style={siteCssVars(cfg)} className="bg-bg text-text font-body antialiased">
        {children}
      </body>
    </html>
  );
}
