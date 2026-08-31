import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const idSchema = z.string().min(2).max(50);

/**
 * Public lightweight snapshot for live polling. Returns only the mutable
 * bits (status / score / minute) so viewers never refresh the page to see
 * a referee or admin update the match.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });
  }

  const match = await prisma.match
    .findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        homeScore: true,
        awayScore: true,
        minute: true,
        updatedAt: true,
      },
    })
    .catch(() => null);

  if (!match) {
    return NextResponse.json({ error: "المباراة غير موجودة" }, { status: 404 });
  }

  return NextResponse.json(
    {
      id: match.id,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      minute: match.minute,
      updatedAt: match.updatedAt.toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}