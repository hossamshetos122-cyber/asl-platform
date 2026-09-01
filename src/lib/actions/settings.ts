"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { siteConfigSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";
import { invalidateSiteConfig, DEFAULT_SITE_CONFIG } from "@/lib/data/site-config";

export type SiteSettingsResult = { ok: boolean; error?: string };

export async function updateSiteSettings(
  formData: FormData,
): Promise<SiteSettingsResult> {
  const user = await requireAdmin();

  const parsed = siteConfigSchema.safeParse({
    leagueName: formData.get("leagueName"),
    leagueNameEn: formData.get("leagueNameEn"),
    cityName: formData.get("cityName"),
    logoUrl: formData.get("logoUrl"),
    accentColor: formData.get("accentColor"),
    bgColor: formData.get("bgColor"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  const { leagueName, leagueNameEn, cityName, logoUrl, accentColor, bgColor } =
    parsed.data;

  try {
    await prisma.siteConfig.upsert({
      where: { id: "default" },
      update: {
        leagueName,
        leagueNameEn: leagueNameEn || DEFAULT_SITE_CONFIG.leagueNameEn,
        cityName,
        logoUrl: logoUrl || DEFAULT_SITE_CONFIG.logoUrl,
        accentColor,
        primaryColor: bgColor,
      },
      create: {
        id: "default",
        leagueName,
        leagueNameEn: leagueNameEn || DEFAULT_SITE_CONFIG.leagueNameEn,
        cityName,
        logoUrl: logoUrl || DEFAULT_SITE_CONFIG.logoUrl,
        accentColor,
        primaryColor: bgColor,
      },
    });

    await auditLog({
      actorId: user.id,
      action: "UPDATE_SITE_SETTINGS",
      targetId: "default",
      metadata: { leagueName },
    });

    await invalidateSiteConfig();
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
  } catch (error) {
    console.error("[updateSiteSettings]", error);
    return { ok: false, error: "تعذّر حفظ الإعدادات. حاول مرة أخرى." };
  }

  return { ok: true };
}
