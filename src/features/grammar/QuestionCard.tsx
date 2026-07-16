import { useMemo, useState } from 'react';
import StressedText from '../../components/StressedText';
import { shuffle } from '../../lib/shuffle';
import type { QuizQuestion } from '../../types';

type Props = {
  question: QuizQuestion;
  onAnswer: (correct: boolean) => void; // variant bosilganda 1 marta
  onNext: () => void;
};

const TF_OPTIONS = ["To'g'ri ✓", "Noto'g'ri ✗"];

/** Bitta grammatika savoli: variantlar tugma bilan, javobdan keyin izoh. */
export default function QuestionCard({ question, onAnswer, onNext }: Props) {
  const [picked, setPicked] = useState<number | null>(null);

  // MCQ variantlarini aralashtiramiz, tf — doim To'g'ri/Noto'g'ri tartibida
  const options = useMemo(() => {
    if (question.type === 'tf') {
      return TF_OPTIONS.map((label, source) => ({ label, source }));
    }
    return shuffle(question.options.map((label, source) => ({ label, source })));
  }, [question]);

  const answered = picked !== null;

  function pick(i: number) {
    if (answered) return;
    setPicked(i);
    onAnswer(options[i].source === question.correctIndex);
  }

  return (
    <div className="grid gap-4">
      <div className="rounded border border-grid bg-white px-4 py-6 text-center">
        {question.type === 'tf' && (
          <p className="mb-1 text-sm text-muted">Bu to'g'rimi?</p>
        )}
        <span className="font-ru text-xl">
          <StressedText text={question.prompt} />
        </span>
      </div>

      <div className="grid gap-2">
        {options.map((opt, i) => {
          const state = !answered
            ? ''
            : opt.source === question.correctIndex
              ? 'border-ok bg-ok/5'
              : i === picked
                ? 'border-miss bg-miss/5'
                : 'opacity-50';
          return (
            <button
              key={opt.label}
              disabled={answered}
              onClick={() => pick(i)}
              className={`rounded border-2 border-grid bg-white px-3 py-2.5 text-left font-ru ${state}`}
            >
              <StressedText text={opt.label} />
            </button>
          );
        })}
      </div>

      {answered && (
        <>
          {question.explanation && (
            <p className="rounded border border-grid bg-paper px-3 py-2 text-sm">
              💡 {question.explanation}
            </p>
          )}
          <button
            onClick={onNext}
            className="rounded bg-ink py-2.5 font-medium text-paper"
          >
            Keyingi
          </button>
        </>
      )}
    </div>
  );
}
