import { useCallback, useEffect, useRef, useState } from 'react';
import { storage } from '../storage';
import { buildQueue, type ReviewItem } from '../srs/queue';
import { freshCard, sm2, type Quality } from '../srs/sm2';
import { dateKey } from '../lib/date';

type Phase = 'loading' | 'active' | 'done' | 'empty';

/** Xato karta nechta kartadan keyin qayta chiqadi (Anki learning-step uslubi). */
const RELEARN_GAP = 4;

/** SRS sessiyasi: navbat, baholash, learning queue, kunlik statistika. */
export function useReviewSession(profileId: string) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [reviewed, setReviewed] = useState(0);
  const [correct, setCorrect] = useState(0);
  const uz2ruRef = useRef<Set<string>>(new Set());
  const statSaved = useRef(false);

  useEffect(() => {
    let alive = true;
    buildQueue(profileId).then(({ items: q, uz2ruExists }) => {
      if (!alive) return;
      uz2ruRef.current = uz2ruExists;
      setItems(q);
      setPhase(q.length === 0 ? 'empty' : 'active');
    });
    return () => { alive = false; };
  }, [profileId]);

  const finish = useCallback(async (r: number, c: number) => {
    setPhase('done');
    if (statSaved.current) return;
    statSaved.current = true;
    const date = dateKey();
    const prev = await storage.getDailyStat(profileId, date);
    await storage.saveDailyStat({
      profileId,
      date,
      cardsReviewed: (prev?.cardsReviewed ?? 0) + r,
      correct: (prev?.correct ?? 0) + c,
      minutesStudied: prev?.minutesStudied ?? 0,
      blocksDone: prev?.blocksDone ?? 0,
    });
  }, [profileId]);

  const grade = useCallback(
    async (quality: Quality) => {
      const item = items[index];
      if (!item) return;

      const updated = sm2(item.card, quality);
      await storage.saveCardState(updated);

      // uz2ru kartasini ochish: ru2uz birinchi marta "Yaxshi"+ bo'lganda
      if (
        item.card.direction === 'ru2uz' &&
        quality >= 4 &&
        !uz2ruRef.current.has(item.word.id)
      ) {
        uz2ruRef.current.add(item.word.id);
        await storage.saveCardState(freshCard(profileId, item.word.id, 'uz2ru'));
      }

      const r = reviewed + 1;
      const c = correct + (quality >= 3 ? 1 : 0);
      setReviewed(r);
      setCorrect(c);

      let next = items;
      if (quality < 3) {
        // learning queue — bir necha kartadan keyin qayta chiqadi,
        // to'g'ri javob berilmaguncha sessiya tugamaydi
        const at = Math.min(index + 1 + RELEARN_GAP, items.length);
        next = [...items];
        next.splice(at, 0, { ...item, card: updated, isNew: false, relearn: true });
        setItems(next);
      }

      if (index + 1 >= next.length) void finish(r, c);
      else setIndex(index + 1);
    },
    [items, index, reviewed, correct, profileId, finish],
  );

  return {
    phase,
    current: items[index],
    index,
    total: items.length,
    reviewed,
    correct,
    grade,
  };
}
