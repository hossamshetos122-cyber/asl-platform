"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { updateSiteSettings } from "@/lib/actions/settings";
import { ImageUpload } from "@/components/ui/image-upload";

type SettingsProps = {
  leagueName: string;
  leagueNameEn: string;
  cityName: string;
  logoUrl: string;
  accentColor: string;
  bgColor: string;
};

function validateHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

// --- small hex helpers mirroring src/lib/data/site-config.ts ---------------
function hexToRgb(hex: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m || !m[1]) return "10 38 71";
  const v = parseInt(m[1], 16);
  return `${(v >> 16) & 255} ${(v >> 8) & 255} ${v & 255}`;
}
function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}
function toHex(r: number, g: number, b: number): string {
  const c = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function toRgbNums(hex: string): [number, number, number] {
  const parts = hexToRgb(hex).split(" ").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}
/** Mix `hex` toward `target` by `t` (0..1). */
function blend(hex: string, target: string, t: number): string {
  const [r1, g1, b1] = toRgbNums(hex);
  const [r2, g2, b2] = toRgbNums(target);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}
/** Darken `hex` by factor `keep` (0..1, e.g. 0.78 keeps 78% brightness). */
function shade(hex: string, keep: number): string {
  const [r, g, b] = toRgbNums(hex);
  return toHex(r * keep, g * keep, b * keep);
}

/** Build the full CSS-variable set for the given bg + accent colours. */
function buildThemeVars(bg: string, accent: string): Record<string, string> {
  const k = (
    name: string,
    hex: string,
  ): Record<string, string> => ({
    [name]: hex,
    [`${name}-rgb`]: hexToRgb(hex),
  });
  return {
    ...k("--bg", bg),
    ...k("--accent", accent),
    ...k("--bg-deep", shade(bg, 0.78)),
    ...k("--surface", blend(bg, "#2b6cff", 0.08)),
    ...k("--surface-elevated", blend(bg, "#2b6cff", 0.12)),
    ...k("--surface-raised2", blend(bg, "#2b6cff", 0.18)),
    ...k("--purple", blend(bg, "#2e7bff", 0.08)),
    ...k("--purple-dim", shade(bg, 0.94)),
    ...k("--navy", blend(bg, "#2b6cff", 0.15)),
    ...k("--navy-light", blend(bg, "#4b9bff", 0.3)),
    ...k("--accent-bright", blend(accent, "#ffffff", 0.45)),
    ...k("--accent-dim", shade(accent, 0.7)),
    ...k("--accent-faint", accent),
    ...k("--line-accent", accent),
  };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
    </button>
  );
}

