"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearTeamOfWeekPlayers, setTeamOfWeekPlayers } from "@/lib/actions/team-of-week";
import { LINEUP_SIZE } from "@/lib/team-of-week";

const POSITIONS = [
  { value: "GK", label: "حارس" },
  { value: "DEF", label: "مدافع" },
  { value: "MID", label: "وسط" },
  { value: "FW", label: "مهاجم" },
] as const;

const DEFAULT_POSITIONS = ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "FW", "FW"];

interface TournamentOption {
  id: string;
  name: string;
  status: string;
}

interface PlayerOption {
  id: string;
  fullName: string;
  jerseyNumber: number | null;
}

interface TeamCandidates {
  teamId: string;
  teamName: string;
  shortName: string;
  crestUrl: string | null;
  players: PlayerOption[];
}

interface LineupSlot {
  tournamentId: string;
  playerId: string;
  position: string;
  sortOrder: number;
}

interface TeamOfWeekFormProps {
  tournaments: TournamentOption[];
  candidatesByTournament: { tournamentId: string; teams: TeamCandidates[] }[];
  featuredTournamentId: string | null;
  currentLineup: LineupSlot[];
}

function defaultSlotsFor(lineup: LineupSlot[], tournamentId: string): { positions: string[]; players: string[] } {
  const positions = [...DEFAULT_POSITIONS];
  const players = new Array<string>(LINEUP_SIZE).fill("");
  const scoped = lineup
    .filter((s) => s.tournamentId === tournamentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  for (const slot of scoped) {
    const index = slot.sortOrder - 1;
    if (index < 0 || index >= LINEUP_SIZE) continue;
    players[index] = slot.playerId;
    positions[index] = slot.position;
  }
  return { positions, players };
}

export function TeamOfWeekForm({
  tournaments,
  candidatesByTournament,
  featuredTournamentId,
  currentLineup,
}: TeamOfWeekFormProps) {
  const router = useRouter();

  const initialTournamentId =
    currentLineup[0]?.tournamentId ?? featuredTournamentId ?? tournaments[0]?.id ?? "";
  const initialSlots = useMemo(
    () => defaultSlotsFor(currentLineup, initialTournamentId),
    [currentLineup, initialTournamentId]
  );

  const [activeTournamentId, setActiveTournamentId] = useState(initialTournamentId);
  const [positions, setPositions] = useState<string[]>(initialSlots.positions);
  const [players, setPlayers] = useState<string[]>(initialSlots.players);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasLineupForActive = currentLineup.some((s) => s.tournamentId === activeTournamentId);

  const candidates = useMemo(() => {
    const group = candidatesByTournament.find((t) => t.tournamentId === activeTournamentId);
    return group?.teams ?? [];
  }, [candidatesByTournament, activeTournamentId]);

  const allPlayers = useMemo(
    () => candidates.flatMap((team) => team.players),
    [candidates]
  );

  const selectedNames = useMemo(() => {
    const map = new Map(allPlayers.map((p) => [p.id, p]));
    return players.map((id) => map.get(id)?.fullName ?? null);
  }, [allPlayers, players]);

  function handleTournamentChange(id: string) {
    setActiveTournamentId(id);
    const next = defaultSlotsFor(currentLineup, id);
    setPositions(next.positions);
    setPlayers(next.players);
    setError(null);
  }

  function handleSave() {
    setError(null);
    const emptySlot = players.findIndex((id) => !id);
    if (emptySlot !== -1) {
      setError(`الخانة رقم ${emptySlot + 1} بدون لاعب — اختر لاعبًا لكل خانة.`);
      return;
    }
    const seen = new Set(players);
    if (seen.size !== LINEUP_SIZE) {
      setError("لا يجوز اختيار نفس اللاعب أكثر من مرة.");
      return;
    }

    startTransition(async () => {
      const res = await setTeamOfWeekPlayers({
        tournamentId: activeTournamentId,
        players: players.map((playerId, index) => ({
          playerId,
          position: positions[index] ?? "MID",
        })),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error || "حدث خطأ");
      }
    });
  }

  function handleClear() {
    if (!activeTournamentId) return;
    setError(null);
    startTransition(async () => {
      const res = await clearTeamOfWeekPlayers(activeTournamentId);
      if (res.ok) {
        setPlayers(new Array<string>(LINEUP_SIZE).fill(""));
        setPositions(DEFAULT_POSITIONS);
        router.refresh();
      } else {
        setError(res.error || "حدث خطأ");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-sm font-black text-text">تشكيلة الأسبوع</h2>
          <p className="mt-1 font-body text-[11px] text-text-dimmer">
            اختر أفضل {LINEUP_SIZE} لاعب من أندية البطولة — مع تحديد مركز كل لاعب. يظهرون في الرئيسية بالمراكز.
          </p>
        </div>

        <div className="space-y-4 p-5">
          {error && (
            <div className="rounded-lg border border-live/30 bg-live/10 px-4 py-2 font-body text-[12px] text-live">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">البطولة</label>
            <select
              value={activeTournamentId}
              onChange={(e) => handleTournamentChange(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent sm:w-96"
            >
              {tournaments.length === 0 && <option value="">لا توجد بطولات</option>}
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.status === "ONGOING" ? "— جارية" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[620px] text-right">
              <thead>
                <tr className="border-b border-line bg-surface-elevated/50">
                  <th className="px-3 py-2.5 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">#</th>
                  <th className="px-3 py-2.5 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">المركز</th>
                  <th className="px-3 py-2.5 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اللاعب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {Array.from({ length: LINEUP_SIZE }).map((_, index) => (
                  <tr key={index} className="transition-colors hover:bg-surface-elevated/50">
                    <td className="px-3 py-2 font-num text-sm font-black text-text-dim">{index + 1}</td>
                    <td className="px-3 py-2">
                      <select
                        value={positions[index] ?? "MID"}
                        onChange={(e) => {
                          const next = [...positions];
                          next[index] = e.target.value;
                          setPositions(next);
                        }}
                        className="w-24 rounded-lg border border-line bg-bg px-2 py-1.5 font-body text-[12px] text-text outline-none transition-colors focus:border-accent"
                      >
                        {POSITIONS.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={players[index] ?? ""}
                        onChange={(e) => {
                          const next = [...players];
                          next[index] = e.target.value;
                          setPlayers(next);
                        }}
                        className="w-full rounded-lg border border-line bg-bg px-2 py-1.5 font-body text-[12px] text-text outline-none transition-colors focus:border-accent"
                      >
                        <option value="">اختر اللاعب...</option>
                        {candidates.map((team) => (
                          <optgroup key={team.teamId} label={team.teamName}>
                            {team.players.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.jerseyNumber ? `${p.jerseyNumber} — ` : ""}{p.fullName}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleSave} disabled={isPending} className="btn-primary">
              {isPending ? "جارٍ الحفظ..." : "حفظ تشكيلة الأسبوع"}
            </button>
            {hasLineupForActive && (
              <button
                onClick={handleClear}
                disabled={isPending}
                className="rounded-lg border border-live/30 px-4 py-2 font-body text-[12px] font-bold text-live transition-colors hover:bg-live/10"
              >
                إزالة التشكيلة
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-3 font-display text-sm font-black text-text">التشكيلة الحالية</h2>
        {hasLineupForActive && selectedNames.some((n) => n !== null) ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {selectedNames.map((name, index) =>
              name ? (
                <div key={index} className="flex items-center gap-2.5 rounded-lg border border-accent/20 bg-bg px-3 py-2">
                  <span className="font-num text-[12px] font-black text-accent-bright">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate font-body text-[12px] font-bold text-text">{name}</p>
                    <p className="font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">
                      {POSITIONS.find((p) => p.value === positions[index])?.label}
                    </p>
                  </div>
                </div>
              ) : null
            )}
          </div>
        ) : (
          <p className="font-body text-sm text-text-dim">لا توجد تشكيلة محفوظة لهذه البطولة بعد.</p>
        )}
      </div>
    </div>
  );
}