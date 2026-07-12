const ROWS = [
  ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
  ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
  ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', 'ё'],
] as const;

type Props = {
  onKey: (ch: string) => void;
  onBackspace: () => void;
};

/** Virtual ЙЦУКЕН klaviatura (spec 4.3) — UZ→RU yozish va diktant uchun. */
export default function CyrillicKeyboard({ onKey, onBackspace }: Props) {
  const btn =
    'min-w-[2rem] flex-1 rounded border border-grid bg-white py-2.5 font-ru text-lg active:bg-paper';

  return (
    <div className="grid select-none gap-1">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.map((ch) => (
            <button key={ch} type="button" className={btn}
              onClick={() => onKey(ch)}>
              {ch}
            </button>
          ))}
          {i === 2 && (
            <button type="button" className={`${btn} max-w-[4rem]`}
              onClick={onBackspace} aria-label="O'chirish">
              ⌫
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-1">
        <button type="button" className={`${btn} max-w-[3rem]`}
          onClick={() => onKey('-')}>-</button>
        <button type="button" className={btn}
          onClick={() => onKey(' ')}>пробел</button>
        <button type="button" className={`${btn} max-w-[3rem]`}
          onClick={() => onKey('?')}>?</button>
      </div>
    </div>
  );
}
