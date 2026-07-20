import type { Unit } from '../types';

/**
 * Dars raqamlari va tartibi. `unit.order` — faqat ichki saralash kaliti
 * (import tartibi). Foydalanuvchiga esa har level ichida boshdan raqamlanadi:
 * A1-1 … A1-10, A2-1 … Takrorlash (повторение) darslari umuman raqamlanmaydi
 * va doim o'z levelining OXIRIDA turadi.
 *
 * Tartib LEVEL bo'yicha birlamchi — shu bois DB'dagi `order` qiymatlari
 * chalkashib ketsa ham (masalan A1-takror A2 darsdan keyin qolib ketsa),
 * ro'yxat baribir to'g'ri chiqadi.
 */

const LEVEL_RANK: Record<Unit['level'], number> = { A1: 0, A2: 1, B1: 2 };

/** Takrorlash (повторение) darsimi? id "r" bilan boshlanadi yoki sarlavhada Повтор. */
export function isRepeatUnit(u: Pick<Unit, 'id' | 'title'>): boolean {
  return /^r\d/i.test(u.id) || /повтор/i.test(u.title);
}

/** Barcha ro'yxatlar uchun yagona tartib: level → (oddiy darslar order bo'yicha) → takror. */
export function sortUnits(units: Unit[]): Unit[] {
  return [...units].sort((a, b) => {
    const lv = LEVEL_RANK[a.level] - LEVEL_RANK[b.level];
    if (lv !== 0) return lv;
    const ra = isRepeatUnit(a) ? 1 : 0;
    const rb = isRepeatUnit(b) ? 1 : 0;
    if (ra !== rb) return ra - rb; // takror levelning oxirida
    return a.order - b.order || a.id.localeCompare(b.id);
  });
}

export type UnitLabel = {
  /** "A1-3" yoki takrorlash uchun null */
  num: string | null;
  /** Ro'yxat/sarlavha uchun qisqa belgi: "A1-3" yoki "A1 · Takror" */
  badge: string;
};

/** Butun ro'yxat asosida id → yorliq xaritasi. */
export function unitLabels(units: Unit[]): Map<string, UnitLabel> {
  const seen = new Map<string, number>();
  const out = new Map<string, UnitLabel>();
  for (const u of sortUnits(units)) {
    if (isRepeatUnit(u)) {
      out.set(u.id, { num: null, badge: `${u.level} · Takror` });
    } else {
      const n = (seen.get(u.level) ?? 0) + 1;
      seen.set(u.level, n);
      out.set(u.id, { num: `${u.level}-${n}`, badge: `${u.level}-${n}` });
    }
  }
  return out;
}

/** Bitta dars uchun yorliq (ro'yxat qo'lda bo'lganda). */
export function unitBadge(units: Unit[], id: string): string {
  return unitLabels(units).get(id)?.badge ?? '';
}
