import { Link } from 'react-router-dom';
import { unitLabels, sortUnits } from '../../lib/unitLabel';
import type { QuizQuestion, Unit } from '../../types';

type Props = {
  order: QuizQuestion[]; // imtihon savollari
  wrongIds: Set<string>; // xato qilingan savol id'lari
  units: Unit[];
  onRestart: () => void;
};

/** Imtihon natijasi: umumiy ball + dars kesimida hisobot (zaif mavzular ❗). */
export default function ExamResult({ order, wrongIds, units, onRestart }: Props) {
  const total = order.length;
  const ok = total - wrongIds.size;
  const labels = unitLabels(units);
  const rank = new Map(sortUnits(units).map((u, i) => [u.id, i]));

  // dars bo'yicha guruhlash
  const byUnit = new Map<string, { ok: number; total: number }>();
  for (const q of order) {
    const row = byUnit.get(q.unitId) ?? { ok: 0, total: 0 };
    row.total += 1;
    if (!wrongIds.has(q.id)) row.ok += 1;
    byUnit.set(q.unitId, row);
  }
  const rows = [...byUnit.entries()]
    .map(([unitId, r]) => ({
      unit: units.find((u) => u.id === unitId),
      unitId,
      ...r,
      pct: r.ok / r.total,
    }))
    .sort((a, b) => (rank.get(a.unitId) ?? 99) - (rank.get(b.unitId) ?? 99));

  const weak = rows.filter((r) => r.pct < 0.7);

  return (
    <div className="mx-auto grid max-w-md gap-4">
      <h1 className="text-center text-xl font-semibold">
        🎓 Imtihon: {ok} / {total}
      </h1>

      <div className="rounded border border-grid bg-white p-4">
        <h2 className="text-sm font-medium">Darslar kesimida:</h2>
        <ul className="mt-2 grid gap-1.5">
          {rows.map((r) => (
            <li key={r.unitId} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">
                {r.unit ? `${labels.get(r.unit.id)?.badge} · ` : ''}
                <span className="font-ru">{r.unit?.title ?? r.unitId}</span>
              </span>
              <span className={r.pct < 0.7 ? 'font-medium text-miss' : 'text-muted'}>
                {r.ok}/{r.total} {r.pct < 0.7 ? '❗' : r.pct === 1 ? '✓' : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {weak.length > 0 ? (
        <p className="rounded border border-grid bg-paper px-3 py-2 text-sm">
          💡 Zaif mavzular:{' '}
          {weak.map((r, i) => (
            <span key={r.unitId}>
              {i > 0 && ', '}
              <Link to={`/unit/${r.unitId}`} className="font-medium underline">
                {r.unit?.title ?? r.unitId}
              </Link>
            </span>
          ))}
          {' '}— shu darslarning sharh va grammatika bloklarini qayta ko'rib chiqing.
          Xato savollar takrorlash bankida tezlashdi.
        </p>
      ) : (
        <p className="rounded border border-grid bg-paper px-3 py-2 text-sm">
          🏆 Barcha mavzular mustahkam — barakalla!
        </p>
      )}

      <button onClick={onRestart} className="rounded bg-ink py-2.5 font-medium text-paper">
        Yana imtihon
      </button>
      <Link to="/" className="text-center text-sm text-muted underline">
        Bugungi rejaga qaytish
      </Link>
    </div>
  );
}
