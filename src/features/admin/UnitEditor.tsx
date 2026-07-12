import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { storage } from '../../storage';
import type { Unit } from '../../types';
import BlocksEditor from './BlocksEditor';
import ResourcesEditor from './ResourcesEditor';

const inputCls = 'mt-1 w-full rounded border border-grid bg-white px-3 py-2';

/** Bitta darsni tahrirlash: maydonlar + bloklar + YouTube. */
export default function UnitEditor() {
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) storage.getUnit(id).then((u) => setUnit(u ?? null));
  }, [id]);

  if (!unit) return <p className="text-muted">Yuklanmoqda…</p>;

  const set = <K extends keyof Unit>(key: K, value: Unit[K]) => {
    setUnit({ ...unit, [key]: value });
    setSaved(false);
  };

  async function save() {
    if (!unit) return;
    try {
      await storage.saveUnit(unit);
      setSaved(true);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="grid gap-5">
      <div className="rounded border border-grid bg-white p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium">
            {unit.order}-dars ·{' '}
            <Link to={`/unit/${unit.id}`} className="underline">ko'rish</Link>
          </h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={unit.status === 'ready'}
              onChange={(e) => set('status', e.target.checked ? 'ready' : 'draft')}
            />
            tayyor
          </label>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-muted">
            Sarlavha (ru)
            <input className={`${inputCls} font-ru`} value={unit.title}
              onChange={(e) => set('title', e.target.value)} />
          </label>
          <label className="text-sm text-muted">
            Mavzu (uz)
            <input className={inputCls} value={unit.topic}
              onChange={(e) => set('topic', e.target.value)} />
          </label>
          <label className="text-sm text-muted">
            Grammatika fokusi
            <input className={inputCls} value={unit.grammarFocus}
              onChange={(e) => set('grammarFocus', e.target.value)} />
          </label>
          <label className="text-sm text-muted">
            Padej bo'limi (Русские падежи)
            <input className={inputCls} value={unit.padejRef ?? ''}
              placeholder="Предложный, 27"
              onChange={(e) => set('padejRef', e.target.value || undefined)} />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={save}
            className="rounded bg-ink px-4 py-2 text-sm font-medium text-paper">
            Saqlash
          </button>
          {saved && <span className="text-sm text-ok">Saqlandi ✓</span>}
          {error && <span className="text-sm text-miss">{error}</span>}
        </div>
      </div>

      <BlocksEditor unitId={unit.id} />
      <ResourcesEditor unitId={unit.id} />
    </div>
  );
}
