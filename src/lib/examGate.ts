import type { Unit, UnitProgress } from '../types';

/** Darajaga qarab imtihon oralig'i: nechta tugatilgan dars yig'ilishi kerak. */
export const EXAM_EVERY = { A1: 5, A2: 4, B1: 3 } as const;

export type ExamGate = {
  ready: boolean; // imtihon ochiq
  fresh: number; // oxirgi imtihondan beri tugatilgan darslar
  needed: number; // shu daraja uchun kerakli soni
  remaining: number; // ochilishiga yana nechta dars kerak
};

/**
 * Imtihon qulfi: oxirgi imtihondan (checkpoint) beri kamida N ta dars
 * tugatilgan bo'lishi kerak. N — hozirgi darajaga bog'liq (A1:5, A2:4, B1:3).
 */
export function examGate(
  units: Unit[],
  progress: UnitProgress[],
  checkpoint: number,
): ExamGate {
  const finished = progress.filter((p) => p.state === 'tugadi');
  const maxOrder = Math.max(
    0,
    ...finished.map((p) => units.find((u) => u.id === p.unitId)?.order ?? 0),
  );
  const level = units.find((u) => u.order === maxOrder)?.level ?? 'A1';
  const needed = EXAM_EVERY[level];
  const fresh = Math.max(0, finished.length - checkpoint);
  return {
    ready: fresh >= needed,
    fresh,
    needed,
    remaining: Math.max(0, needed - fresh),
  };
}
