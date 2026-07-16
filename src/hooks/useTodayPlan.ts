import { useCallback, useEffect, useState } from 'react';
import { storage } from '../storage';
import { dateKey, endOfToday } from '../lib/date';
import { computeStreak } from '../lib/streak';
import { DEFAULT_NEW_LIMIT, DEFAULT_REVIEW_LIMIT, isUnlockedAsNew } from '../srs/queue';
import type { Block, Unit } from '../types';

export type TodayPlan = {
  streak: number;
  due: number;
  fresh: number;
  grammarDue: number; // muddati kelgan grammatika savollari
  examSuggest: boolean; // imtihon vaqti keldi (oxirgi imtihondan beri N dars tugadi)
  examNew: number; // oxirgi imtihondan beri tugatilgan darslar soni
  unit: Unit | null;          // joriy dars (QO'LDA tanlanadi)
  units: Unit[];
  blocks: Block[];
  blocksDone: string[];
  reviewedToday: number;
};

/** «Bugun» reja logikasi (PLAN.md psevdokodi). Joriy dars — qo'lda pin. */
export function useTodayPlan(profileId: string) {
  const [plan, setPlan] = useState<TodayPlan | null>(null);

  const load = useCallback(async () => {
    const [units, dueCards, states, words, stats, progress, dueQuiz] = await Promise.all([
      storage.getUnits(),
      storage.getDueCards(profileId, endOfToday(), DEFAULT_REVIEW_LIMIT),
      storage.getCardStates(profileId),
      storage.getWords(),
      storage.getDailyStats(profileId),
      storage.listUnitProgress(profileId),
      storage.getDueQuizStates(profileId, endOfToday(), 999),
    ]);

    // Joriy dars: settings'dan; bo'lmasa — birinchi "ready" unit
    const pinned = await storage.getSetting<string>(`currentUnit:${profileId}`);
    const unit =
      units.find((u) => u.id === pinned) ??
      units.find((u) => u.status === 'ready') ??
      null;

    const started = new Set(
      states.filter((s) => s.direction === 'ru2uz').map((s) => s.wordId),
    );
    // Yangi so'z faqat tugatilgan darsdan (yoki darssiz qo'lda qo'shilgan)
    const finishedUnits = new Set(
      progress.filter((p) => p.state === 'tugadi').map((p) => p.unitId),
    );
    const fresh = Math.min(
      words.filter((w) => !started.has(w.id) && isUnlockedAsNew(w, finishedUnits)).length,
      DEFAULT_NEW_LIMIT,
    );

    let blocks: Block[] = [];
    let blocksDone: string[] = [];
    if (unit) {
      blocks = await storage.getBlocks(unit.id);
      const prog = await storage.getUnitProgress(profileId, unit.id);
      blocksDone = prog?.blocksDone ?? [];
    }

    const today = stats.find((s) => s.date === dateKey());

    // Imtihon eslatmasi: oxirgi imtihondan beri tugatilgan darslar soni
    // darajaga qarab chegaradan oshsa (A1: 5, A2: 4, B1: 3)
    const finishedCount = finishedUnits.size;
    const checkpoint =
      (await storage.getSetting<number>(`examCheckpoint:${profileId}`)) ?? 0;
    const maxOrder = Math.max(
      0,
      ...progress
        .filter((p) => p.state === 'tugadi')
        .map((p) => units.find((u) => u.id === p.unitId)?.order ?? 0),
    );
    const level = units.find((u) => u.order === maxOrder)?.level ?? 'A1';
    const examEvery = level === 'B1' ? 3 : level === 'A2' ? 4 : 5;
    const examNew = Math.max(0, finishedCount - checkpoint);

    setPlan({
      streak: computeStreak(stats),
      due: dueCards.length,
      fresh,
      grammarDue: dueQuiz.length,
      examSuggest: examNew >= examEvery,
      examNew,
      unit,
      units,
      blocks,
      blocksDone,
      reviewedToday: today?.cardsReviewed ?? 0,
    });
  }, [profileId]);

  useEffect(() => { void load(); }, [load]);

  const pinUnit = useCallback(
    async (unitId: string) => {
      await storage.setSetting(`currentUnit:${profileId}`, unitId);
      await load();
    },
    [profileId, load],
  );

  return { plan, pinUnit };
}
