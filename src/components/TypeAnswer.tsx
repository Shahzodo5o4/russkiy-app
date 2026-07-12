import { useEffect, useRef, useState, type ReactNode } from 'react';
import StressedText from './StressedText';
import { softEqual } from '../lib/normalize';
import { speak } from '../audio/tts';

type Props = {
  /** To'g'ri javob (urg'usiz solishtiriladi) */
  expected: string;
  /** Ko'rsatish uchun urg'uli varianti */
  expectedStressed: string;
  onResult: (correct: boolean) => void;
  /** Natija ko'rsatilgach «Keyingi» bosilganda (afterSlot bo'lmasa) */
  onNext?: () => void;
  /** Natijadan keyin «Keyingi» o'rniga ko'rsatiladigan blok (masalan SRS baholari) */
  afterSlot?: ReactNode;
};

/** Ruscha javob yozish: input + virtual kirill klaviatura + yumshoq tekshiruv. */
export default function TypeAnswer({
  expected, expectedStressed, onResult, onNext, afterSlot,
}: Props) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function submit() {
    if (result !== null || !value.trim()) return;
    const ok = softEqual(value, expected);
    setResult(ok);
    onResult(ok);
    speak(expected, 0.9);
  }

  return (
    <div className="grid gap-3">
      <input
        ref={inputRef}
        className={`w-full rounded border px-3 py-3 text-center font-ru text-lg ${
          result === null ? 'border-grid bg-white'
          : result ? 'border-ok bg-ok/5' : 'border-miss bg-miss/5'
        }`}
        value={value}
        placeholder="ruscha yozing…"
        onChange={(e) => result === null && setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (result === null) submit();
            else onNext?.();
          }
        }}
      />

      {result === null ? (
        <button
          onClick={submit}
          disabled={!value.trim()}
          className="rounded bg-ink py-2.5 font-medium text-paper disabled:opacity-40"
        >
          Tekshirish
        </button>
      ) : (
        <div className="grid gap-3 text-center">
          <p className={result ? 'text-ok' : 'text-miss'}>
            {result ? "To'g'ri! ✓" : "Noto'g'ri"}
          </p>
          <p className="font-ru text-xl">
            <StressedText text={expectedStressed} />
          </p>
          {afterSlot ?? (
            <button
              onClick={onNext}
              className="rounded bg-ink py-2.5 font-medium text-paper"
            >
              Keyingi (Enter)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
