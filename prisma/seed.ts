import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function makeHash(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { cost: 16384 }, (err, buf) => {
      if (err) reject(err);
      else resolve(buf);
    });
  });
  return `${salt}:${derived.toString("hex")}`;
}

const SEED_PASSWORD = "admin123";

function avatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a2e&color=d4a843&size=200&bold=true`;
}

function crest(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d4a843&color=1a1a2e&size=400&bold=true&font-size=0.4`;
}

// ---------------------------------------------------------------------------
// Teams — 10 Alexandria amateur teams
// ---------------------------------------------------------------------------

interface TeamSeed {
  id: string;
  name: string;
  shortName: string;
}

const TEAM_SEEDS: TeamSeed[] = [
  { id: "team-karnak",    name: "الكرنك",          shortName: "الك" },
  { id: "team-manshiya",  name: "المنشية",          shortName: "من" },
  { id: "team-abrag",     name: "أبراج النخاطر",   shortName: "أب" },
  { id: "team-montazah",  name: "المنتزه",          shortName: "مت" },
  { id: "team-sidibishr", name: "سيدي بشر",        shortName: "سب" },
  { id: "team-agamy",     name: "العجمي",           shortName: "عج" },
  { id: "team-borg",      name: "برج العرب",        shortName: "بع" },
  { id: "team-smouha",    name: "سموحة",            shortName: "سم" },
  { id: "team-rashtin",   name: "رشتين",            shortName: "رش" },
  { id: "team-lem3a",     name: "الlemma",           shortName: "لم" },
];

// ---------------------------------------------------------------------------
// Players — 18-20 per team with realistic squads
// ---------------------------------------------------------------------------

interface PlayerSeed {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  teamId: string;
  position: string;
  jerseyNumber: number;
}

