import { useEffect, useState } from 'react';
import { storage } from '../../storage';
import { useProfile } from '../../store/ProfileContext';
import type { Unit, UnitProgress } from '../../types';

/** Padej qatori: nomi + unit padejRef'da qidiriladigan kalit + bog'liq qoida. */
const CASES = [
  { name: 'Имени́тельный', key: 'Имени', ruleId: 'rule-01', q: 'кто? что?' },
  { name: 'Роди́тельный', key: 'Родительный', ruleId: 'rule-04', q: 'кого? чего?' },
  { name: 'Да́тельный', key: 'Дательный', ruleId: 'rule-05', q: 'кому? чему?' },
  { name: 'Вини́тельный', key: 'Винительный', ruleId: 'rule-03', q: 'кого? что?' },
  { name: 'Твори́тельный', key: 'Творительный', ruleId: 'rule-06', q: 'кем? чем?' },
  { name: 'Предло́жный', key: 'Предложный', ruleId: 'rule-02', q: 'о ком? о чём?' },
] as const;

const COLS = ['м', 'ж', 'с', 'мн'] as const;

type Fill = 0 | 1 | 2; // bo'sh → jarayonda → tugadi

/**
 * Падеж матрица (spec 8): har padej foydalanuvchi o'tgani sari to'ladi.
 * Katak bosilsa — o'sha qoida ochiladi.
 */
export default function PadejMatrix({ onOpen }: { onOpen: (ruleId: string) => void }) {
  const { profile } = useProfile();
  const [fills, setFills] = useState<Record<string, Fill>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const units = await storage.getUnits();
      const progress = await Promise.all(
        units.map((u) => storage.getUnitProgress(profile.id, u.id)),
      );
      const byUnit = new Map<string, UnitProgress | undefined>(
        units.map((u, i) => [u.id, progress[i]]),
      );
      const next: Record<string, Fill> = {};
      for (const c of CASES) {
        const related: Unit[] = units.filter((u) => u.padejRef?.includes(c.key));
        if (related.length === 0) { next[c.key] = 0; continue; }
        const states = related.map((u) => byUnit.get(u.id)?.state ?? 'yangi');
        if (states.some((s) => s === 'tugadi')) next[c.key] = 2;
        else if (states.some((s) => s === 'jarayonda')) next[c.key] = 1;
        else next[c.key] = 0;
      }
      if (alive) setFills(next);
    })();
    return () => { alive = false; };
  }, [profile.id]);

  const cellCls = (f: Fill) =>
    f === 2 ? 'bg-ink text-paper'
    : f === 1 ? 'bg-grid text-ink'
    : 'bg-white text-muted';

  return (
    <div className="overflow-x-auto rounded border border-grid bg-white p-3">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left font-medium text-muted">Паде́ж</th>
            {COLS.map((c) => (
              <th key={c} className="w-10 px-1 py-1 text-center font-mono text-muted">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CASES.map((c) => {
            const f = fills[c.key] ?? 0;
            return (
              <tr key={c.key}>
                <td className="px-2 py-1">
                  <button className="text-left hover:underline" onClick={() => onOpen(c.ruleId)}>
                    <span className="font-ru">{c.name}</span>
                    <span className="ml-1.5 text-[11px] text-muted">{c.q}</span>
                  </button>
                </td>
                {COLS.map((col) => (
                  <td key={col} className="p-0.5">
                    <button
                      onClick={() => onOpen(c.ruleId)}
                      className={`block h-8 w-full rounded border border-grid transition-colors duration-300 ${cellCls(f)}`}
                      title={`${c.name} — ${f === 2 ? 'o‘tilgan' : f === 1 ? 'jarayonda' : 'hali o‘tilmagan'}`}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-muted">
        Katak darslar bajarilgani sari to'ladi: bo'sh → kulrang (jarayonda) → to'q (o'tilgan). Bosilsa qoida ochiladi.
      </p>
    </div>
  );
}