export default function SettingsForm(props: SettingsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [leagueName, setLeagueName] = useState(props.leagueName);
  const [leagueNameEn, setLeagueNameEn] = useState(props.leagueNameEn);
  const [cityName, setCityName] = useState(props.cityName);
  const [logoUrl, setLogoUrl] = useState<string | null>(props.logoUrl);
  const [accentColor, setAccentColor] = useState(props.accentColor);
  const [bgColor, setBgColor] = useState(props.bgColor);

  // Live preview: inject the picked colors onto <body> as CSS variables so the
  // admin sees the whole platform recolour instantly, before saving.
  const applyPreview = (bg: string, accent: string) => {
    if (!validateHex(bg) || !validateHex(accent)) return;
    const vars = buildThemeVars(bg, accent);
    const target = document.body;
    Object.entries(vars).forEach(([name, value]) => {
      target.style.setProperty(name, value);
    });
  };

  const resetPreview = () => {
    const vars = buildThemeVars(props.bgColor, props.accentColor);
    const target = document.body;
    Object.entries(vars).forEach(([name, value]) => {
      target.style.setProperty(name, value);
    });
  };

  return (
    <form
      action={async (formData) => {
        setError(null);
        setSaved(false);
        const res = await updateSiteSettings(formData);
        if (res.ok) {
          setSaved(true);
          router.refresh();
        } else {
          setError(res.error || "حدث خطأ أثناء الحفظ");
          // revert live preview to saved values on failure
          resetPreview();
        }
      }}
      className="rounded-xl border border-line bg-surface p-5 sm:p-6"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-live/30 bg-live/10 px-4 py-2 font-body text-[12px] text-live">
          {error}
        </div>
      )}
      {saved && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-body text-[12px] text-emerald-500">
          تم حفظ الإعدادات وتطبيقها على الموقع.
        </div>
      )}

      {/* شعار الدوري */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div>
          <ImageUpload
            name="logoUrl"
            purpose="general"
            label="شعار الدوري"
            value={logoUrl}
            onChange={setLogoUrl}
          />
          <input type="hidden" name="logoUrl" value={logoUrl ?? ""} />
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اسم الدوري (بالعربية)</label>
            <input
              name="leagueName"
              required
              minLength={2}
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
              placeholder="مثال: دوري أحياء القاهرة"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اسم الدوري (بالإنجليزية)</label>
            <input
              name="leagueNameEn"
              value={leagueNameEn}
              onChange={(e) => setLeagueNameEn(e.target.value)}
              dir="ltr"
              className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent text-left"
              placeholder="Example: Cairo Districts League"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اسم المدينة / الحي</label>
            <input
              name="cityName"
              required
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
              placeholder="مثال: القاهرة"
            />
          </div>
        </div>
      </div>

      {/* الألوان */}
      <div className="mt-6">
        <p className="mb-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الألوان الرئيسية</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اللون الخلفي (Background)</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={validateHex(bgColor) ? bgColor : "#0A2647"}
                onChange={(e) => { setBgColor(e.target.value); applyPreview(e.target.value, accentColor); }}
                className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-bg p-1"
              />
              <input
                name="bgColor"
                value={bgColor}
                onChange={(e) => { setBgColor(e.target.value); applyPreview(e.target.value, accentColor); }}
                dir="ltr"
                className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent text-left font-num"
                placeholder="#0A2647"
                required
              />
            </div>
            <p className="mt-1 font-body text-[10px] text-text-dimmer">اللون الكحلي الرئيسي الذي تظهر به الخلفيات والبطاقات.</p>
          </div>

          <div>
            <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اللون الأساسي (Accent)</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={validateHex(accentColor) ? accentColor : "#FF6B35"}
                onChange={(e) => { setAccentColor(e.target.value); applyPreview(bgColor, e.target.value); }}
                className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-bg p-1"
              />
              <input
                name="accentColor"
                value={accentColor}
                onChange={(e) => { setAccentColor(e.target.value); applyPreview(bgColor, e.target.value); }}
                dir="ltr"
                className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent text-left font-num"
                placeholder="#FF6B35"
                required
              />
            </div>
            <p className="mt-1 font-body text-[10px] text-text-dimmer">اللون البرتقالي المستخدم للأزرار والعناصر النشطة.</p>
          </div>
        </div>
      </div>

      {/* معاينة حية */}
      <div className="mt-6 rounded-xl border border-line bg-bg p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">معاينة حية</p>
          <button
            type="button"
            onClick={resetPreview}
            className="rounded-lg border border-line px-3 py-1.5 font-body text-[11px] font-bold text-text-dim transition-colors hover:text-text"
          >
            إعادة اللون الافتراضي
          </button>
        </div>
        <div className="rounded-lg border border-line bg-surface p-4">
          <img
            src={logoUrl || "/images/league-logo.jpg"}
            alt=""
            className="mb-3 h-12 w-12 rounded-full border border-accent/30 object-cover"
          />
          <div className="font-display text-lg font-black text-text">{leagueName || "اسم الدوري"}</div>
          <div className="font-body text-[11px] text-text-dim" dir="ltr">{leagueNameEn || "League Name"}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge-accent">{cityName || "المدينة"}</span>
            <button type="button" className="btn-primary pointer-events-none">زر تجريبي</button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <SubmitButton />
        <button
          type="button"
          onClick={resetPreview}
          className="rounded-lg border border-line px-4 py-2 font-body text-[12px] font-bold text-text-dim transition-colors hover:text-text"
        >
          تجاهل التغييرات
        </button>
      </div>
    </form>
  );
}
