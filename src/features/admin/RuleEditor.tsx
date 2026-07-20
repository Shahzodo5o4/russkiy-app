import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storage } from '../../storage';
import Markdown from '../../components/Markdown';
import { unitLabels, sortUnits } from '../../lib/unitLabel';
import type { Rule, Unit } from '../../types';

const CATEGORIES: Rule['category'][] = ['padej', "fe'l", 'ot', 'sifat', 'olmosh', 'boshqa'];
const inputCls = 'mt-1 w-full rounded border border-grid bg-white px-3 py-2';

function blankRule(): Rule {
  return { id: crypto.randomUUID(), title: '', category: 'padej', body: '', unitIds: [], pinned: false };
}

/** Qoida tahriri — Markdown + jonli ko'rinish. */
export default function RuleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rule, setRule] = useState<Rule | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const labels = unitLabels(units);
  const sortedUnits = sortUnits(units);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    storage.getUnits().then(setUnits);
    if (id === 'new') { setRule(blankRule()); return; }
    storage.getRules().then((all) => setRule(all.find((r) => r.id === id) ?? null));
  }, [id]);

  if (!rule) return <p className="text-muted">Yuklanmoqda…</p>;

  const set = <K extends keyof Rule>(key: K, value: Rule[K]) => {
    setRule({ ...rule, [key]: value });
    setSaved(false);
  };

  async function save() {
    if (!rule) return;
    await storage.saveRule(rule);
    setSaved(true);
  }

  const toggleUnit = (uid: string) =>
    set('unitIds', rule.unitIds.includes(uid)
      ? rule.unitIds.filter((x) => x !== uid)
      : [...rule.unitIds, uid]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded border border-grid bg-white p-4">
        <div className="grid gap-3">
          <label className="text-sm text-muted">
            Sarlavha
            <input className={`${inputCls} font-ru`} value={rule.title}
              onChange={(e) => set('title', e.target.value)} />
          </label>
          <div className="flex items-end gap-3">
            <label className="flex-1 text-sm text-muted">
              Kategoriya
              <select className={inputCls} value={rule.category}
                onChange={(e) => set('category', e.target.value as Rule['category'])}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input type="checkbox" checked={rule.pinned}
                onChange={(e) => set('pinned', e.target.checked)} />
              qadalgan
            </label>
          </div>
          <div className="text-sm text-muted">
            Qaysi darslarda kerak
            <div className="mt-1 flex max-h-28 flex-wrap gap-1 overflow-y-auto">
              {sortedUnits.map((u) => (
                <button key={u.id} type="button" onClick={() => toggleUnit(u.id)}
                  className={`rounded border px-2 py-0.5 font-mono text-sm ${
                    rule.unitIds.includes(u.id)
                      ? 'border-ink bg-ink text-paper' : 'border-grid bg-white'
                  }`}>
                  {labels.get(u.id)?.badge}
                </button>
              ))}
            </div>
          </div>
          <label className="text-sm text-muted">
            Matn (Markdown + jadval)
            <textarea rows={14} className={`${inputCls} font-mono text-sm`} value={rule.body}
              onChange={(e) => set('body', e.target.value)} />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => void save()}
            className="rounded bg-ink px-4 py-2 text-sm font-medium text-paper">
            Saqlash
          </button>
          {saved && <span className="text-sm text-ok">Saqlandi ✓</span>}
          <button onClick={() => navigate('/admin/rules')}
            className="ml-auto text-sm text-muted underline">
            ← Ro'yxatga
          </button>
        </div>
      </div>

      <div className="rounded border border-grid bg-white p-4">
        <h3 className="text-sm text-muted">Ko'rinishi</h3>
        <div className="mt-2 font-ru">
          <Markdown>{rule.body || '_Bo‘sh_'}</Markdown>
        </div>
      </div>
    </div>
  );
}
