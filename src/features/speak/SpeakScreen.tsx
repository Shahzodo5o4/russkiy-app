import { useEffect, useMemo, useState } from 'react';
import Screen from '../../components/Screen';
import { storage } from '../../storage';
import { useProfile } from '../../store/ProfileContext';
import Shadowing from './Shadowing';
import FreeSpeak from './FreeSpeak';
import Recordings from './Recordings';
import { unitLabels, sortUnits } from '../../lib/unitLabel';
import type { Unit } from '../../types';

type Tab = 'shadow' | 'free' | 'recordings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'shadow', label: 'Shadowing' },
  { id: 'free', label: 'Erkin gapirish' },
  { id: 'recordings', label: 'Yozuvlarim' },
];

/** Gapirish (spec 4.6): shadowing + erkin gapirish + eski yozuvlar. */
export default function SpeakScreen() {
  const { profile } = useProfile();
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitId, setUnitId] = useState('');
  const [tab, setTab] = useState<Tab>('shadow');
  const labels = useMemo(() => unitLabels(units), [units]);
  const sortedUnits = useMemo(() => sortUnits(units), [units]);

  useEffect(() => {
    (async () => {
      const all = await storage.getUnits();
      setUnits(all);
      const pinned = await storage.getSetting<string>(`currentUnit:${profile.id}`);
      setUnitId(
        pinned && all.some((u) => u.id === pinned)
          ? pinned
          : all.find((u) => u.status === 'ready')?.id ?? all[0]?.id ?? '',
      );
    })();
  }, [profile.id]);

  return (
    <Screen title="Gapirish" subtitle="Shadowing · A–B loop · erkin gapirish">
      <div className="grid gap-3">
        <select className="rounded border border-grid bg-white px-2 py-2 text-sm"
          value={unitId} onChange={(e) => setUnitId(e.target.value)}>
          {sortedUnits.map((u) => (
            <option key={u.id} value={u.id}>{labels.get(u.id)?.badge} · {u.title}</option>
          ))}
        </select>

        <div className="flex gap-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 rounded px-2 py-1.5 text-sm ${
                tab === t.id ? 'bg-ink text-paper' : 'border border-grid bg-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {unitId && tab === 'shadow' && <Shadowing unitId={unitId} />}
        {unitId && tab === 'free' && <FreeSpeak unitId={unitId} />}
        {tab === 'recordings' && <Recordings />}
      </div>
    </Screen>
  );
}
