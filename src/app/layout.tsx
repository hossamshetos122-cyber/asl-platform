import type { Metadata } from "next";
import { Alexandria, Tajawal, Anton, Rajdhani } from "next/font/google";
import "./globals.css";

// Self-hosted at build time by next/font — no runtime request to Google Fonts,
// which also means no layout shift and better Core Web Vitals / SEO.
const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-alexandria",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-rajdhani",
});

export const metadata: Metadata = {
  title: "دوري نجوم الإسكندرية للهواة",
  description:
    "المنصة الرسمية لإدارة وتنظيم بطولات كرة القدم للهواة في الإسكندرية — نتائج مباشرة، جداول ترتيب، وإدارة فرق.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${alexandria.variable} ${tajawal.variable} ${anton.variable} ${rajdhani.variable}`}
    >
      <body className="bg-bg text-text font-body antialiased">{children}</body>
    </html>
  );
}
