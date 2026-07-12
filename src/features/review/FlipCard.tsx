import StressedText from '../../components/StressedText';
import { speak } from '../../audio/tts';
import type { Word } from '../../types';

type Props = {
  word: Word;
  flipped: boolean;
  onFlip: () => void;
};

/** RU→UZ karta: oldi — ruscha (urg'u bilan) + 🔊, orqasi — tarjima + misol. */
export default function FlipCard({ word, flipped, onFlip }: Props) {
  return (
    <button
      onClick={onFlip}
      className="w-full rounded border border-grid bg-white px-4 py-10 text-center transition-transform duration-200"
      style={{ transform: flipped ? 'rotateX(360deg)' : 'none' }}
    >
      {!flipped ? (
        <div className="grid gap-3">
          <span className="font-ru text-2xl">
            <StressedText text={word.ruStressed} />
          </span>
          <span
            role="button"
            tabIndex={0}
            className="mx-auto rounded border border-grid px-4 py-1.5 text-lg"
            onClick={(e) => { e.stopPropagation(); speak(word.ru, 0.9); }}
          >
            🔊
          </span>
          <span className="text-sm text-muted">ochish — Space yoki bosing</span>
        </div>
      ) : (
        <div className="grid gap-2">
          <span className="font-ru text-lg text-muted">
            <StressedText text={word.ruStressed} />
          </span>
          <span className="text-xl font-semibold">{word.uz}</span>
          {word.gender && (
            <span className="text-sm text-muted">
              jinsi: {word.gender}{word.plural ? ` · ko'plik: ${word.plural}` : ''}
            </span>
          )}
          {word.exampleRu && (
            <span className="ru-text mt-1">
              <StressedText text={word.exampleRu} />
              <span
                role="button"
                tabIndex={0}
                className="ml-2 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); speak(word.exampleRu ?? ''); }}
              >
                🔊
              </span>
            </span>
          )}
          {word.exampleUz && (
            <span className="text-sm text-muted">{word.exampleUz}</span>
          )}
        </div>
      )}
    </button>
  );
}
