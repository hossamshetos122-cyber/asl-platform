import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg flex items-center justify-center px-4">
      <div className="hero-glow-orb -top-40 right-[-120px] h-96 w-96 bg-accent/10" />
      <div className="hero-glow-orb bottom-[-160px] left-[-120px] h-96 w-96 bg-accent/[0.07]" />

      <div className="relative text-center max-w-md">
        <div className="font-num text-[120px] leading-none text-gradient-gold sm:text-[160px] select-none">
          404
        </div>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl font-black text-text">
          الصفحة مش موجودة
        </h1>
        <p className="mt-3 font-body text-sm sm:text-base text-text-dim leading-relaxed">
          يبدو أنك طلعت بره الملعب.. الرابط ده مش موجود أو اتشال. رجّع للرئيسية وتابع الحماس.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-body text-sm font-black text-[#0b1220] transition-all hover:bg-accent-bright hover:shadow-glow active:scale-[0.98]"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v6M3 8h5l4 4M3 13l4-4" />
            </svg>
            العودة للرئيسية
          </Link>
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-surface px-6 py-3 font-body text-sm font-bold text-text transition-all hover:border-accent/50 hover:bg-surface-elevated"
          >
            تصفح المباريات
          </Link>
        </div>
      </div>
    </div>
  );
}