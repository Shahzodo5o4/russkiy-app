import { sm2, type Quality } from '../../srs/sm2';
import type { CardState } from '../../types';

const GRADES: { q: Quality; label: string; key: string; cls: string }[] = [
  { q: 0, label: 'Yana', key: '1', cls: 'border-miss text-miss' },
  { q: 3, label: 'Qiyin', key: '2', cls: 'border-ink/40 text-ink' },
  { q: 4, label: 'Yaxshi', key: '3', cls: 'border-ok text-ok' },
  { q: 5, label: 'Oson', key: '4', cls: 'border-grid text-muted' },
];

/** Baholansa keyingi chiqish vaqti qancha bo'lishini ko'rsatadi. */
function preview(card: CardState, q: Quality): string {
  const next = sm2(card, q);
  if (next.interval === 0) return 'hozir↺';
  if (next.interval === 1) return '1 kun';
  if (next.interval < 30) return `${next.interval} kun`;
  return `${Math.round(next.interval / 30)} oy`;
}

type Props = {
  card: CardState;
  onGrade: (q: Quality) => void;
  /** uz2ru: javob noto'g'ri yozilgan — faqat «Yana» (typo istisnosi bilan) */
  wrongTyped?: boolean;
};

/**
 * SRS baholash: tugma ostida — so'z KEYIN QACHON qayta chiqishi.
 * «Yana» — shu sessiyada bir necha kartadan keyin qayta chiqadi. Klaviatura: 1–4.
 * wrongTyped'da o'zini yuqori baholash yopiq: xato javob = «Yana».
 */
export default function GradeButtons({ card, onGrade, wrongTyped }: Props) {
  if (wrongTyped) {
    return (
      <div className="grid gap-2">
        <button
          onClick={() => onGrade(0)}
          className="rounded border-2 border-miss bg-white py-2.5 text-sm font-medium text-miss"
        >
          Yana (1) — birozdan keyin qayta so'raladi
          <span className="mt-0.5 block text-[11px] font-normal text-muted">
            {preview(card, 0)}
          </span>
        </button>
        <button
          onClick={() => onGrade(3)}
          className="text-xs text-muted underline"
        >
          Xato yozdim, aslida bilaman → «Qiyin» (2) · {preview(card, 3)}
        </button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-4 gap-2">
      {GRADES.map((g) => (
        <button
          key={g.q}
          onClick={() => onGrade(g.q)}
          className={`rounded border-2 bg-white py-2 text-sm font-medium ${g.cls}`}
        >
          {g.label} <span className="font-normal text-muted">({g.key})</span>
          <span className="mt-0.5 block text-[11px] font-normal text-muted">
            {preview(card, g.q)}
          </span>
        </button>
      ))}
    </div>
  );
}
