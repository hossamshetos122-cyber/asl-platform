export interface SlotDef {
  key: string;
  label: string;
}

export interface BandDef {
  band: number; // 0 = GK (bottom), higher = more attacking
  slots: SlotDef[];
}

export interface FormationDef {
  key: string;
  bands: BandDef[];
}

const SLOT_LABELS: Record<string, string> = {
  GK: "حارس المرمى",
  LB: "ظهير أيسر",
  RB: "ظهير أيمن",
  CB1: "قلب دفاع أول",
  CB2: "قلب دفاع ثاني",
  CB3: "قلب دفاع ثالث",
  LM: "جناح أيسر",
  RM: "جناح أيمن",
  LW: "جناح هجومي أيسر",
  RW: "جناح هجومي أيمن",
  CDM: "وسط مدافع",
  CDM1: "وسط مدافع أول",
  CDM2: "وسط مدافع ثاني",
  CM: "وسط ميدان",
  CM1: "وسط ميدان أول",
  CM2: "وسط ميدان ثاني",
  CM3: "وسط ميدان ثالث",
  CAM: "وسط هجومي",
  ST: "رأس حربة",
  ST1: "مهاجم أول",
  ST2: "مهاجم ثاني",
};

function band(band: number, keys: string[]): BandDef {
  return { band, slots: keys.map((key) => ({ key, label: SLOT_LABELS[key] ?? key })) };
}

export const FORMATIONS: FormationDef[] = [
  {
    key: "4-4-2",
    bands: [
      band(0, ["GK"]),
      band(1, ["LB", "CB1", "CB2", "RB"]),
      band(2, ["LM", "CM1", "CM2", "RM"]),
      band(3, ["ST1", "ST2"]),
    ],
  },
  {
    key: "4-3-3",
    bands: [
      band(0, ["GK"]),
      band(1, ["LB", "CB1", "CB2", "RB"]),
      band(2, ["CDM", "CM", "CAM"]),
      band(3, ["LW", "ST", "RW"]),
    ],
  },
  {
    key: "3-5-2",
    bands: [
      band(0, ["GK"]),
      band(1, ["CB1", "CB2", "CB3"]),
      band(2, ["LM", "CDM", "CM", "CAM", "RM"]),
      band(3, ["ST1", "ST2"]),
    ],
  },
  {
    key: "4-2-3-1",
    bands: [
      band(0, ["GK"]),
      band(1, ["LB", "CB1", "CB2", "RB"]),
      band(2, ["CDM1", "CDM2"]),
      band(3, ["LW", "CAM", "RW"]),
      band(4, ["ST"]),
    ],
  },
  {
    key: "3-4-3",
    bands: [
      band(0, ["GK"]),
      band(1, ["CB1", "CB2", "CB3"]),
      band(2, ["LM", "CM1", "CM2", "RM"]),
      band(3, ["LW", "ST", "RW"]),
    ],
  },
  {
    key: "5-3-2",
    bands: [
      band(0, ["GK"]),
      band(1, ["LB", "CB1", "CB2", "CB3", "RB"]),
      band(2, ["CM1", "CM2", "CM3"]),
      band(3, ["ST1", "ST2"]),
    ],
  },
];

export const DEFAULT_FORMATION = "4-4-2";

export function getFormationRowCount(formation: string): number {
  const def = FORMATIONS.find((f) => f.key === formation);
  return def ? Math.max(...def.bands.map((b) => b.band)) + 1 : 4;
}

/** All slots in pitch order (GK first), with their band index. */
export function getFormationSlots(formation: string): { key: string; label: string; band: number }[] {
  const def = FORMATIONS.find((f) => f.key === formation);
  if (!def) return getFormationSlots(DEFAULT_FORMATION);
  return def.bands.flatMap((b) => b.slots.map((s) => ({ key: s.key, label: s.label, band: b.band })));
}