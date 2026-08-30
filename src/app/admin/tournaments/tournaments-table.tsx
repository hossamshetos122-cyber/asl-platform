"use client";

import { useState, useTransition, Fragment } from "react";
import { useFormStatus } from "react-dom";
import {
  createTournament,
  updateTournament,
  deleteTournament,
  addTeamToTournament,
  removeTeamFromTournament,
} from "@/lib/actions/tournaments";
import { ImageDisplay } from "@/components/ui/image-display";
import { ImageUpload } from "@/components/ui/image-upload";
import { formatLongDate } from "@/lib/dates";

interface TournamentTeamEntry {
  id: string;
  name: string;
  shortName: string;
}

interface TournamentRow {
  id: string;
  name: string;
  format: string;
  status: string;
  startDate: string;
  logoUrl: string | null;
  coverUrl: string | null;
  _count: { teams: number };
  teams: TournamentTeamEntry[];
}

interface TeamOption {
  id: string;
  name: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "جارِ الحفظ..." : "حفظ"}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} onClick={(e) => { if (!confirm("هل أنت متأكد من حذف البطولة؟")) e.preventDefault(); }} className="btn-danger-outline">
      {pending ? "..." : "حذف"}
    </button>
  );
}

const FORMAT_OPTIONS = [
  { value: "LEAGUE", label: "دوري" },
  { value: "KNOCKOUT", label: "إقصائي" },
  { value: "GROUPS_KNOCKOUT", label: "مجموعات + إقصائي" },
] as const;

const STATUS_OPTIONS = [
  { value: "UPCOMING", label: "قادمة" },
  { value: "ONGOING", label: "جارية" },
  { value: "COMPLETED", label: "منتهية" },
  { value: "CANCELLED", label: "ملغاة" },
] as const;

const STATUS_LABELS: Record<string, string> = { UPCOMING: "قادمة", ONGOING: "جارية", COMPLETED: "منتهية", CANCELLED: "ملغاة" };
const FORMAT_LABELS: Record<string, string> = { LEAGUE: "دوري", KNOCKOUT: "إقصائي", GROUPS_KNOCKOUT: "مجموعات + إقصائي", CUP: "كأس", CHAMPIONS_LEAGUE: "دوري الأبطال" };

function InlineCreateForm() {
  const [isAdding, setIsAdding] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isAdding) {
    return (
      <button onClick={() => setIsAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-5 py-2.5 font-body text-[12px] font-bold text-accent transition-all hover:bg-accent/20">
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
        إضافة بطولة
      </button>
    );
  }

  return (
    <form action={async (formData) => {
      setError(null);
      try {
        if (logoUrl) formData.set("logoUrl", logoUrl);
        if (coverUrl) formData.set("coverUrl", coverUrl);
        await createTournament(formData);
        setIsAdding(false);
        setLogoUrl(null);
        setCoverUrl(null);
        window.location.reload();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "حدث خطأ");
      }
    }} className="rounded-xl border border-accent/20 bg-surface p-5">
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
<ImageUpload name="logoUrl" purpose="tournament-logo" label="شعار البطولة" value={logoUrl} onChange={setLogoUrl} />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اسم البطولة</label>
          <input name="name" required className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent" placeholder="دوري الإسكندرية" />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الصيغة</label>
          <select name="format" className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent">
            {FORMAT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الحالة</label>
          <select name="status" className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent">
            {STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">تاريخ البدء</label>
          <input type="date" name="startDate" required className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent" />
        </div>
      </div>
      <div className="mb-4"><ImageUpload name="coverUrl" purpose="tournament-cover" label="صورة الغلاف" value={coverUrl} onChange={setCoverUrl} /></div>
      {error && <div className="mb-4 rounded-lg border border-live/30 bg-live/10 px-4 py-2 font-body text-[12px] text-live">{error}</div>}
      <div className="flex items-center gap-3">
        <SubmitButton />
        <button type="button" onClick={() => { setIsAdding(false); setLogoUrl(null); setCoverUrl(null); setError(null); }} className="rounded-lg border border-line px-4 py-2 font-body text-[12px] font-bold text-text-dim transition-colors hover:text-text">إلغاء</button>
      </div>
    </form>
  );
}

function EditRow({ tournament, onClose }: { tournament: TournamentRow; onClose: () => void }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(tournament.logoUrl);
  const [coverUrl, setCoverUrl] = useState<string | null>(tournament.coverUrl);
  const [error, setError] = useState<string | null>(null);

  return (
    <tr>
      <td colSpan={6} className="px-4 py-3">
        <form action={async (formData) => {
          setError(null);
          try {
            if (logoUrl !== undefined) formData.set("logoUrl", logoUrl || "");
            if (coverUrl !== undefined) formData.set("coverUrl", coverUrl || "");
            await updateTournament(formData);
            onClose();
          } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "حدث خطأ");
          }
        }} className="rounded-xl border border-accent/20 bg-surface p-4">
          <input type="hidden" name="id" value={tournament.id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2"><ImageUpload name="logoUrl" purpose="tournament-logo" label="شعار البطولة" value={logoUrl} onChange={setLogoUrl} /></div>
            <div>
              <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اسم البطولة</label>
              <input name="name" defaultValue={tournament.name} required className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none focus:border-accent" />
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الصيغة</label>
              <select name="format" defaultValue={tournament.format} className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none focus:border-accent">
                {FORMAT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الحالة</label>
              <select name="status" defaultValue={tournament.status} className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none focus:border-accent">
                {STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">تاريخ البدء</label>
              <input type="date" name="startDate" defaultValue={new Date(tournament.startDate).toISOString().split("T")[0]} required className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none focus:border-accent" />
            </div>
          </div>
          <div className="my-4"><ImageUpload name="coverUrl" purpose="tournament-cover" label="صورة الغلاف" value={coverUrl} onChange={setCoverUrl} /></div>
          {error && <div className="mb-4 rounded-lg border border-live/30 bg-live/10 px-4 py-2 font-body text-[12px] text-live">{error}</div>}
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary">تحديث</button>
            <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2 font-body text-[12px] font-bold text-text-dim transition-colors hover:text-text">إلغاء</button>
          </div>
        </form>
      </td>
    </tr>
  );
}

function TeamManager({ tournament, allTeams }: { tournament: TournamentRow; allTeams: TeamOption[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const registeredIds = new Set(tournament.teams.map((t) => t.id));
  const availableTeams = allTeams.filter((t) => !registeredIds.has(t.id));

  function handleAdd() {
    if (!selectedTeamId) return;
    setError(null);
    startTransition(async () => {
      try {
        await addTeamToTournament(tournament.id, selectedTeamId);
        setSelectedTeamId("");
        window.location.reload();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "خطأ غير معروف");
      }
    });
  }

  function handleRemove(teamId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await removeTeamFromTournament(tournament.id, teamId);
        window.location.reload();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "خطأ غير معروف");
      }
    });
  }

  return (
    <div className="border-t border-line/50 bg-surface-elevated/30 px-4 py-3">
      <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 font-body text-xs font-bold text-accent transition-colors hover:text-accent-bright">
        <svg className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 2l4 4-4 4" />
        </svg>
        إدارة الفرق ({tournament._count.teams})
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {tournament.teams.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tournament.teams.map((team) => (
                <span key={team.id} className="inline-flex items-center gap-1.5 rounded-lg border border-accent/20 bg-accent/[0.04] px-2.5 py-1">
                  <span className="font-body text-xs font-bold text-text">{team.name}</span>
                  <button onClick={() => handleRemove(team.id)} disabled={isPending} className="flex h-4 w-4 items-center justify-center rounded-full text-text-dimmer transition-colors hover:bg-live/20 hover:text-live">
                    <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l6 6M9 3l-6 6" /></svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {availableTeams.length > 0 ? (
            <div className="flex items-center gap-2">
              <select value={selectedTeamId} onChange={(e) => { setSelectedTeamId(e.target.value); setError(null); }} className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 font-body text-xs text-text outline-none transition-colors focus:border-accent">
                <option value="">اختر فريقاً للإضافة</option>
                {availableTeams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
              <button onClick={handleAdd} disabled={!selectedTeamId || isPending} className="btn-primary text-[11px] px-3 py-1.5">
                {isPending ? "..." : "إضافة"}
              </button>
            </div>
          ) : (
            <p className="font-body text-[11px] text-text-dim">جميع الفرق مسجّلة في هذه البطولة.</p>
          )}

          {error && <p className="rounded-lg border border-live/30 bg-live/10 px-3 py-2 text-center font-body text-xs text-live">{error}</p>}
        </div>
      )}
    </div>
  );
}

