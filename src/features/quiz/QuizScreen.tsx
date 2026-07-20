import { useMemo, useState } from 'react';
import Screen from '../../components/Screen';
import StressedText from '../../components/StressedText';
import { storage } from '../../storage';
import { useAsync } from '../../hooks/useAsync';
import { shuffle } from '../../lib/shuffle';
import { unitLabels, sortUnits } from '../../lib/unitLabel';
import QuizRunner from './QuizRunner';
import type { QuizMode, QuizResult } from './types';
import type { Word } from '../../types';

const MODES: { id: QuizMode; label: string; hint: string }[] = [
  { id: 'ru2uz', label: 'RU → UZ', hint: '4 variantdan tanlash' },
  { id: 'uz2ru', label: 'UZ → RU', hint: 'ruscha yozish' },
  { id: 'dictation', label: 'Diktant', hint: 'eshitib yozish' },
];

/** Test rejimi (spec 4.3). Sherik bilan bir-birini tekshirish uchun ham qulay. */
export default function QuizScreen() {
  const data = useAsync(
    () => Promise.all([storage.getWords(), storage.getUnits(), storage.getDecks()]),
    [],
  );
  const [mode, setMode] = useState<QuizMode>('ru2uz');
  const [unitId, setUnitId] = useState('');
  const [deckId, setDeckId] = useState('');
  const [count, setCount] = useState(10);
  const [stage, setStage] = useState<'setup' | 'run' | 'done'>('setup');
  const [questions, setQuestions] = useState<Word[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);

  const [words, units, decks] = data.data ?? [[], [], []];
  const labels = useMemo(() => unitLabels(units), [units]);
  const sortedUnits = useMemo(() => sortUnits(units), [units]);

  const pool = useMemo(
    () => words
      .filter((w) => !unitId || w.unitId === unitId)
      .filter((w) => !deckId || w.deckIds.includes(deckId)),
    [words, unitId, deckId],
  );

  if (data.loading) return <p className="text-muted">Yuklanmoqda…</p>;

  if (stage === 'run') {
    return (
      <div className="mx-auto max-w-md">
        <QuizRunner
          mode={mode}
          words={questions}
          pool={words}
          onDone={(r) => { setResults(r); setStage('done'); }}
        />
      </div>
    );
  }

  if (stage === 'done') {
    const ok = results.filter((r) => r.correct).length;
    const mistakes = results.filter((r) => !r.correct);
    return (
      <div className="mx-auto grid max-w-md gap-4">
        <h1 className="text-center text-xl font-semibold">
          Natija: {ok} / {results.length}
        </h1>
        {mistakes.length > 0 && (
          <div className="rounded border border-grid bg-white p-4">
            <h2 className="text-sm font-medium text-miss">Xatolar:</h2>
            <ul className="mt-2 grid gap-1">
              {mistakes.map((m) => (
                <li key={m.word.id} className="flex justify-between">
                  <span className="font-ru"><StressedText text={m.word.ruStressed} /></span>
                  <span className="text-muted">{m.word.uz}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button onClick={() => setStage('setup')}
          className="rounded bg-ink py-2.5 font-medium text-paper">
          Yana bir test
        </button>
      </div>
    );
  }

  return (
    <Screen title="Test" subtitle="Rejimni tanlang va boshlang">
      <div className="grid gap-2">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`rounded border-2 bg-white px-4 py-3 text-left ${
              mode === m.id ? 'border-ink' : 'border-grid'
            }`}>
            <span className="font-medium">{m.label}</span>
            <span className="ml-2 text-sm text-muted">{m.hint}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <select className="rounded border border-grid bg-white px-2 py-2 text-sm"
          value={unitId} onChange={(e) => setUnitId(e.target.value)}>
          <option value="">Barcha darslar</option>
          {sortedUnits.map((u) => (
            <option key={u.id} value={u.id}>{labels.get(u.id)?.badge} · {u.title}</option>
          ))}
        </select>
        <select className="rounded border border-grid bg-white px-2 py-2 text-sm"
          value={deckId} onChange={(e) => setDeckId(e.target.value)}>
          <option value="">Barcha to'plamlar</option>
          {decks.map((d) => (
            <option key={d.id} value={d.id}>{d.icon} {d.title}</option>
          ))}
        </select>
        <select className="rounded border border-grid bg-white px-2 py-2 text-sm"
          value={count} onChange={(e) => setCount(Number(e.target.value))}>
          <option value={10}>10 ta savol</option>
          <option value={20}>20 ta savol</option>
          <option value={9999}>Hammasi</option>
        </select>
      </div>

      <p className="mt-2 text-sm text-muted">{pool.length} ta so'z mavjud</p>

      <button
        disabled={pool.length < (mode === 'ru2uz' ? 4 : 1)}
        onClick={() => {
          setQuestions(shuffle(pool).slice(0, count));
          setStage('run');
        }}
        className="mt-3 w-full rounded bg-ink py-2.5 font-medium text-paper disabled:opacity-40"
      >
        Boshlash
      </button>
    </Screen>
  );
}