const PLAYER_SEEDS: PlayerSeed[] = [
  // === Karnak (18 players) ===
  { id: "p-k-01",  userId: "u-k-01",  fullName: "محمد صلاح",        email: "p.k01@seed.local", teamId: "team-karnak", position: "FORWARD",    jerseyNumber: 7 },
  { id: "p-k-02",  userId: "u-k-02",  fullName: "أحمد حسن",         email: "p.k02@seed.local", teamId: "team-karnak", position: "DEFENDER",   jerseyNumber: 3 },
  { id: "p-k-03",  userId: "u-k-03",  fullName: "سعيد عبد الله",    email: "p.k03@seed.local", teamId: "team-karnak", position: "MIDFIELDER", jerseyNumber: 10 },
  { id: "p-k-04",  userId: "u-k-04",  fullName: "يوسف إبراهيم",    email: "p.k04@seed.local", teamId: "team-karnak", position: "FORWARD",    jerseyNumber: 9 },
  { id: "p-k-05",  userId: "u-k-05",  fullName: "خالد أحمد",        email: "p.k05@seed.local", teamId: "team-karnak", position: "MIDFIELDER", jerseyNumber: 8 },
  { id: "p-k-06",  userId: "u-k-06",  fullName: "عبد الرحمن طارق", email: "p.k06@seed.local", teamId: "team-karnak", position: "DEFENDER",   jerseyNumber: 4 },
  { id: "p-k-07",  userId: "u-k-07",  fullName: "حسن مصطفى",       email: "p.k07@seed.local", teamId: "team-karnak", position: "GOALKEEPER", jerseyNumber: 1 },
  { id: "p-k-08",  userId: "u-k-08",  fullName: "عمر سعيد",        email: "p.k08@seed.local", teamId: "team-karnak", position: "MIDFIELDER", jerseyNumber: 14 },
  { id: "p-k-09",  userId: "u-k-09",  fullName: "سامي حسين",       email: "p.k09@seed.local", teamId: "team-karnak", position: "DEFENDER",   jerseyNumber: 5 },
  { id: "p-k-10",  userId: "u-k-10",  fullName: "ماجد علي",        email: "p.k10@seed.local", teamId: "team-karnak", position: "FORWARD",    jerseyNumber: 11 },
  { id: "p-k-11",  userId: "u-k-11",  fullName: "طارق محمد",       email: "p.k11@seed.local", teamId: "team-karnak", position: "DEFENDER",   jerseyNumber: 2 },
  { id: "p-k-12",  userId: "u-k-12",  fullName: "ياسر أحمد",       email: "p.k12@seed.local", teamId: "team-karnak", position: "MIDFIELDER", jerseyNumber: 6 },
  { id: "p-k-13",  userId: "u-k-13",  fullName: "نبيل خالد",       email: "p.k13@seed.local", teamId: "team-karnak", position: "FORWARD",    jerseyNumber: 17 },
  { id: "p-k-14",  userId: "u-k-14",  fullName: "هاني عبد العزيز", email: "p.k14@seed.local", teamId: "team-karnak", position: "MIDFIELDER", jerseyNumber: 15 },
  { id: "p-k-15",  userId: "u-k-15",  fullName: "رامي جمال",       email: "p.k15@seed.local", teamId: "team-karnak", position: "DEFENDER",   jerseyNumber: 13 },
  { id: "p-k-16",  userId: "u-k-16",  fullName: "finaly عادل",     email: "p.k16@seed.local", teamId: "team-karnak", position: "GOALKEEPER", jerseyNumber: 22 },
  { id: "p-k-17",  userId: "u-k-17",  fullName: "كريم وليد",       email: "p.k17@seed.local", teamId: "team-karnak", position: "FORWARD",    jerseyNumber: 20 },
  { id: "p-k-18",  userId: "u-k-18",  fullName: "أسامة فتحي",     email: "p.k18@seed.local", teamId: "team-karnak", position: "MIDFIELDER", jerseyNumber: 16 },

  // === Manshiya (18 players) ===
  { id: "p-m-01",  userId: "u-m-01",  fullName: "أحمد سمير",       email: "p.m01@seed.local", teamId: "team-manshiya", position: "FORWARD",    jerseyNumber: 9 },
  { id: "p-m-02",  userId: "u-m-02",  fullName: "خالد باكر",       email: "p.m02@seed.local", teamId: "team-manshiya", position: "MIDFIELDER", jerseyNumber: 6 },
  { id: "p-m-03",  userId: "u-m-03",  fullName: "محمد عادل",       email: "p.m03@seed.local", teamId: "team-manshiya", position: "DEFENDER",   jerseyNumber: 4 },
  { id: "p-m-04",  userId: "u-m-04",  fullName: "حسن يوسف",       email: "p.m04@seed.local", teamId: "team-manshiya", position: "FORWARD",    jerseyNumber: 11 },
  { id: "p-m-05",  userId: "u-m-05",  fullName: "عمر ناصر",        email: "p.m05@seed.local", teamId: "team-manshiya", position: "MIDFIELDER", jerseyNumber: 8 },
  { id: "p-m-06",  userId: "u-m-06",  fullName: "ياسر أحمد",       email: "p.m06@seed.local", teamId: "team-manshiya", position: "DEFENDER",   jerseyNumber: 3 },
  { id: "p-m-07",  userId: "u-m-07",  fullName: "مصطفى رضا",      email: "p.m07@seed.local", teamId: "team-manshiya", position: "GOALKEEPER", jerseyNumber: 1 },
  { id: "p-m-08",  userId: "u-m-08",  fullName: "أسامة حسين",     email: "p.m08@seed.local", teamId: "team-manshiya", position: "MIDFIELDER", jerseyNumber: 14 },
  { id: "p-m-09",  userId: "u-m-09",  fullName: "تامر عبد الله",  email: "p.m09@seed.local", teamId: "team-manshiya", position: "DEFENDER",   jerseyNumber: 5 },
  { id: "p-m-10",  userId: "u-m-10",  fullName: "رامي جمال",       email: "p.m10@seed.local", teamId: "team-manshiya", position: "FORWARD",    jerseyNumber: 17 },
  { id: "p-m-11",  userId: "u-m-11",  fullName: "سامي طارق",      email: "p.m11@seed.local", teamId: "team-manshiya", position: "MIDFIELDER", jerseyNumber: 10 },
  { id: "p-m-12",  userId: "u-m-12",  fullName: "هاني إبراهيم",   email: "p.m12@seed.local", teamId: "team-manshiya", position: "DEFENDER",   jerseyNumber: 2 },
  { id: "p-m-13",  userId: "u-m-13",  fullName: "نبيل سعيد",      email: "p.m13@seed.local", teamId: "team-manshiya", position: "FORWARD",    jerseyNumber: 19 },
  { id: "p-m-14",  userId: "u-m-14",  fullName: "كريم أحمد",       email: "p.m14@seed.local", teamId: "team-manshiya", position: "MIDFIELDER", jerseyNumber: 20 },
  { id: "p-m-15",  userId: "u-m-15",  fullName: "عبد الله محمد",   email: "p.m15@seed.local", teamId: "team-manshiya", position: "DEFENDER",   jerseyNumber: 15 },
  { id: "p-m-16",  userId: "u-m-16",  fullName: "finaly عمر",      email: "p.m16@seed.local", teamId: "team-manshiya", position: "GOALKEEPER", jerseyNumber: 22 },
  { id: "p-m-17",  userId: "u-m-17",  fullName: "ماجد حسين",      email: "p.m17@seed.local", teamId: "team-manshiya", position: "FORWARD",    jerseyNumber: 18 },
  { id: "p-m-18",  userId: "u-m-18",  fullName: "أحمد وليد",      email: "p.m18@seed.local", teamId: "team-manshiya", position: "MIDFIELDER", jerseyNumber: 13 },

  // === Abrag (18 players) ===
  { id: "p-a-01",  userId: "u-a-01",  fullName: "كريم محمد",       email: "p.a01@seed.local", teamId: "team-abrag", position: "MIDFIELDER", jerseyNumber: 11 },
  { id: "p-a-02",  userId: "u-a-02",  fullName: "يوسف إبراهيم",   email: "p.a02@seed.local", teamId: "team-abrag", position: "FORWARD",    jerseyNumber: 8 },
  { id: "p-a-03",  userId: "u-a-03",  fullName: "محمد حسين",       email: "p.a03@seed.local", teamId: "team-abrag", position: "DEFENDER",   jerseyNumber: 4 },
  { id: "p-a-04",  userId: "u-a-04",  fullName: "أحمد طارق",      email: "p.a04@seed.local", teamId: "team-abrag", position: "FORWARD",    jerseyNumber: 9 },
  { id: "p-a-05",  userId: "u-a-05",  fullName: "خالد عادل",      email: "p.a05@seed.local", teamId: "team-abrag", position: "MIDFIELDER", jerseyNumber: 7 },
  { id: "p-a-06",  userId: "u-a-06",  fullName: "حسن أحمد",       email: "p.a06@seed.local", teamId: "team-abrag", position: "DEFENDER",   jerseyNumber: 3 },
  { id: "p-a-07",  userId: "u-a-07",  fullName: "finaly محمد",    email: "p.a07@seed.local", teamId: "team-abrag", position: "GOALKEEPER", jerseyNumber: 1 },
  { id: "p-a-08",  userId: "u-a-08",  fullName: "عمر سامي",       email: "p.a08@seed.local", teamId: "team-abrag", position: "MIDFIELDER", jerseyNumber: 14 },
  { id: "p-a-09",  userId: "u-a-09",  fullName: "ياسر خالد",      email: "p.a09@seed.local", teamId: "team-abrag", position: "DEFENDER",   jerseyNumber: 5 },
  { id: "p-a-10",  userId: "u-a-10",  fullName: "سامي أحمد",      email: "p.a10@seed.local", teamId: "team-abrag", position: "FORWARD",    jerseyNumber: 17 },
  { id: "p-a-11",  userId: "u-a-11",  fullName: "طارق ناصر",      email: "p.a11@seed.local", teamId: "team-abrag", position: "MIDFIELDER", jerseyNumber: 10 },
  { id: "p-a-12",  userId: "u-a-12",  fullName: "هاني حسين",      email: "p.a12@seed.local", teamId: "team-abrag", position: "DEFENDER",   jerseyNumber: 2 },
  { id: "p-a-13",  userId: "u-a-13",  fullName: "رامي طارق",      email: "p.a13@seed.local", teamId: "team-abrag", position: "FORWARD",    jerseyNumber: 19 },
  { id: "p-a-14",  userId: "u-a-14",  fullName: "نبيل عبد الله",  email: "p.a14@seed.local", teamId: "team-abrag", position: "MIDFIELDER", jerseyNumber: 15 },
  { id: "p-a-15",  userId: "u-a-15",  fullName: "أسامة أحمد",     email: "p.a15@seed.local", teamId: "team-abrag", position: "DEFENDER",   jerseyNumber: 20 },
  { id: "p-a-16",  userId: "u-a-16",  fullName: "finaly عمر",     email: "p.a16@seed.local", teamId: "team-abrag", position: "GOALKEEPER", jerseyNumber: 22 },
  { id: "p-a-17",  userId: "u-a-17",  fullName: "ماجد وليد",     email: "p.a17@seed.local", teamId: "team-abrag", position: "FORWARD",    jerseyNumber: 18 },
  { id: "p-a-18",  userId: "u-a-18",  fullName: "كريم ناصر",     email: "p.a18@seed.local", teamId: "team-abrag", position: "MIDFIELDER", jerseyNumber: 6 },

  // === Montazah (18 players) ===
  { id: "p-mt-01", userId: "u-mt-01", fullName: "حسن علي",        email: "p.mt01@seed.local", teamId: "team-montazah", position: "MIDFIELDER", jerseyNumber: 8 },
  { id: "p-mt-02", userId: "u-mt-02", fullName: "طارق منصور",     email: "p.mt02@seed.local", teamId: "team-montazah", position: "DEFENDER",   jerseyNumber: 4 },
  { id: "p-mt-03", userId: "u-mt-03", fullName: "محمد عادل",      email: "p.mt03@seed.local", teamId: "team-montazah", position: "FORWARD",    jerseyNumber: 9 },
  { id: "p-mt-04", userId: "u-mt-04", fullName: "أحمد سامي",     email: "p.mt04@seed.local", teamId: "team-montazah", position: "MIDFIELDER", jerseyNumber: 10 },
  { id: "p-mt-05", userId: "u-mt-05", fullName: "خالد حسين",     email: "p.mt05@seed.local", teamId: "team-montazah", position: "DEFENDER",   jerseyNumber: 3 },
  { id: "p-mt-06", userId: "u-mt-06", fullName: "عمر يوسف",      email: "p.mt06@seed.local", teamId: "team-montazah", position: "FORWARD",    jerseyNumber: 11 },
  { id: "p-mt-07", userId: "u-mt-07", fullName: "finaly طارق",   email: "p.mt07@seed.local", teamId: "team-montazah", position: "GOALKEEPER", jerseyNumber: 1 },
  { id: "p-mt-08", userId: "u-mt-08", fullName: "ياسر أحمد",     email: "p.mt08@seed.local", teamId: "team-montazah", position: "MIDFIELDER", jerseyNumber: 14 },
  { id: "p-mt-09", userId: "u-mt-09", fullName: "سامي عبد الله", email: "p.mt09@seed.local", teamId: "team-montazah", position: "DEFENDER",   jerseyNumber: 5 },
  { id: "p-mt-10", userId: "u-mt-10", fullName: "ماجد حسين",     email: "p.mt10@seed.local", teamId: "team-montazah", position: "FORWARD",    jerseyNumber: 17 },
  { id: "p-mt-11", userId: "u-mt-11", fullName: "طارق ناصر",     email: "p.mt11@seed.local", teamId: "team-montazah", position: "MIDFIELDER", jerseyNumber: 6 },
  { id: "p-mt-12", userId: "u-mt-12", fullName: "هاني إبراهيم",  email: "p.mt12@seed.local", teamId: "team-montazah", position: "DEFENDER",   jerseyNumber: 2 },
  { id: "p-mt-13", userId: "u-mt-13", fullName: "رامي أحمد",     email: "p.mt13@seed.local", teamId: "team-montazah", position: "FORWARD",    jerseyNumber: 19 },
  { id: "p-mt-14", userId: "u-mt-14", fullName: "نبيل وليد",     email: "p.mt14@seed.local", teamId: "team-montazah", position: "MIDFIELDER", jerseyNumber: 15 },
  { id: "p-mt-15", userId: "u-mt-15", fullName: "أسامة طارق",    email: "p.mt15@seed.local", teamId: "team-montazah", position: "DEFENDER",   jerseyNumber: 20 },
  { id: "p-mt-16", userId: "u-mt-16", fullName: "finaly محمد",    email: "p.mt16@seed.local", teamId: "team-montazah", position: "GOALKEEPER", jerseyNumber: 22 },
  { id: "p-mt-17", userId: "u-mt-17", fullName: "كريم حسين",     email: "p.mt17@seed.local", teamId: "team-montazah", position: "FORWARD",    jerseyNumber: 18 },
  { id: "p-mt-18", userId: "u-mt-18", fullName: "أحمد ناصر",     email: "p.mt18@seed.local", teamId: "team-montazah", position: "MIDFIELDER", jerseyNumber: 13 },

  // === Sidi Bishr (18 players) ===
  { id: "p-sb-01", userId: "u-sb-01", fullName: "عمر خالد",       email: "p.sb01@seed.local", teamId: "team-sidibishr", position: "FORWARD",    jerseyNumber: 10 },
  { id: "p-sb-02", userId: "u-sb-02", fullName: "مصطفى عادل",    email: "p.sb02@seed.local", teamId: "team-sidibishr", position: "MIDFIELDER", jerseyNumber: 7 },
  { id: "p-sb-03", userId: "u-sb-03", fullName: "محمد أحمد",     email: "p.sb03@seed.local", teamId: "team-sidibishr", position: "DEFENDER",   jerseyNumber: 4 },
  { id: "p-sb-04", userId: "u-sb-04", fullName: "أحمد حسين",     email: "p.sb04@seed.local", teamId: "team-sidibishr", position: "FORWARD",    jerseyNumber: 9 },
  { id: "p-sb-05", userId: "u-sb-05", fullName: "خالد إبراهيم",  email: "p.sb05@seed.local", teamId: "team-sidibishr", position: "MIDFIELDER", jerseyNumber: 8 },
  { id: "p-sb-06", userId: "u-sb-06", fullName: "حسن طارق",      email: "p.sb06@seed.local", teamId: "team-sidibishr", position: "DEFENDER",   jerseyNumber: 3 },
  { id: "p-sb-07", userId: "u-sb-07", fullName: "finaly أحمد",    email: "p.sb07@seed.local", teamId: "team-sidibishr", position: "GOALKEEPER", jerseyNumber: 1 },
  { id: "p-sb-08", userId: "u-sb-08", fullName: "عمر سعيد",      email: "p.sb08@seed.local", teamId: "team-sidibishr", position: "MIDFIELDER", jerseyNumber: 14 },
  { id: "p-sb-09", userId: "u-sb-09", fullName: "ياسر حسين",     email: "p.sb09@seed.local", teamId: "team-sidibishr", position: "DEFENDER",   jerseyNumber: 5 },
  { id: "p-sb-10", userId: "u-sb-10", fullName: "سامي محمد",     email: "p.sb10@seed.local", teamId: "team-sidibishr", position: "FORWARD",    jerseyNumber: 17 },
  { id: "p-sb-11", userId: "u-sb-11", fullName: "طارق أحمد",     email: "p.sb11@seed.local", teamId: "team-sidibishr", position: "MIDFIELDER", jerseyNumber: 11 },
  { id: "p-sb-12", userId: "u-sb-12", fullName: "هاني سعيد",     email: "p.sb12@seed.local", teamId: "team-sidibishr", position: "DEFENDER",   jerseyNumber: 2 },
  { id: "p-sb-13", userId: "u-sb-13", fullName: "رامي خالد",     email: "p.sb13@seed.local", teamId: "team-sidibishr", position: "FORWARD",    jerseyNumber: 19 },
  { id: "p-sb-14", userId: "u-sb-14", fullName: "نبيل عبد الله", email: "p.sb14@seed.local", teamId: "team-sidibishr", position: "MIDFIELDER", jerseyNumber: 15 },
  { id: "p-sb-15", userId: "u-sb-15", fullName: "أسامة حسين",    email: "p.sb15@seed.local", teamId: "team-sidibishr", position: "DEFENDER",   jerseyNumber: 20 },
  { id: "p-sb-16", userId: "u-sb-16", fullName: "finaly عمر",    email: "p.sb16@seed.local", teamId: "team-sidibishr", position: "GOALKEEPER", jerseyNumber: 22 },
  { id: "p-sb-17", userId: "u-sb-17", fullName: "ماجد طارق",    email: "p.sb17@seed.local", teamId: "team-sidibishr", position: "FORWARD",    jerseyNumber: 18 },
  { id: "p-sb-18", userId: "u-sb-18", fullName: "كريم أحمد",     email: "p.sb18@seed.local", teamId: "team-sidibishr", position: "MIDFIELDER", jerseyNumber: 6 },

  // === Agamy (18 players) ===
  { id: "p-ag-01", userId: "u-ag-01", fullName: "ياسر فتحي",      email: "p.ag01@seed.local", teamId: "team-agamy", position: "DEFENDER",   jerseyNumber: 4 },
  { id: "p-ag-02", userId: "u-ag-02", fullName: "هشام ناصر",      email: "p.ag02@seed.local", teamId: "team-agamy", position: "FORWARD",    jerseyNumber: 9 },
  { id: "p-ag-03", userId: "u-ag-03", fullName: "محمد سعيد",      email: "p.ag03@seed.local", teamId: "team-agamy", position: "MIDFIELDER", jerseyNumber: 8 },
  { id: "p-ag-04", userId: "u-ag-04", fullName: "أحمد وليد",     email: "p.ag04@seed.local", teamId: "team-agamy", position: "FORWARD",    jerseyNumber: 11 },
  { id: "p-ag-05", userId: "u-ag-05", fullName: "خالد أحمد",     email: "p.ag05@seed.local", teamId: "team-agamy", position: "MIDFIELDER", jerseyNumber: 10 },
  { id: "p-ag-06", userId: "u-ag-06", fullName: "حسن ناصر",      email: "p.ag06@seed.local", teamId: "team-agamy", position: "DEFENDER",   jerseyNumber: 3 },
  { id: "p-ag-07", userId: "u-ag-07", fullName: "finaly ياسر",   email: "p.ag07@seed.local", teamId: "team-agamy", position: "GOALKEEPER", jerseyNumber: 1 },
  { id: "p-ag-08", userId: "u-ag-08", fullName: "عمر حسين",      email: "p.ag08@seed.local", teamId: "team-agamy", position: "MIDFIELDER", jerseyNumber: 14 },
  { id: "p-ag-09", userId: "u-ag-09", fullName: "ياسر طارق",     email: "p.ag09@seed.local", teamId: "team-agamy", position: "DEFENDER",   jerseyNumber: 5 },
  { id: "p-ag-10", userId: "u-ag-10", fullName: "سامي أحمد",     email: "p.ag10@seed.local", teamId: "team-agamy", position: "FORWARD",    jerseyNumber: 17 },
  { id: "p-ag-11", userId: "u-ag-11", fullName: "طارق سعيد",     email: "p.ag11@seed.local", teamId: "team-agamy", position: "MIDFIELDER", jerseyNumber: 6 },
  { id: "p-ag-12", userId: "u-ag-12", fullName: "هاني حسين",     email: "p.ag12@seed.local", teamId: "team-agamy", position: "DEFENDER",   jerseyNumber: 2 },
  { id: "p-ag-13", userId: "u-ag-13", fullName: "رامي محمد",     email: "p.ag13@seed.local", teamId: "team-agamy", position: "FORWARD",    jerseyNumber: 19 },
  { id: "p-ag-14", userId: "u-ag-14", fullName: "نبيل أحمد",     email: "p.ag14@seed.local", teamId: "team-agamy", position: "MIDFIELDER", jerseyNumber: 15 },
  { id: "p-ag-15", userId: "u-ag-15", fullName: "أسامة طارق",    email: "p.ag15@seed.local", teamId: "team-agamy", position: "DEFENDER",   jerseyNumber: 20 },
  { id: "p-ag-16", userId: "u-ag-16", fullName: "finaly عمر",    email: "p.ag16@seed.local", teamId: "team-agamy", position: "GOALKEEPER", jerseyNumber: 22 },
  { id: "p-ag-17", userId: "u-ag-17", fullName: "ماجد حسين",    email: "p.ag17@seed.local", teamId: "team-agamy", position: "FORWARD",    jerseyNumber: 18 },
  { id: "p-ag-18", userId: "u-ag-18", fullName: "كريم ناصر",    email: "p.ag18@seed.local", teamId: "team-agamy", position: "MIDFIELDER", jerseyNumber: 13 },

  // === Borg Arab (18 players) ===
  { id: "p-ba-01", userId: "u-ba-01", fullName: "finaly مصطفى",   email: "p.ba01@seed.local", teamId: "team-borg", position: "GOALKEEPER", jerseyNumber: 1 },
  { id: "p-ba-02", userId: "u-ba-02", fullName: "إبراهيم فؤاد",  email: "p.ba02@seed.local", teamId: "team-borg", position: "FORWARD",    jerseyNumber: 11 },
  { id: "p-ba-03", userId: "u-ba-03", fullName: "محمد أحمد",     email: "p.ba03@seed.local", teamId: "team-borg", position: "DEFENDER",   jerseyNumber: 4 },
  { id: "p-ba-04", userId: "u-ba-04", fullName: "أحمد حسين",     email: "p.ba04@seed.local", teamId: "team-borg", position: "FORWARD",    jerseyNumber: 9 },
  { id: "p-ba-05", userId: "u-ba-05", fullName: "خالد سعيد",     email: "p.ba05@seed.local", teamId: "team-borg", position: "MIDFIELDER", jerseyNumber: 8 },
  { id: "p-ba-06", userId: "u-ba-06", fullName: "حسن وليد",      email: "p.ba06@seed.local", teamId: "team-borg", position: "DEFENDER",   jerseyNumber: 3 },
  { id: "p-ba-07", userId: "u-ba-07", fullName: "finaly عمر",    email: "p.ba07@seed.local", teamId: "team-borg", position: "GOALKEEPER", jerseyNumber: 22 },
  { id: "p-ba-08", userId: "u-ba-08", fullName: "عمر ناصر",      email: "p.ba08@seed.local", teamId: "team-borg", position: "MIDFIELDER", jerseyNumber: 14 },
  { id: "p-ba-09", userId: "u-ba-09", fullName: "ياسر أحمد",     email: "p.ba09@seed.local", teamId: "team-borg", position: "DEFENDER",   jerseyNumber: 5 },
  { id: "p-ba-10", userId: "u-ba-10", fullName: "سامي طارق",     email: "p.ba10@seed.local", teamId: "team-borg", position: "FORWARD",    jerseyNumber: 17 },
  { id: "p-ba-11", userId: "u-ba-11", fullName: "طارق عبد الله", email: "p.ba11@seed.local", teamId: "team-borg", position: "MIDFIELDER", jerseyNumber: 10 },
  { id: "p-ba-12", userId: "u-ba-12", fullName: "هاني إبراهيم",  email: "p.ba12@seed.local", teamId: "team-borg", position: "DEFENDER",   jerseyNumber: 2 },
  { id: "p-ba-13", userId: "u-ba-13", fullName: "رامي حسين",     email: "p.ba13@seed.local", teamId: "team-borg", position: "FORWARD",    jerseyNumber: 19 },
  { id: "p-ba-14", userId: "u-ba-14", fullName: "نبيل سعيد",     email: "p.ba14@seed.local", teamId: "team-borg", position: "MIDFIELDER", jerseyNumber: 15 },
  { id: "p-ba-15", userId: "u-ba-15", fullName: "أسامة أحمد",    email: "p.ba15@seed.local", teamId: "team-borg", position: "DEFENDER",   jerseyNumber: 20 },
  { id: "p-ba-16", userId: "u-ba-16", fullName: "finaly محمد",   email: "p.ba16@seed.local", teamId: "team-borg", position: "GOALKEEPER", jerseyNumber: 13 },
  { id: "p-ba-17", userId: "u-ba-17", fullName: "ماجد طارق",     email: "p.ba17@seed.local", teamId: "team-borg", position: "FORWARD",    jerseyNumber: 18 },
  { id: "p-ba-18", userId: "u-ba-18", fullName: "كريم حسين",     email: "p.ba18@seed.local", teamId: "team-borg", position: "MIDFIELDER", jerseyNumber: 6 },

  // === Smouha (18 players) ===
  { id: "p-sm-01", userId: "u-sm-01", fullName: "عمرو جمال",      email: "p.sm01@seed.local", teamId: "team-smouha", position: "FORWARD",    jerseyNumber: 9 },
  { id: "p-sm-02", userId: "u-sm-02", fullName: "محمود رضا",     email: "p.sm02@seed.local", teamId: "team-smouha", position: "MIDFIELDER", jerseyNumber: 5 },
  { id: "p-sm-03", userId: "u-sm-03", fullName: "محمد سعيد",     email: "p.sm03@seed.local", teamId: "team-smouha", position: "DEFENDER",   jerseyNumber: 4 },
  { id: "p-sm-04", userId: "u-sm-04", fullName: "أحمد ناصر",     email: "p.sm04@seed.local", teamId: "team-smouha", position: "FORWARD",    jerseyNumber: 11 },
  { id: "p-sm-05", userId: "u-sm-05", fullName: "خالد طارق",     email: "p.sm05@seed.local", teamId: "team-smouha", position: "MIDFIELDER", jerseyNumber: 8 },
  { id: "p-sm-06", userId: "u-sm-06", fullName: "حسن سعيد",      email: "p.sm06@seed.local", teamId: "team-smouha", position: "DEFENDER",   jerseyNumber: 3 },
  { id: "p-sm-07", userId: "u-sm-07", fullName: "finaly عمرو",    email: "p.sm07@seed.local", teamId: "team-smouha", position: "GOALKEEPER", jerseyNumber: 1 },
  { id: "p-sm-08", userId: "u-sm-08", fullName: "عمر حسين",      email: "p.sm08@seed.local", teamId: "team-smouha", position: "MIDFIELDER", jerseyNumber: 14 },
  { id: "p-sm-09", userId: "u-sm-09", fullName: "ياسر أحمد",     email: "p.sm09@seed.local", teamId: "team-smouha", position: "DEFENDER",   jerseyNumber: 5 },
  { id: "p-sm-10", userId: "u-sm-10", fullName: "سامي محمد",     email: "p.sm10@seed.local", teamId: "team-smouha", position: "FORWARD",    jerseyNumber: 17 },
  { id: "p-sm-11", userId: "u-sm-11", fullName: "طارق أحمد",     email: "p.sm11@seed.local", teamId: "team-smouha", position: "MIDFIELDER", jerseyNumber: 10 },
  { id: "p-sm-12", userId: "u-sm-12", fullName: "هاني سعيد",     email: "p.sm12@seed.local", teamId: "team-smouha", position: "DEFENDER",   jerseyNumber: 2 },
  { id: "p-sm-13", userId: "u-sm-13", fullName: "رامي خالد",     email: "p.sm13@seed.local", teamId: "team-smouha", position: "FORWARD",    jerseyNumber: 19 },
  { id: "p-sm-14", userId: "u-sm-14", fullName: "نبيل عبد الله", email: "p.sm14@seed.local", teamId: "team-smouha", position: "MIDFIELDER", jerseyNumber: 15 },
  { id: "p-sm-15", userId: "u-sm-15", fullName: "أسامة حسين",    email: "p.sm15@seed.local", teamId: "team-smouha", position: "DEFENDER",   jerseyNumber: 20 },
  { id: "p-sm-16", userId: "u-sm-16", fullName: "finaly عمر",    email: "p.sm16@seed.local", teamId: "team-smouha", position: "GOALKEEPER", jerseyNumber: 22 },
  { id: "p-sm-17", userId: "u-sm-17", fullName: "ماجد طارق",    email: "p.sm17@seed.local", teamId: "team-smouha", position: "FORWARD",    jerseyNumber: 18 },
  { id: "p-sm-18", userId: "u-sm-18", fullName: "كريم أحمد",     email: "p.sm18@seed.local", teamId: "team-smouha", position: "MIDFIELDER", jerseyNumber: 6 },

  // === Rashtin (18 players) ===
  { id: "p-rs-01", userId: "u-rs-01", fullName: "نادر شوقي",      email: "p.rs01@seed.local", teamId: "team-rashtin", position: "FORWARD",    jerseyNumber: 9 },
  { id: "p-rs-02", userId: "u-rs-02", fullName: "عماد سامي",      email: "p.rs02@seed.local", teamId: "team-rashtin", position: "DEFENDER",   jerseyNumber: 2 },
  { id: "p-rs-03", userId: "u-rs-03", fullName: "محمد حسين",      email: "p.rs03@seed.local", teamId: "team-rashtin", position: "MIDFIELDER", jerseyNumber: 8 },
  { id: "p-rs-04", userId: "u-rs-04", fullName: "أحمد طارق",     email: "p.rs04@seed.local", teamId: "team-rashtin", position: "FORWARD",    jerseyNumber: 11 },
  { id: "p-rs-05", userId: "u-rs-05", fullName: "خالد عبد الله", email: "p.rs05@seed.local", teamId: "team-rashtin", position: "MIDFIELDER", jerseyNumber: 10 },
  { id: "p-rs-06", userId: "u-rs-06", fullName: "حسن أحمد",      email: "p.rs06@seed.local", teamId: "team-rashtin", position: "DEFENDER",   jerseyNumber: 3 },
  { id: "p-rs-07", userId: "u-rs-07", fullName: "finaly نادر",   email: "p.rs07@seed.local", teamId: "team-rashtin", position: "GOALKEEPER", jerseyNumber: 1 },
  { id: "p-rs-08", userId: "u-rs-08", fullName: "عمر سعيد",      email: "p.rs08@seed.local", teamId: "team-rashtin", position: "MIDFIELDER", jerseyNumber: 14 },
  { id: "p-rs-09", userId: "u-rs-09", fullName: "ياسر حسين",     email: "p.rs09@seed.local", teamId: "team-rashtin", position: "DEFENDER",   jerseyNumber: 5 },
  { id: "p-rs-10", userId: "u-rs-10", fullName: "سامي محمد",     email: "p.rs10@seed.local", teamId: "team-rashtin", position: "FORWARD",    jerseyNumber: 17 },
  { id: "p-rs-11", userId: "u-rs-11", fullName: "طارق ناصر",     email: "p.rs11@seed.local", teamId: "team-rashtin", position: "MIDFIELDER", jerseyNumber: 6 },
  { id: "p-rs-12", userId: "u-rs-12", fullName: "هاني أحمد",     email: "p.rs12@seed.local", teamId: "team-rashtin", position: "DEFENDER",   jerseyNumber: 2 },
  { id: "p-rs-13", userId: "u-rs-13", fullName: "رامي طارق",     email: "p.rs13@seed.local", teamId: "team-rashtin", position: "FORWARD",    jerseyNumber: 19 },
  { id: "p-rs-14", userId: "u-rs-14", fullName: "نبيل سعيد",     email: "p.rs14@seed.local", teamId: "team-rashtin", position: "MIDFIELDER", jerseyNumber: 15 },
  { id: "p-rs-15", userId: "u-rs-15", fullName: "أسامة حسين",    email: "p.rs15@seed.local", teamId: "team-rashtin", position: "DEFENDER",   jerseyNumber: 20 },
  { id: "p-rs-16", userId: "u-rs-16", fullName: "finaly عمر",    email: "p.rs16@seed.local", teamId: "team-rashtin", position: "GOALKEEPER", jerseyNumber: 22 },
  { id: "p-rs-17", userId: "u-rs-17", fullName: "ماجد ناصر",    email: "p.rs17@seed.local", teamId: "team-rashtin", position: "FORWARD",    jerseyNumber: 18 },
  { id: "p-rs-18", userId: "u-rs-18", fullName: "كريم أحمد",    email: "p.rs18@seed.local", teamId: "team-rashtin", position: "MIDFIELDER", jerseyNumber: 13 },

  // === Lemma (18 players) ===
  { id: "p-lm-01", userId: "u-lm-01", fullName: "وليد أيمن",      email: "p.lm01@seed.local", teamId: "team-lem3a", position: "FORWARD",    jerseyNumber: 10 },
  { id: "p-lm-02", userId: "u-lm-02", fullName: "فرج حافظ",      email: "p.lm02@seed.local", teamId: "team-lem3a", position: "MIDFIELDER", jerseyNumber: 6 },
  { id: "p-lm-03", userId: "u-lm-03", fullName: "محمد سعيد",     email: "p.lm03@seed.local", teamId: "team-lem3a", position: "DEFENDER",   jerseyNumber: 4 },
  { id: "p-lm-04", userId: "u-lm-04", fullName: "أحمد حسين",     email: "p.lm04@seed.local", teamId: "team-lem3a", position: "FORWARD",    jerseyNumber: 9 },
  { id: "p-lm-05", userId: "u-lm-05", fullName: "خالد طارق",     email: "p.lm05@seed.local", teamId: "team-lem3a", position: "MIDFIELDER", jerseyNumber: 8 },
  { id: "p-lm-06", userId: "u-lm-06", fullName: "حسن ناصر",      email: "p.lm06@seed.local", teamId: "team-lem3a", position: "DEFENDER",   jerseyNumber: 3 },
  { id: "p-lm-07", userId: "u-lm-07", fullName: "finaly وليد",   email: "p.lm07@seed.local", teamId: "team-lem3a", position: "GOALKEEPER", jerseyNumber: 1 },
  { id: "p-lm-08", userId: "u-lm-08", fullName: "عمر أحمد",      email: "p.lm08@seed.local", teamId: "team-lem3a", position: "MIDFIELDER", jerseyNumber: 14 },
  { id: "p-lm-09", userId: "u-lm-09", fullName: "ياسر سعيد",     email: "p.lm09@seed.local", teamId: "team-lem3a", position: "DEFENDER",   jerseyNumber: 5 },
  { id: "p-lm-10", userId: "u-lm-10", fullName: "سامي حسين",     email: "p.lm10@seed.local", teamId: "team-lem3a", position: "FORWARD",    jerseyNumber: 17 },
  { id: "p-lm-11", userId: "u-lm-11", fullName: "طارق أحمد",     email: "p.lm11@seed.local", teamId: "team-lem3a", position: "MIDFIELDER", jerseyNumber: 11 },
  { id: "p-lm-12", userId: "u-lm-12", fullName: "هاني عبد الله", email: "p.lm12@seed.local", teamId: "team-lem3a", position: "DEFENDER",   jerseyNumber: 2 },
  { id: "p-lm-13", userId: "u-lm-13", fullName: "رامي سعيد",     email: "p.lm13@seed.local", teamId: "team-lem3a", position: "FORWARD",    jerseyNumber: 19 },
  { id: "p-lm-14", userId: "u-lm-14", fullName: "نبيل محمد",     email: "p.lm14@seed.local", teamId: "team-lem3a", position: "MIDFIELDER", jerseyNumber: 15 },
  { id: "p-lm-15", userId: "u-lm-15", fullName: "أسامة طارق",    email: "p.lm15@seed.local", teamId: "team-lem3a", position: "DEFENDER",   jerseyNumber: 20 },
  { id: "p-lm-16", userId: "u-lm-16", fullName: "finaly عمر",    email: "p.lm16@seed.local", teamId: "team-lem3a", position: "GOALKEEPER", jerseyNumber: 22 },
  { id: "p-lm-17", userId: "u-lm-17", fullName: "ماجد حسين",    email: "p.lm17@seed.local", teamId: "team-lem3a", position: "FORWARD",    jerseyNumber: 18 },
  { id: "p-lm-18", userId: "u-lm-18", fullName: "كريم ناصر",    email: "p.lm18@seed.local", teamId: "team-lem3a", position: "MIDFIELDER", jerseyNumber: 13 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function hoursAhead(n: number): Date {
  return new Date(Date.now() + n * 60 * 60 * 1000);
}

interface MatchInput {
  id: string;
  tournamentId: string;
  seasonId: string;
  homeId: string;
  awayId: string;
  status: string;
  kickoffAt: Date;
  homeScore: number;
  awayScore: number;
  minute?: number;
  round: string;
  venue?: string;
}

interface GoalEvent {
  matchId: string;
  playerId: string;
  teamId: string;
  count: number;
}

async function upsertMatch(m: MatchInput) {
  return prisma.match.upsert({
    where: { id: m.id },
    update: {},
    create: {
      id: m.id, tournamentId: m.tournamentId, seasonId: m.seasonId,
      homeTeamId: m.homeId, awayTeamId: m.awayId, status: m.status,
      kickoffAt: m.kickoffAt, homeScore: m.homeScore, awayScore: m.awayScore,
      minute: m.minute, round: m.round, venue: m.venue,
    },
  });
}

async function createGoalEvents(events: GoalEvent[]) {
  let counter = 0;
  for (const ge of events) {
    for (let i = 0; i < ge.count; i++) {
      counter++;
      await prisma.matchEvent.create({
        data: {
          id: `ev-${ge.matchId}-${counter}`,
          matchId: ge.matchId, playerId: ge.playerId, teamId: ge.teamId,
          type: "GOAL", minute: (counter % 88) + 1,
        },
      });
    }
  }
  return counter;
}

// ===========================================================================
// MAIN
// ===========================================================================

async function main(): Promise<void> {
  console.log("Seeding database...");
  const passwordHash = await makeHash(SEED_PASSWORD);

  // --- Admin & organizer users -------------------------------------------
  await prisma.user.upsert({
    where: { id: "user-admin" }, update: {},
    create: { id: "user-admin", email: "admin@asl.local", passwordHash, fullName: "مدير النظام", role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { id: "user-organizer" }, update: {},
    create: { id: "user-organizer", email: "organizer@asl.local", passwordHash, fullName: "منظم البطولة", role: "TOURNAMENT_ORGANIZER" },
  });

  // --- Teams -------------------------------------------------------------
  for (const seed of TEAM_SEEDS) {
    await prisma.team.upsert({
      where: { id: seed.id }, update: {},
      create: { id: seed.id, name: seed.name, shortName: seed.shortName, city: "الإسكندرية", crestUrl: crest(seed.name) },
    });
  }

  // --- Players, users, memberships --------------------------------------
  for (const seed of PLAYER_SEEDS) {
    await prisma.user.upsert({
      where: { id: seed.userId }, update: {},
      create: { id: seed.userId, email: seed.email, passwordHash, fullName: seed.fullName, role: "PLAYER" },
    });
    await prisma.player.upsert({
      where: { id: seed.id }, update: {},
      create: { id: seed.id, userId: seed.userId, photoUrl: avatar(seed.fullName), position: seed.position, jerseyNumber: seed.jerseyNumber },
    });
    await prisma.teamMembership.upsert({
      where: { teamId_playerId: { teamId: seed.teamId, playerId: seed.id } }, update: {},
      create: { teamId: seed.teamId, playerId: seed.id, status: "ACTIVE", joinedAt: new Date("2024-09-01") },
    });
  }

  // ======================================================================
  // COMPETITION 1 — League (ONGOING)
  // ======================================================================

  const league = await prisma.tournament.upsert({
    where: { id: "tournament-league" }, update: {},
    create: { id: "tournament-league", name: "دوري الإسكندرية الممتاز", format: "LEAGUE", status: "ONGOING", startDate: new Date("2024-09-01") },
  });
  const leagueSeason = await prisma.season.upsert({
    where: { id: "season-league-2024-25" }, update: {},
    create: { id: "season-league-2024-25", tournamentId: league.id, label: "2024/2025", startDate: new Date("2024-09-01") },
  });
  for (const seed of TEAM_SEEDS) {
    await prisma.tournamentTeam.upsert({
      where: { tournamentId_teamId: { tournamentId: league.id, teamId: seed.id } }, update: {},
      create: { tournamentId: league.id, teamId: seed.id },
    });
  }

  const leagueMatches: MatchInput[] = [
    { id: "lg-m1",  tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-karnak",    awayId: "team-manshiya",  status: "FINISHED", kickoffAt: daysAgo(28), homeScore: 2, awayScore: 1, round: "الأسبوع 1" },
    { id: "lg-m2",  tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-abrag",     awayId: "team-montazah",  status: "FINISHED", kickoffAt: daysAgo(28), homeScore: 1, awayScore: 0, round: "الأسبوع 1" },
    { id: "lg-m3",  tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-sidibishr", awayId: "team-agamy",     status: "FINISHED", kickoffAt: daysAgo(28), homeScore: 3, awayScore: 1, round: "الأسبوع 1" },
    { id: "lg-m4",  tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-borg",      awayId: "team-smouha",    status: "FINISHED", kickoffAt: daysAgo(28), homeScore: 0, awayScore: 2, round: "الأسبوع 1" },
    { id: "lg-m5",  tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-rashtin",   awayId: "team-lem3a",     status: "FINISHED", kickoffAt: daysAgo(28), homeScore: 1, awayScore: 1, round: "الأسبوع 1" },
    { id: "lg-m6",  tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-manshiya",  awayId: "team-abrag",     status: "FINISHED", kickoffAt: daysAgo(21), homeScore: 2, awayScore: 2, round: "الأسبوع 2" },
    { id: "lg-m7",  tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-montazah",  awayId: "team-karnak",    status: "FINISHED", kickoffAt: daysAgo(21), homeScore: 1, awayScore: 4, round: "الأسبوع 2" },
    { id: "lg-m8",  tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-agamy",     awayId: "team-sidibishr", status: "FINISHED", kickoffAt: daysAgo(21), homeScore: 1, awayScore: 1, round: "الأسبوع 2" },
    { id: "lg-m9",  tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-smouha",    awayId: "team-rashtin",   status: "FINISHED", kickoffAt: daysAgo(21), homeScore: 3, awayScore: 0, round: "الأسبوع 2" },
    { id: "lg-m10", tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-lem3a",     awayId: "team-borg",      status: "FINISHED", kickoffAt: daysAgo(21), homeScore: 2, awayScore: 1, round: "الأسبوع 2" },
    { id: "lg-m11", tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-karnak",    awayId: "team-abrag",     status: "FINISHED", kickoffAt: daysAgo(14), homeScore: 2, awayScore: 0, round: "الأسبوع 3" },
    { id: "lg-m12", tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-sidibishr", awayId: "team-manshiya",  status: "FINISHED", kickoffAt: daysAgo(14), homeScore: 1, awayScore: 0, round: "الأسبوع 3" },
    { id: "lg-m13", tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-smouha",    awayId: "team-montazah",  status: "FINISHED", kickoffAt: daysAgo(14), homeScore: 2, awayScore: 2, round: "الأسبوع 3" },
    { id: "lg-m14", tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-borg",      awayId: "team-rashtin",   status: "FINISHED", kickoffAt: daysAgo(14), homeScore: 1, awayScore: 3, round: "الأسبوع 3" },
  ];
  for (const m of leagueMatches) await upsertMatch(m);

  await upsertMatch({
    id: "lg-m15", tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-karnak", awayId: "team-agamy",
    status: "LIVE", kickoffAt: new Date(), homeScore: 2, awayScore: 1, minute: 67, round: "الأسبوع 4",
  });

  const leagueUpcoming: MatchInput[] = [
    { id: "lg-up1", tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-sidibishr", awayId: "team-lem3a",     status: "SCHEDULED", kickoffAt: hoursAhead(6),   homeScore: 0, awayScore: 0, round: "الأسبوع 4" },
    { id: "lg-up2", tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-abrag",     awayId: "team-smouha",    status: "SCHEDULED", kickoffAt: hoursAhead(30),  homeScore: 0, awayScore: 0, round: "الأسبوع 4" },
    { id: "lg-up3", tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-manshiya",  awayId: "team-karnak",    status: "SCHEDULED", kickoffAt: hoursAhead(54),  homeScore: 0, awayScore: 0, round: "الأسبوع 5" },
    { id: "lg-up4", tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-montazah",  awayId: "team-borg",      status: "SCHEDULED", kickoffAt: hoursAhead(78),  homeScore: 0, awayScore: 0, round: "الأسبوع 5" },
    { id: "lg-up5", tournamentId: league.id, seasonId: leagueSeason.id, homeId: "team-rashtin",   awayId: "team-agamy",     status: "SCHEDULED", kickoffAt: hoursAhead(102), homeScore: 0, awayScore: 0, round: "الأسبوع 5" },
  ];
  for (const m of leagueUpcoming) await upsertMatch(m);

  const leagueGoals: GoalEvent[] = [
    { matchId: "lg-m1",  playerId: "p-k-01",  teamId: "team-karnak",    count: 2 },
    { matchId: "lg-m1",  playerId: "p-m-01",  teamId: "team-manshiya",  count: 1 },
    { matchId: "lg-m2",  playerId: "p-a-02",  teamId: "team-abrag",     count: 1 },
    { matchId: "lg-m3",  playerId: "p-sb-01",  teamId: "team-sidibishr", count: 2 },
    { matchId: "lg-m3",  playerId: "p-ag-02",  teamId: "team-agamy",     count: 1 },
    { matchId: "lg-m3",  playerId: "p-sb-02",  teamId: "team-sidibishr", count: 1 },
    { matchId: "lg-m4",  playerId: "p-sm-01",  teamId: "team-smouha",    count: 2 },
    { matchId: "lg-m5",  playerId: "p-rs-01",  teamId: "team-rashtin",   count: 1 },
    { matchId: "lg-m5",  playerId: "p-lm-01",  teamId: "team-lem3a",     count: 1 },
    { matchId: "lg-m6",  playerId: "p-m-01",  teamId: "team-manshiya",  count: 1 },
    { matchId: "lg-m6",  playerId: "p-m-02",  teamId: "team-manshiya",  count: 1 },
    { matchId: "lg-m6",  playerId: "p-a-01",  teamId: "team-abrag",     count: 1 },
    { matchId: "lg-m6",  playerId: "p-a-02",  teamId: "team-abrag",     count: 1 },
    { matchId: "lg-m7",  playerId: "p-k-01",  teamId: "team-karnak",    count: 4 },
    { matchId: "lg-m7",  playerId: "p-mt-01", teamId: "team-montazah",  count: 1 },
    { matchId: "lg-m8",  playerId: "p-ag-02",  teamId: "team-agamy",     count: 1 },
    { matchId: "lg-m8",  playerId: "p-sb-01",  teamId: "team-sidibishr", count: 1 },
    { matchId: "lg-m9",  playerId: "p-sm-01",  teamId: "team-smouha",    count: 2 },
    { matchId: "lg-m9",  playerId: "p-sm-02",  teamId: "team-smouha",    count: 1 },
    { matchId: "lg-m10", playerId: "p-lm-01",  teamId: "team-lem3a",     count: 2 },
    { matchId: "lg-m10", playerId: "p-ba-02",  teamId: "team-borg",      count: 1 },
    { matchId: "lg-m11", playerId: "p-k-01",  teamId: "team-karnak",    count: 1 },
    { matchId: "lg-m11", playerId: "p-k-03",  teamId: "team-karnak",    count: 1 },
    { matchId: "lg-m12", playerId: "p-sb-01",  teamId: "team-sidibishr", count: 1 },
    { matchId: "lg-m13", playerId: "p-sm-01",  teamId: "team-smouha",    count: 1 },
    { matchId: "lg-m13", playerId: "p-mt-01", teamId: "team-montazah",  count: 1 },
    { matchId: "lg-m13", playerId: "p-sm-02",  teamId: "team-smouha",    count: 1 },
    { matchId: "lg-m13", playerId: "p-mt-02", teamId: "team-montazah",  count: 1 },
    { matchId: "lg-m14", playerId: "p-rs-01",  teamId: "team-rashtin",   count: 3 },
    { matchId: "lg-m15", playerId: "p-k-01",  teamId: "team-karnak",    count: 1 },
    { matchId: "lg-m15", playerId: "p-k-03",  teamId: "team-karnak",    count: 1 },
    { matchId: "lg-m15", playerId: "p-ag-02",  teamId: "team-agamy",     count: 1 },
  ];
  await createGoalEvents(leagueGoals);

  // ======================================================================
  // COMPETITION 2 — Cup (ONGOING)
  // ======================================================================

  const cup = await prisma.tournament.upsert({
    where: { id: "tournament-cup" }, update: {},
    create: { id: "tournament-cup", name: "كأس الإسكندرية", format: "KNOCKOUT", status: "ONGOING", startDate: new Date("2025-01-15") },
  });
  const cupSeason = await prisma.season.upsert({
    where: { id: "season-cup-2025" }, update: {},
    create: { id: "season-cup-2025", tournamentId: cup.id, label: "2025", startDate: new Date("2025-01-15") },
  });
  const cupTeamIds = ["team-karnak","team-manshiya","team-abrag","team-montazah","team-sidibishr","team-agamy","team-borg","team-smouha"];
  for (const tid of cupTeamIds) {
    await prisma.tournamentTeam.upsert({
      where: { tournamentId_teamId: { tournamentId: cup.id, teamId: tid } }, update: {},
      create: { tournamentId: cup.id, teamId: tid },
    });
  }

  const cupMatches: MatchInput[] = [
    { id: "cup-qf1", tournamentId: cup.id, seasonId: cupSeason.id, homeId: "team-karnak",    awayId: "team-smouha",    status: "FINISHED", kickoffAt: daysAgo(20), homeScore: 3, awayScore: 1, round: "ربع النهائي", venue: "ستاد كرموز" },
    { id: "cup-qf2", tournamentId: cup.id, seasonId: cupSeason.id, homeId: "team-manshiya",  awayId: "team-agamy",     status: "FINISHED", kickoffAt: daysAgo(20), homeScore: 1, awayScore: 0, round: "ربع النهائي", venue: "ستاد المنشية" },
    { id: "cup-qf3", tournamentId: cup.id, seasonId: cupSeason.id, homeId: "team-abrag",     awayId: "team-sidibishr", status: "FINISHED", kickoffAt: daysAgo(18), homeScore: 2, awayScore: 2, round: "ربع النهائي", venue: "ستاد النخاطر" },
    { id: "cup-qf4", tournamentId: cup.id, seasonId: cupSeason.id, homeId: "team-montazah",  awayId: "team-borg",      status: "FINISHED", kickoffAt: daysAgo(18), homeScore: 1, awayScore: 0, round: "ربع النهائي", venue: "ستاد المنتزه" },
    { id: "cup-sf1", tournamentId: cup.id, seasonId: cupSeason.id, homeId: "team-karnak",    awayId: "team-manshiya",  status: "FINISHED", kickoffAt: daysAgo(7),  homeScore: 2, awayScore: 1, round: "نصف النهائي", venue: "ستاد كرموز" },
    { id: "cup-sf2", tournamentId: cup.id, seasonId: cupSeason.id, homeId: "team-abrag",     awayId: "team-montazah",  status: "SCHEDULED", kickoffAt: hoursAhead(48), homeScore: 0, awayScore: 0, round: "نصف النهائي", venue: "ستاد النخاطر" },
    { id: "cup-final", tournamentId: cup.id, seasonId: cupSeason.id, homeId: "team-karnak", awayId: "team-abrag",     status: "SCHEDULED", kickoffAt: hoursAhead(168), homeScore: 0, awayScore: 0, round: "النهائي", venue: "ستاد الإسكندرية المركزي" },
  ];
  for (const m of cupMatches) await upsertMatch(m);

  const cupGoals: GoalEvent[] = [
    { matchId: "cup-qf1", playerId: "p-k-01",  teamId: "team-karnak",  count: 2 },
    { matchId: "cup-qf1", playerId: "p-k-03",  teamId: "team-karnak",  count: 1 },
    { matchId: "cup-qf1", playerId: "p-sm-01", teamId: "team-smouha",  count: 1 },
    { matchId: "cup-qf2", playerId: "p-m-01",  teamId: "team-manshiya", count: 1 },
    { matchId: "cup-qf3", playerId: "p-a-01",  teamId: "team-abrag",    count: 1 },
    { matchId: "cup-qf3", playerId: "p-a-02",  teamId: "team-abrag",    count: 1 },
    { matchId: "cup-qf3", playerId: "p-sb-01", teamId: "team-sidibishr", count: 1 },
    { matchId: "cup-qf3", playerId: "p-sb-02", teamId: "team-sidibishr", count: 1 },
    { matchId: "cup-qf4", playerId: "p-mt-01", teamId: "team-montazah", count: 1 },
    { matchId: "cup-sf1", playerId: "p-k-01",  teamId: "team-karnak",  count: 1 },
    { matchId: "cup-sf1", playerId: "p-k-02",  teamId: "team-karnak",  count: 1 },
    { matchId: "cup-sf1", playerId: "p-m-01",  teamId: "team-manshiya", count: 1 },
  ];
  await createGoalEvents(cupGoals);

  // ======================================================================
  // COMPETITION 3 — Champions League (ONGOING)
  // ======================================================================

  const cl = await prisma.tournament.upsert({
    where: { id: "tournament-cl" }, update: {},
    create: { id: "tournament-cl", name: "دوري أبطال الإسكندرية", format: "GROUPS_KNOCKOUT", status: "ONGOING", startDate: new Date("2025-02-01") },
  });
  const clSeason = await prisma.season.upsert({
    where: { id: "season-cl-2025" }, update: {},
    create: { id: "season-cl-2025", tournamentId: cl.id, label: "2025", startDate: new Date("2025-02-01") },
  });

  const clGroupA = ["team-karnak","team-abrag","team-agamy","team-rashtin"];
  const clGroupB = ["team-manshiya","team-montazah","team-sidibishr","team-smouha"];
  for (const tid of [...clGroupA, ...clGroupB]) {
    const groupLabel = clGroupA.includes(tid) ? "المجموعة أ" : "المجموعة ب";
    await prisma.tournamentTeam.upsert({
      where: { tournamentId_teamId: { tournamentId: cl.id, teamId: tid } }, update: {},
      create: { tournamentId: cl.id, teamId: tid, groupLabel },
    });
  }

  const clMatches: MatchInput[] = [
    { id: "cl-a1", tournamentId: cl.id, seasonId: clSeason.id, homeId: "team-karnak",  awayId: "team-agamy",     status: "FINISHED", kickoffAt: daysAgo(24), homeScore: 3, awayScore: 0, round: "المجموعة أ — الجولة 1" },
    { id: "cl-a2", tournamentId: cl.id, seasonId: clSeason.id, homeId: "team-abrag",   awayId: "team-rashtin",   status: "FINISHED", kickoffAt: daysAgo(24), homeScore: 2, awayScore: 1, round: "المجموعة أ — الجولة 1" },
    { id: "cl-a3", tournamentId: cl.id, seasonId: clSeason.id, homeId: "team-rashtin", awayId: "team-karnak",    status: "FINISHED", kickoffAt: daysAgo(17), homeScore: 0, awayScore: 2, round: "المجموعة أ — الجولة 2" },
    { id: "cl-a4", tournamentId: cl.id, seasonId: clSeason.id, homeId: "team-agamy",   awayId: "team-abrag",     status: "FINISHED", kickoffAt: daysAgo(17), homeScore: 1, awayScore: 3, round: "المجموعة أ — الجولة 2" },
    { id: "cl-a5", tournamentId: cl.id, seasonId: clSeason.id, homeId: "team-karnak",  awayId: "team-abrag",     status: "FINISHED", kickoffAt: daysAgo(10), homeScore: 1, awayScore: 1, round: "المجموعة أ — الجولة 3" },
    { id: "cl-a6", tournamentId: cl.id, seasonId: clSeason.id, homeId: "team-agamy",   awayId: "team-rashtin",   status: "FINISHED", kickoffAt: daysAgo(10), homeScore: 2, awayScore: 2, round: "المجموعة أ — الجولة 3" },
    { id: "cl-b1", tournamentId: cl.id, seasonId: clSeason.id, homeId: "team-manshiya",  awayId: "team-sidibishr", status: "FINISHED", kickoffAt: daysAgo(24), homeScore: 2, awayScore: 0, round: "المجموعة ب — الجولة 1" },
    { id: "cl-b2", tournamentId: cl.id, seasonId: clSeason.id, homeId: "team-montazah",  awayId: "team-smouha",    status: "FINISHED", kickoffAt: daysAgo(24), homeScore: 1, awayScore: 1, round: "المجموعة ب — الجولة 1" },
    { id: "cl-b3", tournamentId: cl.id, seasonId: clSeason.id, homeId: "team-smouha",    awayId: "team-manshiya",  status: "FINISHED", kickoffAt: daysAgo(17), homeScore: 0, awayScore: 1, round: "المجموعة ب — الجولة 2" },
    { id: "cl-b4", tournamentId: cl.id, seasonId: clSeason.id, homeId: "team-sidibishr", awayId: "team-montazah",  status: "FINISHED", kickoffAt: daysAgo(17), homeScore: 2, awayScore: 3, round: "المجموعة ب — الجولة 2" },
    { id: "cl-b5", tournamentId: cl.id, seasonId: clSeason.id, homeId: "team-manshiya",  awayId: "team-montazah",  status: "FINISHED", kickoffAt: daysAgo(10), homeScore: 2, awayScore: 1, round: "المجموعة ب — الجولة 3" },
    { id: "cl-b6", tournamentId: cl.id, seasonId: clSeason.id, homeId: "team-sidibishr", awayId: "team-smouha",    status: "FINISHED", kickoffAt: daysAgo(10), homeScore: 1, awayScore: 0, round: "المجموعة ب — الجولة 3" },
  ];
  for (const m of clMatches) await upsertMatch(m);

  await upsertMatch({
    id: "cl-qf1", tournamentId: cl.id, seasonId: clSeason.id, homeId: "team-karnak", awayId: "team-montazah",
    status: "SCHEDULED", kickoffAt: hoursAhead(36), homeScore: 0, awayScore: 0, round: "ربع النهائي", venue: "ستاد كرموز",
  });
  await upsertMatch({
    id: "cl-qf2", tournamentId: cl.id, seasonId: clSeason.id, homeId: "team-manshiya", awayId: "team-abrag",
    status: "SCHEDULED", kickoffAt: hoursAhead(36), homeScore: 0, awayScore: 0, round: "ربع النهائي", venue: "ستاد المنشية",
  });

  const clGoals: GoalEvent[] = [
    { matchId: "cl-a1", playerId: "p-k-01",  teamId: "team-karnak",  count: 2 },
    { matchId: "cl-a1", playerId: "p-k-03",  teamId: "team-karnak",  count: 1 },
    { matchId: "cl-a2", playerId: "p-a-01",  teamId: "team-abrag",   count: 1 },
    { matchId: "cl-a2", playerId: "p-a-02",  teamId: "team-abrag",   count: 1 },
    { matchId: "cl-a2", playerId: "p-rs-01", teamId: "team-rashtin", count: 1 },
    { matchId: "cl-a3", playerId: "p-k-01",  teamId: "team-karnak",  count: 2 },
    { matchId: "cl-a4", playerId: "p-a-01",  teamId: "team-abrag",   count: 2 },
    { matchId: "cl-a4", playerId: "p-a-02",  teamId: "team-abrag",   count: 1 },
    { matchId: "cl-a4", playerId: "p-ag-02", teamId: "team-agamy",   count: 1 },
    { matchId: "cl-a5", playerId: "p-k-03",  teamId: "team-karnak",  count: 1 },
    { matchId: "cl-a5", playerId: "p-a-01",  teamId: "team-abrag",   count: 1 },
    { matchId: "cl-a6", playerId: "p-ag-02", teamId: "team-agamy",   count: 2 },
    { matchId: "cl-a6", playerId: "p-rs-01", teamId: "team-rashtin", count: 2 },
    { matchId: "cl-b1", playerId: "p-m-01",  teamId: "team-manshiya", count: 2 },
    { matchId: "cl-b2", playerId: "p-mt-01", teamId: "team-montazah", count: 1 },
    { matchId: "cl-b2", playerId: "p-sm-01", teamId: "team-smouha",   count: 1 },
    { matchId: "cl-b3", playerId: "p-m-01",  teamId: "team-manshiya", count: 1 },
    { matchId: "cl-b4", playerId: "p-mt-01", teamId: "team-montazah", count: 2 },
    { matchId: "cl-b4", playerId: "p-mt-02", teamId: "team-montazah", count: 1 },
    { matchId: "cl-b4", playerId: "p-sb-01", teamId: "team-sidibishr", count: 1 },
    { matchId: "cl-b4", playerId: "p-sb-02", teamId: "team-sidibishr", count: 1 },
    { matchId: "cl-b5", playerId: "p-m-01",  teamId: "team-manshiya", count: 1 },
    { matchId: "cl-b5", playerId: "p-m-02",  teamId: "team-manshiya", count: 1 },
    { matchId: "cl-b5", playerId: "p-mt-01", teamId: "team-montazah", count: 1 },
    { matchId: "cl-b6", playerId: "p-sb-01", teamId: "team-sidibishr", count: 1 },
  ];
  await createGoalEvents(clGoals);

  // ======================================================================
  // Match squads (demo data)
  // ======================================================================

  const teamPlayerMap: Record<string, string[]> = {};
  for (const ts of TEAM_SEEDS) {
    const players = PLAYER_SEEDS.filter((p) => p.teamId === ts.id);
    teamPlayerMap[ts.id] = players.map((p) => p.id);
  }

  async function createMatchSquad(
    matchId: string,
    teamId: string,
    status: string,
    starterCount: number,
  ) {
    const players = teamPlayerMap[teamId] ?? [];
    if (players.length === 0) return;

    const existing = await prisma.matchSquad.findFirst({
      where: { matchId, teamId },
    });

    const squad = existing
      ? await prisma.matchSquad.update({ where: { id: existing.id }, data: { status } })
      : await prisma.matchSquad.create({ data: { matchId, teamId, status } });

    await prisma.matchSquadPlayer.deleteMany({ where: { squadId: squad.id } });

    const selected = players.slice(0, Math.min(starterCount + 4, players.length));
    const starterIds = selected.slice(0, starterCount);

    await prisma.matchSquadPlayer.createMany({
      data: selected.map((pid, i) => ({
        squadId: squad.id,
        playerId: pid,
        isStarter: starterIds.includes(pid),
        sortOrder: i,
      })),
    });
  }

  const squadMatches = [
    { matchId: "lg-m1", home: "team-karnak", away: "team-manshiya" },
    { matchId: "lg-m2", home: "team-abrag", away: "team-montazah" },
    { matchId: "lg-m3", home: "team-sidibishr", away: "team-agamy" },
    { matchId: "cl-a1", home: "team-karnak", away: "team-rashtin" },
    { matchId: "cl-b4", home: "team-montazah", away: "team-sidibishr" },
  ];

  for (const sm of squadMatches) {
    await createMatchSquad(sm.matchId, sm.home, "CONFIRMED", 11);
    await createMatchSquad(sm.matchId, sm.away, "CONFIRMED", 11);
  }

  const partialMatch = { matchId: "lg-m4", home: "team-borg", away: "team-smouha" };
  await createMatchSquad(partialMatch.matchId, partialMatch.home, "PENDING", 10);
  await createMatchSquad(partialMatch.matchId, partialMatch.away, "CONFIRMED", 11);

  // ======================================================================
  // Summary
  // ======================================================================

  const totalPlayers = PLAYER_SEEDS.length;
  const totalMatches = leagueMatches.length + 1 + leagueUpcoming.length + cupMatches.length + clMatches.length + 2;
  const totalEvents = leagueGoals.reduce((s, g) => s + g.count, 0) + cupGoals.reduce((s, g) => s + g.count, 0) + clGoals.reduce((s, g) => s + g.count, 0);

  const totalSquads = await prisma.matchSquad.count();
  const totalSquadPlayers = await prisma.matchSquadPlayer.count();

  console.log(
    `Seed complete:\n` +
    `  3 tournaments (league, cup, champions league)\n` +
    `  ${TEAM_SEEDS.length} teams (with logos)\n` +
    `  ${totalPlayers} players (with photos)\n` +
    `  ${totalMatches} matches\n` +
    `  ${totalEvents} goal events\n` +
    `  ${totalSquads} match squads (${totalSquadPlayers} squad players)`,
  );
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
