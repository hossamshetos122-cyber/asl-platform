import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums / allowed values
// ---------------------------------------------------------------------------

export const UserRole = z.enum([
  "ADMIN",
  "FAN",
  "PLAYER",
  "TEAM_MANAGER",
  "TOURNAMENT_ORGANIZER",
  "REFEREE",
]);

export const MatchStatus = z.enum([
  "SCHEDULED",
  "LIVE",
  "HALFTIME",
  "FINISHED",
  "POSTPONED",
  "CANCELLED",
]);

export const TournamentFormat = z.enum([
  "LEAGUE",
  "KNOCKOUT",
  "GROUPS_KNOCKOUT",
  "CUP",
  "CHAMPIONS_LEAGUE",
]);

export const TournamentStatus = z.enum([
  "UPCOMING",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
]);

export const PlayerPosition = z.enum([
  "GOALKEEPER",
  "DEFENDER",
  "MIDFIELDER",
  "FORWARD",
]);

export const MatchEventType = z.enum([
  "GOAL",
  "OWN_GOAL",
  "ASSIST",
  "YELLOW_CARD",
  "RED_CARD",
  "SUBSTITUTION_IN",
  "SUBSTITUTION_OUT",
  "PENALTY_SCORED",
  "PENALTY_MISSED",
]);

export const SquadStatus = z.enum(["PENDING", "CONFIRMED", "ABSENT"]);

export const MembershipStatus = z.enum(["PENDING", "ACTIVE", "REJECTED", "REMOVED"]);

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "الاسم يجب أن يكون حرفين على الأقل")
      .max(100, "الاسم طويل جداً"),
    email: z.string().trim().email("البريد الإلكتروني غير صالح").max(254),
    password: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .max(128, "كلمة المرور طويلة جداً"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة").max(128),
});

// ---------------------------------------------------------------------------
// CUID validation helper
// ---------------------------------------------------------------------------

const cuidRegex = /^[a-zA-Z0-9_-]{2,50}$/;

export const cuid = z.string().regex(cuidRegex, "معرف غير صالح");

// ---------------------------------------------------------------------------
// Team schemas
// ---------------------------------------------------------------------------

export const createTeamSchema = z.object({
  name: z.string().trim().min(1, "اسم الفريق مطلوب").max(100, "اسم الفريق طويل جداً"),
  shortName: z.string().trim().min(1, "الاسم المختصر مطلوب").max(20, "الاسم المختصر طويل جداً"),
  city: z.string().trim().max(100, "اسم المدينة طويل جداً").default("الإسكندرية"),
  logoUrl: z.string().max(5_000_000, "حجم الصورة يتجاوز الحد الأقصى").nullable().optional(),
});

export const updateTeamSchema = z.object({
  id: cuid,
  name: z.string().trim().min(1, "اسم الفريق مطلوب").max(100, "اسم الفريق طويل جداً"),
  shortName: z.string().trim().min(1, "الاسم المختصر مطلوب").max(20, "الاسم المختصر طويل جداً"),
  city: z.string().trim().max(100, "اسم المدينة طويل جداً").default("الإسكندرية"),
  logoUrl: z.string().max(5_000_000, "حجم الصورة يتجاوز الحد الأقصى").nullable().optional(),
});

// ---------------------------------------------------------------------------
// Player schemas
// ---------------------------------------------------------------------------

export const dateOfBirthField = z
  .string()
  .trim()
  .max(10, "تاريخ الميلاد غير صالح")
  .optional()
  .refine(
    (val) => {
      if (!val || val === "") return true;
      const d = new Date(val + "T00:00:00.000Z");
      return !isNaN(d.getTime());
    },
    "تاريخ الميلاد غير صالح",
  );

export const createPlayerSchema = z.object({
  teamId: cuid,
  fullName: z.string().trim().min(1, "اسم اللاعب مطلوب").max(100, "اسم اللاعب طويل جداً"),
  phone: z.string().trim().max(20, "رقم الهاتف طويل جداً").nullable().optional(),
  photoUrl: z.string().max(5_000_000, "حجم الصورة يتجاوز الحد الأقصى").nullable().optional(),
  jerseyNumber: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const n = parseInt(val, 10);
        return !isNaN(n) && n >= 0 && n <= 99;
      },
      "رقم القميص يجب أن يكون بين 0 و 99",
    ),
  position: PlayerPosition.default("MIDFIELDER"),
  dateOfBirth: dateOfBirthField,
});

