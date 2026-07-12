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
};

/**
 * SRS baholash: tugma ostida — so'z KEYIN QACHON qayta chiqishi.
 * «Yana» — shu sessiya oxirida yana chiqadi. Klaviatura: 1–4.
 */
export default function GradeButtons({ card, onGrade }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {GRADES.map((g) => (
        <button
          key={g.q}
          onClick={() => onGrade(g.q)}
          className={`rounded border-2 bg-white py-2 text-sm font-medium ${g.cls}`}
        >
          {g.label}
          <span className="mt-0.5 block text-[11px] font-normal text-muted">
            {preview(card, g.q)}
          </span>
        </button>
      ))}
    </div>
  );
}
