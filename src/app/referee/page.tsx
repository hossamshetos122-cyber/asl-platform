import { redirect } from "next/navigation";
import { requireReferee } from "@/lib/auth";
import { getRefereeMatches, getTeamPlayers } from "@/lib/data/referee";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { RefereePortal } from "./referee-portal";

export const dynamic = "force-dynamic";

export default async function RefereePage() {
  let user;
  try {
    user = await requireReferee();
  } catch {
    redirect("/login?redirect=/referee");
  }

  const matches = await getRefereeMatches(user);

  // Roster per team for event entry.
  const teamIds = Array.from(new Set(matches.flatMap((m) => [m.homeTeam.id, m.awayTeam.id])));
  const playersByTeam: Record<string, { id: string; name: string; jerseyNumber: number | null }[]> = {};
  await Promise.all(
    teamIds.map(async (teamId) => {
      playersByTeam[teamId] = await getTeamPlayers(teamId);
    }),
  );

  return (
    <>
      <Navbar />
      <section className="relative overflow-hidden bg-surface border-b border-line">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-elevated/50 to-surface" />
        <div className="page-container relative pt-10 sm:pt-14 pb-8 sm:pb-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-live/10 border border-live/25">
              <svg className="h-7 w-7 text-live" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4.5" />
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-black text-text">بوابة الحكم</h1>
              <p className="mt-1 font-body text-[13px] text-text-dim">{user.fullName}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="page-container page-padding">
        <RefereePortal matches={matches} playersByTeam={playersByTeam} />
      </main>
      <Footer />
    </>
  );
}