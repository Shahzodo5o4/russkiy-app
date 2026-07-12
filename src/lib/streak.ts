import { dateKey } from './date';
import type { DailyStat } from '../types';

/** Kun "faol" hisoblanadi: kartochka takrorlangan yoki blok bajarilgan. */
function isActive(s: DailyStat): boolean {
  return s.cardsReviewed > 0 || s.blocksDone > 0;
}

/**
 * Seriya: bugungacha (yoki kechagacha, bugun hali boshlanmagan bo'lsa)
 * uzluksiz faol kunlar soni.
 */
export function computeStreak(stats: DailyStat[]): number {
  const active = new Set(stats.filter(isActive).map((s) => s.date));
  const d = new Date();
  if (!active.has(dateKey(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (active.has(dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
