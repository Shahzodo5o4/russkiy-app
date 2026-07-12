import { storage } from '../storage';
import { freshCard } from './sm2';
import { endOfToday } from '../lib/date';
import type { CardState, Word } from '../types';

export type ReviewItem = {
  card: CardState;
  word: Word;
  isNew: boolean; // birinchi marta ko'rsatilayotgan so'z
};

export const DEFAULT_NEW_LIMIT = 15;
export const DEFAULT_REVIEW_LIMIT = 100;

/**
 * Kunlik navbat: avval muddati kelgan kartalar (takrorlash),
 * keyin yangi so'zlar (ru2uz, limit bilan).
 */
export async function buildQueue(profileId: string): Promise<{
  items: ReviewItem[];
  uz2ruExists: Set<string>; // wordId'lar — uz2ru kartasi allaqachon bor
}> {
  const [newLimit, reviewLimit] = await Promise.all([
    storage.getSetting<number>('newLimit'),
    storage.getSetting<number>('reviewLimit'),
  ]);

  const [due, states, words] = await Promise.all([
    storage.getDueCards(profileId, endOfToday(), reviewLimit ?? DEFAULT_REVIEW_LIMIT),
    storage.getCardStates(profileId),
    storage.getWords(),
  ]);

  const wordMap = new Map(words.map((w) => [w.id, w]));

  const reviewItems: ReviewItem[] = due
    .filter((c) => wordMap.has(c.wordId))
    .map((c) => ({ card: c, word: wordMap.get(c.wordId)!, isNew: false }));

  // Yangi so'zlar — hali ru2uz kartasi ochilmaganlar
  const hasRu2uz = new Set(
    states.filter((s) => s.direction === 'ru2uz').map((s) => s.wordId),
  );
  const uz2ruExists = new Set(
    states.filter((s) => s.direction === 'uz2ru').map((s) => s.wordId),
  );

  const newItems: ReviewItem[] = words
    .filter((w) => !hasRu2uz.has(w.id))
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, newLimit ?? DEFAULT_NEW_LIMIT)
    .map((w) => ({
      card: freshCard(profileId, w.id, 'ru2uz'),
      word: w,
      isNew: true,
    }));

  return { items: [...reviewItems, ...newItems], uz2ruExists };
}