function TournamentDeleteRow({ tournamentId }: { tournamentId: string }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <form action={async (formData) => {
        try {
          await deleteTournament(formData);
          window.location.reload();
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "حدث خطأ");
        }
      }} className="inline">
        <input type="hidden" name="id" value={tournamentId} />
        <DeleteButton />
      </form>
      {error && <p className="mt-1 font-body text-[10px] text-live">{error}</p>}
    </div>
  );
}

export default function TournamentsTable({ tournaments, allTeams = [] }: { tournaments: TournamentRow[]; allTeams?: TeamOption[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <>
      <InlineCreateForm />
      {tournaments.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
          <p className="font-body text-sm text-text-dim">لا توجد بطولات بعد. أضف بطولة للبدء.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-line bg-surface-elevated/50">
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الاسم</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الصيغة</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الحالة</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الفرق</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">تاريخ البدء</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {tournaments.map((tournament) =>
                editingId === tournament.id ? (
                  <EditRow key={tournament.id} tournament={tournament} onClose={() => setEditingId(null)} />
                ) : (
                  <Fragment key={tournament.id}>
                    <tr key={tournament.id} className="transition-colors hover:bg-surface-elevated/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ImageDisplay src={tournament.logoUrl} alt={`شعار ${tournament.name}`} type="tournament" size="sm" />
                          <span className="font-body text-sm font-bold text-text">{tournament.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-text-dim">{FORMAT_LABELS[tournament.format] ?? tournament.format}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-0.5 font-utility text-[10px] tracking-wider ${tournament.status === "ONGOING" ? "badge-accent" : tournament.status === "COMPLETED" ? "badge-success" : tournament.status === "CANCELLED" ? "badge-live" : "badge-muted"}`}>
                          {STATUS_LABELS[tournament.status] ?? tournament.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-num text-sm font-bold text-text">{tournament._count.teams}</td>
                      <td className="px-4 py-3 font-body text-sm text-text-dim">{formatLongDate(new Date(tournament.startDate))}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingId(tournament.id)} className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 font-body text-[11px] font-bold text-accent transition-colors hover:bg-accent/20">تعديل</button>
                          <TournamentDeleteRow tournamentId={tournament.id} />
                        </div>
                      </td>
                    </tr>
                    <tr key={`${tournament.id}-teams`}>
                      <td colSpan={6}>
                        <TeamManager tournament={tournament} allTeams={allTeams} />
                      </td>
                    </tr>
                  </Fragment>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
