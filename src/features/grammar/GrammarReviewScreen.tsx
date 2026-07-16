import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../../storage';
import { useProfile } from '../../store/ProfileContext';
import { sm2 } from '../../srs/sm2';
import { buildQuizQueue, type QuizReviewItem } from '../../srs/quizQueue';
import { dateKey } from '../../lib/date';
import QuestionCard from './QuestionCard';
import EmptyState from '../../components/EmptyState';

type Phase = 'loading' | 'active' | 'done' | 'empty';

/** Grammatika takrorlash — SRS bankidan muddati kelgan savollar. */
export default function GrammarReviewScreen() {
  const { profile } = useProfile();
  const [items, setItems] = useState<QuizReviewItem[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const correctRef = useRef(0);
  const lastCorrect = useRef(false);
  const statSaved = useRef(false);

  useEffect(() => {
    let alive = true;
    void buildQuizQueue(profile.id).then((q) => {
      if (!alive) return;
      setItems(q);
      setPhase(q.length === 0 ? 'empty' : 'active');
    });
    return () => { alive = false; };
  }, [profile.id]);

  async function answer(ok: boolean) {
    const item = items[index];
    lastCorrect.current = ok;
    correctRef.current += ok ? 1 : 0;
    await storage.saveQuizState(sm2(item.state, ok ? 4 : 0));
  }

  async function next() {
    let queue = items;
    if (!lastCorrect.current) {
      // xato — sessiya oxirida yana chiqadi
      queue = [...items, items[index]];
      setItems(queue);
    }
    if (index + 1 >= queue.length) {
      setPhase('done');
      if (!statSaved.current) {
        statSaved.current = true;
        const date = dateKey();
        const prev = await storage.getDailyStat(profile.id, date);
        await storage.saveDailyStat({
          profileId: profile.id, date,
          cardsReviewed: (prev?.cardsReviewed ?? 0) + queue.length,
          correct: (prev?.correct ?? 0) + correctRef.current,
          minutesStudied: prev?.minutesStudied ?? 0,
          blocksDone: prev?.blocksDone ?? 0,
        });
      }
    } else setIndex(index + 1);
  }

  if (phase === 'loading') return <p className="text-muted">Yuklanmoqda…</p>;

  if (phase === 'empty') {
    return <EmptyState message="Bugun grammatika takrorlash yo'q. Savollar dars testi orqali bankka tushadi." />;
  }

  if (phase === 'done') {
    return (
      <div className="mx-auto grid max-w-md gap-4 text-center">
        <h1 className="text-xl font-semibold">Grammatika tugadi ✓</h1>
        <p className="text-muted">Xato qilingan savollar ertaga yana chiqadi.</p>
        <Link to="/" className="rounded bg-ink py-2.5 font-medium text-paper">
          Bugungi rejaga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-3 text-sm text-muted">
        Grammatika · {index + 1} / {items.length}
      </p>
      <QuestionCard
        key={`${items[index].question.id}:${index}`}
        question={items[index].question}
        onAnswer={(ok) => void answer(ok)}
        onNext={() => void next()}
      />
    </div>
  );
}
