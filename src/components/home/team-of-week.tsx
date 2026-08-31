import { getTeamOfWeek } from "@/lib/data/team-of-week";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ImageDisplay } from "@/components/ui/image-display";
import type { TeamOfWeekPlayerVM, TeamOfWeekPosition } from "@/lib/types";

const GROUPS: { position: TeamOfWeekPosition; label: string }[] = [
  { position: "GK", label: "حارس المرمى" },
  { position: "DEF", label: "خط الدفاع" },
  { position: "MID", label: "خط الوسط" },
  { position: "FW", label: "خط الهجوم" },
];

function PlayerCard({ player }: { player: TeamOfWeekPlayerVM }) {
  return (
    <div className="relative flex w-[150px] flex-col items-center rounded-2xl border border-line bg-surface-elevated p-3 text-center transition-colors hover:border-accent/40">
      {player.jerseyNumber !== null && (
        <span className="absolute left-2 top-2 rounded-md bg-accent px-1.5 py-0.5 font-num text-[11px] font-black leading-none text-[#1d1400]">
          {player.jerseyNumber}
        </span>
      )}

      <ImageDisplay
        src={player.photoUrl}
        alt={player.name}
        type="player"
        size="lg"
        className="mx-auto"
      />

      <p className="mt-2.5 line-clamp-2 min-h-[2.6em] font-display text-[13px] font-black leading-tight text-text">
        {player.name}
      </p>

      <div className="mt-1.5 flex items-center gap-1.5">
        <ImageDisplay
          src={player.team.crestUrl}
          alt={player.team.name}
          type="team-logo"
          size="xs"
          shortCode={player.team.shortName}
        />
        <span className="max-w-[110px] truncate font-body text-[10px] font-bold text-text-dim">
          {player.team.shortName}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5" dir="ltr">
        <span className="flex items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-num text-[11px] font-black text-accent-bright">
          {player.goals}
        </span>
        <span className="flex items-center gap-1 rounded-md border border-cyan/30 bg-cyan/10 px-1.5 py-0.5 font-num text-[11px] font-black text-cyan">
          {player.assists}
        </span>
      </div>
    </div>
  );
}

export async function TeamOfWeek() {
  const result = await getTeamOfWeek();

  return (
    <section className="page-container editorial-section">
      <SectionHeader title="فريق الأسبوع" tag="TEAM OF THE WEEK" />

      {result.status === "error" && <ErrorState message={result.message} />}
      {result.status === "empty" && <EmptyState message="لم يتم اختيار تشكيلة الأسبوع بعد." />}

      {result.status === "success" && (
        <div data-team-of-week className="overflow-hidden rounded-3xl border border-line bg-surface">
          <div className="border-b border-line bg-gradient-to-l from-[#0d1830] via-[#123B6B] to-[#0d1830] px-5 py-4 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-black text-text sm:text-xl">تشكيلة الأسبوع</h3>
                <p className="mt-0.5 font-body text-[11px] font-medium text-text-dimmer">
                  {result.data.tournamentName} — أفضل {result.data.players.length} لاعب هذا الأسبوع
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-body text-[11px] font-bold text-accent-bright">
                XI
              </div>
            </div>
          </div>

          <div className="space-y-8 p-5 sm:p-7">
            {GROUPS.map((group) => {
              const players = result.data.players.filter((p) => p.position === group.position);
              if (players.length === 0) return null;
              return (
                <div key={group.position}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="font-utility text-[10px] tracking-[0.25em] text-accent-bright uppercase">
                      {group.label}
                    </span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                    {players.map((player) => (
                      <PlayerCard key={player.playerId} player={player} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}