import { applyStressAt, RU_VOWELS, stripStress } from '../../lib/stress';
import StressedText from '../../components/StressedText';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

/**
 * Urg'u yordamchisi (spec 4.7): pastdagi harflardan unlini bossangiz —
 * U+0301 qo'shiladi. Natija StressedText bilan ko'rsatiladi.
 */
export default function StressInput({ value, onChange, placeholder }: Props) {
  const clean = stripStress(value);
  const chars = [...clean];

  return (
    <div>
      <input
        className="mt-1 w-full rounded border border-grid bg-white px-3 py-2 font-ru"
        value={value}
        placeholder={placeholder ?? 'молоко'}
        onChange={(e) => onChange(e.target.value)}
      />
      {chars.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className="mr-1 text-sm text-muted">Urg'u:</span>
          {chars.map((ch, i) => {
            const isVowel = RU_VOWELS.includes(ch);
            return (
              <button
                key={i}
                type="button"
                disabled={!isVowel}
                onClick={() => onChange(applyStressAt(value, i))}
                className={`rounded border px-1.5 py-0.5 font-ru text-sm ${
                  isVowel
                    ? 'border-grid bg-white hover:border-ink'
                    : 'cursor-default border-transparent text-muted'
                }`}
              >
                {ch}
              </button>
            );
          })}
          <span className="ml-2 font-ru text-lg">
            <StressedText text={value} />
          </span>
        </div>
      )}
    </div>
  );
}
