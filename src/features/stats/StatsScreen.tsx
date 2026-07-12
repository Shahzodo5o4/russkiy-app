import {
  Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Screen from '../../components/Screen';
import StressedText from '../../components/StressedText';
import Compare from './Compare';
import { storage } from '../../storage';
import { useAsync } from '../../hooks/useAsync';
import { useProfile } from '../../store/ProfileContext';
import { computeStreak } from '../../lib/streak';
import { dateKey } from '../../lib/date';

const DAY = 24 * 60 * 60 * 1000;

/** Statistika (spec 4.8): seriya, kunlik grafik, forecast, zaif so'zlar. */
export default function StatsScreen() {
  const { profile } = useProfile();

  const data = useAsync(async () => {
    const [stats, states, words] = await Promise.all([
      storage.getDailyStats(profile.id),
      storage.getCardStates(profile.id),
      storage.getWords(),
    ]);

    // Oxirgi 14 kun — takrorlangan kartalar
    const byDate = new Map(stats.map((s) => [s.date, s]));
    const daily = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * DAY);
      const key = dateKey(d);
      return {
        kun: key.slice(5),
        karta: byDate.get(key)?.cardsReviewed ?? 0,
      };
    });

    // Kelgusi 30 kun yuklamasi
    const forecastMap = new Map<string, number>();
    for (const c of states) {
      if (c.dueAt < Date.now() + 30 * DAY) {
        const key = dateKey(new Date(Math.max(c.dueAt, Date.now())));
        forecastMap.set(key, (forecastMap.get(key) ?? 0) + 1);
      }
    }
    const forecast = Array.from({ length: 30 }, (_, i) => {
      const key = dateKey(new Date(Date.now() + i * DAY));
      return { kun: key.slice(5), karta: forecastMap.get(key) ?? 0 };
    });

    const ru2uz = states.filter((s) => s.direction === 'ru2uz');
    const learned = ru2uz.filter((s) => s.repetitions > 0).length;
    const mature = ru2uz.filter((s) => s.interval >= 21).length;

    const wordMap = new Map(words.map((w) => [w.id, w]));
    const weak = ru2uz
      .filter((s) => s.lapses >= 2 && wordMap.has(s.wordId))
      .sort((a, b) => b.lapses - a.lapses)
      .slice(0, 10)
      .map((s) => ({ word: wordMap.get(s.wordId)!, lapses: s.lapses }));

    return { streak: computeStreak(stats), daily, forecast, learned, mature, total: words.length, weak };
  }, [profile.id]);

  if (data.loading || !data.data) return <p className="text-muted">Yuklanmoqda…</p>;
  const d = data.data;

  const tile = 'rounded border border-grid bg-white p-4 text-center';
  return (
    <Screen title="Statistika" subtitle={`Profil: ${profile.name}`}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className={tile}><p className="text-xl font-semibold">🔥 {d.streak}</p><p className="text-sm text-muted">kunlik seriya</p></div>
        <div className={tile}><p className="text-xl font-semibold">{d.learned}</p><p className="text-sm text-muted">boshlangan so'z</p></div>
        <div className={tile}><p className="text-xl font-semibold">{d.mature}</p><p className="text-sm text-muted">mustahkam (21+ kun)</p></div>
        <div className={tile}><p className="text-xl font-semibold">{d.total}</p><p className="text-sm text-muted">jami lug'atda</p></div>
      </div>

      <Compare />

      <h2 className="mt-6 text-sm font-medium text-muted">Oxirgi 14 kun — takrorlangan kartalar</h2>
      <div className="mt-2 h-44 rounded border border-grid bg-white p-2">
        <ResponsiveContainer>
          <BarChart data={d.daily}>
            <XAxis dataKey="kun" tick={{ fontSize: 11 }} interval={1} />
            <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="karta" fill="#14213D" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mt-6 text-sm font-medium text-muted">Kelgusi 30 kun yuklamasi (forecast)</h2>
      <div className="mt-2 h-44 rounded border border-grid bg-white p-2">
        <ResponsiveContainer>
          <BarChart data={d.forecast}>
            <XAxis dataKey="kun" tick={{ fontSize: 11 }} interval={4} />
            <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="karta" fill="#6B7684" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {d.weak.length > 0 && (
        <>
          <h2 className="mt-6 text-sm font-medium text-muted">Zaif so'zlar (ko'p adashilgan)</h2>
          <ul className="mt-2 grid gap-1">
            {d.weak.map(({ word, lapses }) => (
              <li key={word.id}
                className="flex items-baseline justify-between rounded border border-grid bg-white px-3 py-2">
                <span className="font-ru"><StressedText text={word.ruStressed} /></span>
                <span className="text-sm text-muted">{word.uz} · {lapses} marta</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Screen>
  );
}
