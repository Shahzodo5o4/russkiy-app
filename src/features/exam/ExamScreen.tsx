import { useMemo, useState } from 'react';
import Screen from '../../components/Screen';
import { storage } from '../../storage';
import { useProfile } from '../../store/ProfileContext';
import { useAsync } from '../../hooks/useAsync';
import { sm2 } from '../../srs/sm2';
import { freshQuizState } from '../../srs/quizQueue';
import { shuffle } from '../../lib/shuffle';
import QuestionCard from '../grammar/QuestionCard';
import ExamResult from './ExamResult';
import type { QuizQuestion } from '../../types';

type Stage = 'setup' | 'run' | 'done';

/** Har darsdan teng qamrov bilan savol terish (round-robin), keyin aralashtirish. */
function pickBalanced(questions: QuizQuestion[], count: number): QuizQuestion[] {
  const byUnit = new Map<string, QuizQuestion[]>();
  for (const q of questions) {
    byUnit.set(q.unitId, [...(byUnit.get(q.unitId) ?? []), q]);
  }
  const pools = [...byUnit.values()].map((p) => shuffle(p));
  const out: QuizQuestion[] = [];
  let i = 0;
  while (out.length < count && pools.some((p) => p.length > 0)) {
    const pool = pools[i % pools.length];
    const q = pool.pop();
    if (q) out.push(q);
    i += 1;
  }
  return shuffle(out);
}

/** 🎓 Imtihon — umumiy takrorlash: barcha o'tilgan darslar savollaridan aralash test. */
export default function ExamScreen() {
  const { profile } = useProfile();
  const data = useAsync(
    () => Promise.all([storage.getQuizQuestions(), storage.getUnits(), storage.getQuizStates(profile.id)]),
    [profile.id],
  );
  const [count, setCount] = useState(20);
  const [stage, setStage] = useState<Stage>('setup');
  const [order, setOrder] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());

  const [questions, units, states] = data.data ?? [[], [], []];

  // Faqat bankka tushgan (dars testi yechilgan) darslar — hali o'tilmaganlari chiqmaydi
  const startedUnits = useMemo(() => {
    const qUnit = new Map(questions.map((q) => [q.id, q.unitId]));
    return new Set(states.map((s) => qUnit.get(s.questionId)).filter(Boolean));
  }, [states, questions]);
  const pool = useMemo(
    () => questions.filter((q) => startedUnits.has(q.unitId)),
    [questions, startedUnits],
  );

  if (data.loading) return <p className="text-muted">Yuklanmoqda…</p>;

  async function answer(ok: boolean) {
    const q = order[index];
    if (!ok) setWrongIds((w) => new Set(w).add(q.id));
    const prev = states.find((s) => s.questionId === q.id) ?? freshQuizState(profile.id, q.id);
    await storage.saveQuizState(sm2(prev, ok ? 4 : 0));
  }

  if (stage === 'run') {
    return (
      <div className="mx-auto max-w-md">
        <p className="mb-3 text-sm text-muted">🎓 Imtihon · {index + 1} / {order.length}</p>
        <QuestionCard
          key={order[index].id}
          question={order[index]}
          onAnswer={(ok) => void answer(ok)}
          onNext={() => (index + 1 >= order.length ? setStage('done') : setIndex(index + 1))}
        />
      </div>
    );
  }

  if (stage === 'done') {
    return (
      <ExamResult
        order={order}
        wrongIds={wrongIds}
        units={units}
        onRestart={() => { setStage('setup'); setWrongIds(new Set()); setIndex(0); }}
      />
    );
  }

  return (
    <Screen title="🎓 Imtihon" subtitle="Umumiy takrorlash — barcha o'tilgan darslardan aralash savollar">
      <p className="text-sm text-muted">
        Savollar har darsdan teng olinadi. Natijada qaysi mavzu zaifligi ko'rinadi;
        xatolar takrorlash bankida tezlashadi. Tavsiya: A1 yakunida, keyin har 4–5 darsda.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <select className="rounded border border-grid bg-white px-2 py-2 text-sm"
          value={count} onChange={(e) => setCount(Number(e.target.value))}>
          <option value={20}>20 ta savol</option>
          <option value={30}>30 ta savol</option>
          <option value={9999}>Hammasi</option>
        </select>
        <p className="self-center text-sm text-muted">{pool.length} ta savol mavjud</p>
      </div>
      {pool.length === 0 && (
        <p className="mt-3 rounded border border-grid bg-paper px-3 py-2 text-sm">
          Imtihon uchun avval kamida bitta darsning «📝 Dars testi»ni yeching —
          savollar shundan keyin bankka tushadi.
        </p>
      )}
      <button
        disabled={pool.length === 0}
        onClick={() => { setOrder(pickBalanced(pool, count)); setIndex(0); setStage('run'); }}
        className="mt-3 w-full rounded bg-ink py-2.5 font-medium text-paper disabled:opacity-40"
      >
        Boshlash
      </button>
    </Screen>
  );
}
