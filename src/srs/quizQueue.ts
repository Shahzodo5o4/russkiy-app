import { storage } from '../storage';
import { endOfToday } from '../lib/date';
import type { QuizQuestion, QuizState } from '../types';

export type QuizReviewItem = {
  state: QuizState;
  question: QuizQuestion;
};

export const DEFAULT_QUIZ_REVIEW_LIMIT = 20;

/** Yangi grammatika savoli — boshlang'ich SM-2 holati. */
export function freshQuizState(profileId: string, questionId: string): QuizState {
  return {
    id: `${profileId}:${questionId}`,
    profileId,
    questionId,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    dueAt: Date.now(),
    lapses: 0,
  };
}

/**
 * Grammatika takrorlash navbati: muddati kelgan savollar.
 * Savol bankka DARS TESTI orqali tushadi (birinchi urinish — testning o'zi),
 * shuning uchun bu yerda «yangi» oqimi yo'q.
 */
export async function buildQuizQueue(profileId: string): Promise<QuizReviewItem[]> {
  const limit =
    (await storage.getSetting<number>('quizReviewLimit')) ?? DEFAULT_QUIZ_REVIEW_LIMIT;
  const [due, questions] = await Promise.all([
    storage.getDueQuizStates(profileId, endOfToday(), limit),
    storage.getQuizQuestions(),
  ]);
  const qMap = new Map(questions.map((q) => [q.id, q]));
  return due
    .filter((s) => qMap.has(s.questionId))
    .map((s) => ({ state: s, question: qMap.get(s.questionId)! }));
}
