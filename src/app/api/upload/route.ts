import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const VALID_PURPOSES = new Set(["team-logo", "player-photo", "tournament-logo", "tournament-cover", "general"]);

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const purpose = String(formData.get("purpose") || "general");

    if (!VALID_PURPOSES.has(purpose)) {
      return NextResponse.json({ error: "غرض الرفع غير صالح" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "لم يتم اختيار ملف" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "نوع الملف غير مدعوم. الأنواع المدعومة: JPG, PNG, WebP, GIF" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `حجم الملف يتجاوز الحد الأقصى (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)` },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      url: dataUri,
      name: sanitizeFilename(file.name),
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json({ error: "تعذّر رفع الملف" }, { status: 500 });
  }
}
