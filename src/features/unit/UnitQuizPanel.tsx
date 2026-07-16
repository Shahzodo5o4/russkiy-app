import { useEffect, useRef, useState } from 'react';
import { storage } from '../../storage';
import { useProfile } from '../../store/ProfileContext';
import { sm2 } from '../../srs/sm2';
import { freshQuizState } from '../../srs/quizQueue';
import { shuffle } from '../../lib/shuffle';
import QuestionCard from '../grammar/QuestionCard';
import type { QuizQuestion, QuizState } from '../../types';

type Stage = 'idle' | 'run' | 'done';

/**
 * Dars testi: darsning grammatika savollari. Har javob SM-2 bilan baholanadi —
 * savollar shu orqali takrorlash bankiga tushadi (xatolar bugunoq qaytadi).
 */
export default function UnitQuizPanel({ unitId }: { unitId: string }) {
  const { profile } = useProfile();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [states, setStates] = useState<Map<string, QuizState>>(new Map());
  const [stage, setStage] = useState<Stage>('idle');
  const [order, setOrder] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<QuizQuestion[]>([]);
  const lastOk = useRef(false);

  useEffect(() => {
    void Promise.all([
      storage.getQuizQuestionsByUnit(unitId),
      storage.getQuizStates(profile.id),
    ]).then(([qs, sts]) => {
      // imtihon zaxirasi (exam=true) dars testida chiqmaydi
      setQuestions(qs.filter((q) => !q.exam));
      setStates(new Map(sts.map((s) => [s.questionId, s])));
    });
  }, [unitId, profile.id]);

  if (questions.length === 0) return null;

  const inBank = questions.filter((q) => states.has(q.id)).length;

  async function answer(ok: boolean) {
    const q = order[index];
    lastOk.current = ok;
    if (!ok) setWrong((w) => [...w, q]);
    const prev = states.get(q.id) ?? freshQuizState(profile.id, q.id);
    const updated = sm2(prev, ok ? 4 : 0);
    setStates((m) => new Map(m).set(q.id, updated));
    await storage.saveQuizState(updated);
  }

  function next() {
    if (index + 1 >= order.length) setStage('done');
    else setIndex(index + 1);
  }

  if (stage === 'run') {
    return (
      <div className="rounded border border-grid bg-white p-4">
        <p className="mb-3 text-sm text-muted">📝 Dars testi · {index + 1} / {order.length}</p>
        <QuestionCard
          key={order[index].id}
          question={order[index]}
          onAnswer={(ok) => void answer(ok)}
          onNext={next}
        />
      </div>
    );
  }

  if (stage === 'done') {
    const ok = order.length - wrong.length;
    return (
      <div className="rounded border border-grid bg-white p-4">
        <h3 className="font-medium">📝 Dars testi: {ok} / {order.length}</h3>
        <p className="mt-1 text-sm text-muted">
          Savollar takrorlash bankiga tushdi — xatolar «Grammatika» bo'limida bugunoq qaytadi,
          to'g'rilari esa intervalli ravishda.
        </p>
        <button
          onClick={() => { setStage('idle'); setWrong([]); setIndex(0); }}
          className="mt-3 rounded border border-grid px-4 py-2 text-sm"
        >
          Yopish
        </button>
      </div>
    );
  }

  return (
    <div className="rounded border border-grid bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">📝 Dars testi</h3>
        <span className="text-sm text-muted">
          {questions.length} savol{inBank > 0 && ` · ${inBank} tasi bankda`}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Grammatikani mustahkamlash: variantni tanlang, xatolar takrorlash bankiga tushadi.
      </p>
      <button
        onClick={() => { setOrder(shuffle(questions)); setIndex(0); setWrong([]); setStage('run'); }}
        className="mt-3 w-full rounded bg-ink py-2.5 font-medium text-paper"
      >
        {inBank === questions.length ? 'Qayta ishlash' : 'Boshlash'}
      </button>
    </div>
  );
}
