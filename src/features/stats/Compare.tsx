import { storage } from '../../storage';
import { useAsync } from '../../hooks/useAsync';
import { computeStreak } from '../../lib/streak';
import { dateKey } from '../../lib/date';

type Row = {
  name: string;
  streak: number;
  today: number;
  total: number;
  learned: number;
  mature: number;
};

/** 🏆 Raqobat: ikkala profil statistikasi yonma-yon. */
export default function Compare() {
  const data = useAsync(async () => {
    const profiles = await storage.getProfiles();
    const rows: Row[] = await Promise.all(
      profiles.map(async (p) => {
        const [stats, states] = await Promise.all([
          storage.getDailyStats(p.id),
          storage.getCardStates(p.id),
        ]);
        const ru2uz = states.filter((s) => s.direction === 'ru2uz');
        return {
          name: p.name,
          streak: computeStreak(stats),
          today: stats.find((s) => s.date === dateKey())?.cardsReviewed ?? 0,
          total: stats.reduce((sum, s) => sum + s.cardsReviewed, 0),
          learned: ru2uz.filter((s) => s.repetitions > 0).length,
          mature: ru2uz.filter((s) => s.interval >= 21).length,
        };
      }),
    );
    return rows;
  }, []);

  if (!data.data || data.data.length < 2) return null;
  const rows = data.data;

  const METRICS: { key: keyof Omit<Row, 'name'>; label: string }[] = [
    { key: 'streak', label: '🔥 Seriya (kun)' },
    { key: 'today', label: 'Bugungi kartalar' },
    { key: 'total', label: 'Jami takrorlash' },
    { key: 'learned', label: "Boshlangan so'zlar" },
    { key: 'mature', label: 'Mustahkam (21+ kun)' },
  ];

  return (
    <div className="mt-6">
      <h2 className="text-sm font-medium text-muted">🏆 Raqobat</h2>
      <div className="mt-2 overflow-x-auto rounded border border-grid bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-grid">
              <th className="px-3 py-2 text-left font-medium text-muted"> </th>
              {rows.map((r) => (
                <th key={r.name} className="px-3 py-2 text-center font-semibold">
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m) => {
              const max = Math.max(...rows.map((r) => r[m.key]));
              return (
                <tr key={m.key} className="border-b border-grid last:border-0">
                  <td className="px-3 py-2 text-muted">{m.label}</td>
                  {rows.map((r) => (
                    <td key={r.name}
                      className={`px-3 py-2 text-center ${
                        r[m.key] === max && max > 0 ? 'font-semibold text-ok' : ''
                      }`}>
                      {r[m.key]}{r[m.key] === max && max > 0 && rows.filter(x => x[m.key] === max).length === 1 ? ' 🏆' : ''}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-[11px] text-muted">
        🏆 — shu ko'rsatkichda oldinda. Har kuni yangilanadi, omad!
      </p>
    </div>
  );
}