export const updatePlayerSchema = z.object({
  id: cuid,
  fullName: z.string().trim().min(1, "اسم اللاعب مطلوب").max(100, "اسم اللاعب طويل جداً"),
  phone: z.string().trim().max(20, "رقم الهاتف طويل جداً").nullable().optional(),
  photoUrl: z.string().max(5_000_000, "حجم الصورة يتجاوز الحد الأقصى").nullable().optional(),
  jerseyNumber: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const n = parseInt(val, 10);
        return !isNaN(n) && n >= 0 && n <= 99;
      },
      "رقم القميص يجب أن يكون بين 0 و 99",
    ),
  position: PlayerPosition.optional(),
  dateOfBirth: dateOfBirthField,
});

// ---------------------------------------------------------------------------
// Tournament schemas
// ---------------------------------------------------------------------------

export const createTournamentSchema = z.object({
  name: z.string().trim().min(1, "اسم البطولة مطلوب").max(200, "اسم البطولة طويل جداً"),
  format: TournamentFormat.default("LEAGUE"),
  status: TournamentStatus.default("UPCOMING"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  logoUrl: z.string().max(5_000_000, "حجم الصورة يتجاوز الحد الأقصى").nullable().optional(),
  coverUrl: z.string().max(5_000_000, "حجم الصورة يتجاوز الحد الأقصى").nullable().optional(),
});

export const updateTournamentSchema = z.object({
  id: cuid,
  name: z.string().trim().min(1, "اسم البطولة مطلوب").max(200, "اسم البطولة طويل جداً"),
  format: TournamentFormat.default("LEAGUE"),
  status: TournamentStatus.default("UPCOMING"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  logoUrl: z.string().max(5_000_000, "حجم الصورة يتجاوز الحد الأقصى").nullable().optional(),
  coverUrl: z.string().max(5_000_000, "حجم الصورة يتجاوز الحد الأقصى").nullable().optional(),
});

// ---------------------------------------------------------------------------
// Match schemas
// ---------------------------------------------------------------------------

export const MAX_SCORE = 50;

export const createMatchSchema = z
  .object({
    tournamentId: cuid,
    homeTeamId: cuid,
    awayTeamId: cuid,
    kickoffAt: z.string().min(1, "موعد المباراة مطلوب"),
    venue: z.string().trim().max(200, "اسم الملعب طويل جداً").nullable().optional(),
    round: z.string().trim().max(50).nullable().optional(),
    status: MatchStatus.default("SCHEDULED"),
  })
  .refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: "يجب أن يكون الفريقان مختلفين",
    path: ["awayTeamId"],
  });

export const updateScoreSchema = z.object({
  matchId: cuid,
  homeScore: z
    .number()
    .int("النتيجة يجب أن تكون عدد صحيح")
    .min(0, "النتيجة لا يمكن أن تكون سالبة")
    .max(MAX_SCORE, `النتيجة لا يمكن أن تتجاوز ${MAX_SCORE}`),
  awayScore: z
    .number()
    .int("النتيجة يجب أن تكون عدد صحيح")
    .min(0, "النتيجة لا يمكن أن تكون سالبة")
    .max(MAX_SCORE, `النتيجة لا يمكن أن تتجاوز ${MAX_SCORE}`),
  status: MatchStatus.default("FINISHED"),
});

export const updateMatchScheduleSchema = z.object({
  matchId: cuid,
  kickoffAt: z.string().min(1, "موعد المباراة مطلوب"),
  venue: z.string().trim().max(200, "اسم الملعب طويل جداً").nullable().optional(),
  status: MatchStatus.optional(),
});

// ---------------------------------------------------------------------------
// Match event schemas
// ---------------------------------------------------------------------------

export const addMatchEventSchema = z.object({
  matchId: cuid,
  playerId: cuid,
  teamId: cuid,
  type: MatchEventType,
  minute: z
    .number()
    .int("الدقيقة يجب أن تكون عدد صحيح")
    .min(0, "الدقيقة لا يمكن أن تكون سالبة")
    .max(120, "الدقيقة لا يمكن أن تتجاوز 120"),
});

// ---------------------------------------------------------------------------
// Squad schemas
// ---------------------------------------------------------------------------

export const MAX_SQUAD_SIZE = 20;
export const MAX_STARTING_XI = 11;

export const setTeamSquadSchema = z.object({
  matchId: cuid,
  teamId: cuid,
  playerIds: z
    .array(cuid)
    .min(1, "يجب اختيار لاعب واحد على الأقل")
    .max(MAX_SQUAD_SIZE, `لا يمكن أن يتجاوز عدد اللاعبين ${MAX_SQUAD_SIZE}`),
});

export const setTeamLineupSchema = z.object({
  squadId: cuid,
  starterIds: z
    .array(cuid)
    .max(MAX_STARTING_XI, `لا يمكن أن يتجاوز عدد لاعبي الأساس ${MAX_STARTING_XI}`),
});

export const confirmSquadSchema = z.object({
  squadId: cuid,
  status: SquadStatus,
});
