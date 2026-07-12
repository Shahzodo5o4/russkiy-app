import { useEffect, useMemo, useState } from 'react';
import StressedText from '../../components/StressedText';
import TypeAnswer from '../../components/TypeAnswer';
import { speak } from '../../audio/tts';
import { shuffle } from '../../lib/shuffle';
import type { Word } from '../../types';
import type { QuizMode, QuizResult } from './types';

type Props = {
  mode: QuizMode;
  words: Word[];      // savollar (allaqachon aralashtirilib kesilgan)
  pool: Word[];       // chalg'ituvchi variantlar manbai
  onDone: (results: QuizResult[]) => void;
};

/** Bitta test sessiyasi: savolma-savol. */
export default function QuizRunner({ mode, words, pool, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [picked, setPicked] = useState<string | null>(null);

  const word = words[idx];

  // RU→UZ variantlari
  const options = useMemo(() => {
    if (mode !== 'ru2uz' || !word) return [];
    const others = shuffle(pool.filter((w) => w.id !== word.id && w.uz !== word.uz))
      .slice(0, 3)
      .map((w) => w.uz);
    return shuffle([word.uz, ...others]);
  }, [mode, word, pool]);

  // Diktant: so'zni avto o'qish
  useEffect(() => {
    if (mode === 'dictation' && word) speak(word.ru, 0.85);
  }, [mode, word]);

  if (!word) return null;

  function record(correct: boolean, next = false) {
    const r = [...results, { word, correct }];
    setResults(r);
    if (next) advance(r);
  }

  function advance(r: QuizResult[]) {
    setPicked(null);
    if (idx + 1 >= words.length) onDone(r);
    else setIdx(idx + 1);
  }

  const header = (
    <p className="text-sm text-muted">{idx + 1} / {words.length}</p>
  );

  if (mode === 'ru2uz') {
    return (
      <div className="grid gap-4">
        {header}
        <div className="rounded border border-grid bg-white px-4 py-8 text-center">
          <span className="font-ru text-2xl"><StressedText text={word.ruStressed} /></span>
          <button className="ml-3 text-lg" onClick={() => speak(word.ru, 0.9)}>🔊</button>
        </div>
        <div className="grid gap-2">
          {options.map((opt) => {
            const state =
              picked === null ? '' :
              opt === word.uz ? 'border-ok bg-ok/5' :
              opt === picked ? 'border-miss bg-miss/5' : 'opacity-50';
            return (
              <button
                key={opt}
                disabled={picked !== null}
                onClick={() => { setPicked(opt); record(opt === word.uz); }}
                className={`rounded border-2 border-grid bg-white px-3 py-2.5 text-left ${state}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <button onClick={() => advance(results)}
            className="rounded bg-ink py-2.5 font-medium text-paper">
            Keyingi
          </button>
        )}
      </div>
    );
  }

  // uz2ru (yozish) va diktant — TypeAnswer bilan
  return (
    <div className="grid gap-4">
      {header}
      <div className="rounded border border-grid bg-white px-4 py-8 text-center">
        {mode === 'uz2ru' ? (
          <>
            <p className="text-sm text-muted">ruschasini yozing:</p>
            <p className="mt-1 text-xl font-semibold">{word.uz}</p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">eshitganingizni yozing:</p>
            <button className="mt-2 rounded border border-grid px-6 py-2 text-xl"
              onClick={() => speak(word.ru, 0.85)}>
              🔊 qayta eshitish
            </button>
          </>
        )}
      </div>
      <TypeAnswer
        key={word.id}
        expected={word.ru}
        expectedStressed={word.ruStressed}
        onResult={(ok) => record(ok)}
        onNext={() => advance(results)}
      />
    </div>
  );
}
