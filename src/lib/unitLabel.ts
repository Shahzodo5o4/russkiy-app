import type { Unit } from '../types';

/**
 * Dars raqamlari. `unit.order` — faqat ichki saralash kaliti (imtihon darvozasi,
 * import tartibi). Foydalanuvchiga esa har level ichida boshdan raqamlanadi:
 * A1-1 … A1-10, A2-1 … Takrorlash darslari umuman raqamlanmaydi, aks holda
 * ular oraliqni surib yuboradi (ilgari 11 = Повторение bo'lib, u11 «12» bo'lgan).
 */

/** Takrorlash (повторение) darsimi? id "r" bilan boshlanadi yoki sarlavhada Повтор. */
export function isRepeatUnit(u: Pick<Unit, 'id' | 'title'>): boolean {
  return /^r\d/i.test(u.id) || /повтор/i.test(u.title);
}

export type UnitLabel = {
  /** "A1-3" yoki takrorlash uchun null */
  num: string | null;
  /** Ro'yxat/sarlavha uchun qisqa belgi: "A1-3" yoki "A1 · Takror" */
  badge: string;
};

/** Butun ro'yxat asosida id → yorliq xaritasi. */
export function unitLabels(units: Unit[]): Map<string, UnitLabel> {
  const sorted = [...units].sort(
    (a, b) => a.order - b.order || a.id.localeCompare(b.id),
  );
  const seen = new Map<string, number>();
  const out = new Map<string, UnitLabel>();
  for (const u of sorted) {
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
