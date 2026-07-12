import type { CardState } from '../types';

/** Baholash: 0 = Yana, 3 = Qiyin, 4 = Yaxshi, 5 = Oson */
export type Quality = 0 | 3 | 4 | 5;

const DAY_MS = 24 * 60 * 60 * 1000;

/** SM-2 — spetsifikatsiya 5-bo'limdagi algoritm AYNAN. */
export function sm2(card: CardState, quality: Quality): CardState {
  let { ease, interval, repetitions, lapses } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 0; // shu sessiya ichida qayta ko'rsatiladi
    lapses += 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * ease);
  }

  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;

  const dueAt = Date.now() + interval * DAY_MS;
  return { ...card, ease, interval, repetitions, lapses, dueAt };
}

/** Yangi karta — boshlang'ich holat. */
export function freshCard(
  profileId: string,
  wordId: string,
  direction: 'ru2uz' | 'uz2ru',
): CardState {
  return {
    id: `${profileId}:${wordId}:${direction}`,
    profileId,
    wordId,
    direction,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    dueAt: Date.now(),
    lapses: 0,
  };
}
