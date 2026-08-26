import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TeamBadge } from "@/components/ui/team-badge";
import { getPlayerById } from "@/lib/data/players";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const POSITION_LABELS: Record<string, string> = {
  GOALKEEPER: "حارس مرمى",
  DEFENDER: "مدافع",
  MIDFIELDER: "لاعب وسط",
  FORWARD: "مهاجم",
};

interface PlayerProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const { id } = await params;
  const result = await getPlayerById(id);

  if (result.status === "error" || result.status === "empty") notFound();

  const player = result.data;

  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <Link
          href="/teams"
          className="mb-6 inline-flex items-center gap-1 font-body text-sm text-gold hover:text-gold-bright transition-colors"
        >
          <svg
            className="h-3 w-3 rotate-180"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M2 6h8M7 3l3 3-3 3" />
          </svg>
          العودة للفرق
        </Link>

        {/* Player Header */}
        <div className="card p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {player.photoUrl ? (
              <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-full">
                <Image
                  src={player.photoUrl}
                  alt={`صورة ${player.name}`}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
            ) : (
              <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full bg-bg-raised2">
                <svg
                  className="h-14 w-14 text-text-dimmer"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}

            <div className="text-center sm:text-right">
              <h1 className="font-display text-2xl sm:text-3xl font-black text-text">
                {player.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {player.jerseyNumber != null && (
                  <span className="inline-flex h-7 items-center rounded-lg bg-gold px-2 font-num text-sm font-bold text-black">
                    {player.jerseyNumber}
                  </span>
                )}
                <span className="badge-muted">
                  {POSITION_LABELS[player.position] ?? player.position}
                </span>
                {player.team && (
                  <Link
                    href={`/teams/${player.team.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 font-body text-xs text-text-dim transition-colors hover:bg-bg-raised2/50"
                  >
                    {player.team.crestUrl && (
                      <div className="relative h-4 w-4 flex-shrink-0 overflow-hidden rounded">
                        <Image
                          src={player.team.crestUrl}
                          alt={`شعار ${player.team.name}`}
                          fill
                          className="object-contain"
                          sizes="16px"
                        />
                      </div>
                    )}
                    {player.team.name}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-4 text-center">
            <div className="font-num text-2xl font-bold text-gold">{player.goals}</div>
            <div className="font-body text-xs text-text-dim">أهداف</div>
          </div>
          <div className="card p-4 text-center">
            <div className="font-num text-2xl font-bold text-gold">{player.matchesPlayed}</div>
            <div className="font-body text-xs text-text-dim">مباريات</div>
          </div>
          <div className="card p-4 text-center">
            <div className="font-num text-2xl font-bold text-gold">
              {POSITION_LABELS[player.position] ?? player.position}
            </div>
            <div className="font-body text-xs text-text-dim">المركز</div>
          </div>
        </div>

        {/* Player Info */}
        <div className="card p-5 sm:p-6">
          <h2 className="mb-4 section-title text-lg">المعلومات</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {player.dateOfBirth && (
              <div>
                <dt className="font-body text-xs text-text-dimmer">تاريخ الميلاد</dt>
                <dd className="mt-1 font-body text-sm text-text">
                  {new Intl.DateTimeFormat("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }).format(player.dateOfBirth)}
                </dd>
              </div>
            )}
            {player.team && (
              <div>
                <dt className="font-body text-xs text-text-dimmer">الفريق الحالي</dt>
                <dd className="mt-1 font-body text-sm text-text">
                  <Link
                    href={`/teams/${player.team.id}`}
                    className="text-gold hover:text-gold-bright transition-colors"
                  >
                    {player.team.name}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </main>
      <Footer />
    </>
  );
}
