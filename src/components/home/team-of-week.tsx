import { getTeamOfTheWeek } from "@/lib/data/team-of-week";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TOTWCard } from "@/components/ui/totw-card";
import type { TeamOfTheWeekSlotVM } from "@/lib/types";

function datesLabel(weekStart: Date | null, weekEnd: Date | null): string | null {
  if (!weekStart || !weekEnd) return null;
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  return `من ${fmt(weekStart)} إلى ${fmt(weekEnd)}`;
}

export async function TeamOfWeek() {
  const result = await getTeamOfTheWeek();

  return (
    <section className="page-container editorial-section">
      <SectionHeader title="فريق الأسبوع" tag="TEAM OF THE WEEK" />

      {result.status === "error" && <ErrorState message={result.message} />}
      {result.status === "empty" && <EmptyState message="لم يتم اختيار فريق الأسبوع بعد." />}

      {result.status === "success" && (
        <div data-team-of-week className="overflow-hidden rounded-3xl border border-line bg-surface">
          <div className="border-b border-line bg-gradient-to-l from-[#0d1830] via-[#123B6B] to-[#0d1830] px-5 py-4 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-black text-text sm:text-xl">{result.data.weekLabel}</h3>
                <p className="mt-0.5 font-body text-[11px] font-medium text-text-dimmer">
                  {result.data.tournamentName}
                  {datesLabel(result.data.weekStart, result.data.weekEnd)
                    ? ` — ${datesLabel(result.data.weekStart, result.data.weekEnd)}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-utility text-[11px] font-black tracking-wider text-accent-bright uppercase">
                {result.data.formation}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#123a29] via-[#0c2b1f] to-[#081f16] p-5 sm:p-7">
            <div className="pointer-events-none relative">
              <div className="absolute inset-x-[8%] top-1/2 hidden h-24 w-24 -translate-y-1/2 rounded-full border border-white/10 sm:block" />
              <div className="absolute inset-x-[5%] top-0 bottom-0 hidden border-y border-white/10 sm:block" />

              <div className="relative space-y-5 sm:space-y-6">
                {[...result.data.slots]
                  .reduce<{ band: number; slots: TeamOfTheWeekSlotVM[] }[]>((bands, slot) => {
                    const existing = bands.find((b) => b.band === slot.band);
                    if (existing) existing.slots.push(slot);
                    else bands.push({ band: slot.band, slots: [slot] });
                    return bands;
                  }, [])
                  .sort((a, b) => b.band - a.band)
                  .map((band) => (
                    <div key={band.band} className="flex flex-wrap items-start justify-center gap-2 sm:gap-3">
                      {band.slots.map((slot) => (
                        <div key={slot.positionSlot} className="flex w-[104px] flex-col items-center sm:w-[112px]">
                          <TOTWCard
                            name={slot.player.name}
                            photoUrl={slot.player.photoUrl}
                            jerseyNumber={slot.player.jerseyNumber}
                            rating={slot.player.rating}
                            crestUrl={slot.player.team.crestUrl}
                            shortName={slot.player.team.shortName}
                            teamName={slot.player.team.name}
                            captain={slot.captain}
                          />
                          <p className="mt-1.5 font-utility text-[8px] tracking-[0.15em] text-white/40 uppercase">
                            {slot.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}