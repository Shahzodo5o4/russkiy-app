import { useEffect, useState } from 'react';
import { storage } from '../../storage';
import { unitLabels } from '../../lib/unitLabel';
import type { Unit } from '../../types';

type Row = { file: File; unitId: string; title: string };

function getDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    a.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(a.duration) ? a.duration : 0);
    });
    a.addEventListener('error', () => { URL.revokeObjectURL(url); resolve(0); });
  });
}

/** Fayl nomidan dars raqamini taxmin qiladi: "14_урок_..." → 14. */
function guessOrder(name: string): number | null {
  const m = /^(\d{1,2})[_\s.-]/.exec(name);
  return m ? Number(m[1]) : null;
}

function cleanTitle(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/^\d+[_\s.-]*/, '').replace(/_/g, ' ').trim();
}

/** Audio import: bir nechta mp3 → unitga biriktirish → Supabase Storage. */
export default function AdminAudio() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const labels = unitLabels(units);

  useEffect(() => { storage.getUnits().then(setUnits); }, []);

  function pick(files: FileList | null) {
    if (!files) return;
    const next: Row[] = [...files].map((file) => {
      const order = guessOrder(file.name);
      const unit = units.find((u) => u.order === order);
      return { file, unitId: unit?.id ?? '', title: cleanTitle(file.name) };
    });
    setRows(next);
  }

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function importAll() {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.unitId) continue;
      setProgress(`${i + 1}/${rows.length}: ${r.file.name}…`);
      const seconds = await getDuration(r.file);
      await storage.saveAudioAsset(
        { id: crypto.randomUUID(), unitId: r.unitId, title: r.title, seconds },
        r.file,
      );
    }
    setProgress(`Tayyor ✓ (${rows.filter((r) => r.unitId).length} ta yuklandi)`);
    setRows([]);
  }

  return (
    <div className="rounded border border-grid bg-white p-4">
      <h3 className="font-medium">Audio import</h3>
      <p className="mt-1 text-sm text-muted">
        mp3 fayllarni tanlang — dars raqami fayl nomidan taxmin qilinadi, tasdiqlang.
      </p>
      <input type="file" accept="audio/*" multiple className="mt-3 text-sm"
        onChange={(e) => pick(e.target.files)} />

      {rows.length > 0 && (
        <>
          <ul className="mt-3 grid gap-1">
            {rows.map((r, i) => (
              <li key={i} className="grid gap-2 rounded border border-grid p-2 sm:grid-cols-3">
                <span className="truncate font-mono text-sm">{r.file.name}</span>
                <select
                  className={`rounded border px-2 py-1 text-sm ${
                    r.unitId ? 'border-grid' : 'border-miss'
                  }`}
                  value={r.unitId}
                  onChange={(e) => setRow(i, { unitId: e.target.value })}
                >
                  <option value="">— dars tanlang —</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{labels.get(u.id)?.badge} · {u.title}</option>
                  ))}
                </select>
                <input className="rounded border border-grid px-2 py-1 text-sm"
                  value={r.title}
                  onChange={(e) => setRow(i, { title: e.target.value })} />
              </li>
            ))}
          </ul>
          <button onClick={() => void importAll()} disabled={progress !== null && !progress.startsWith('Tayyor')}
            className="mt-3 rounded bg-ink px-4 py-2 text-sm font-medium text-paper">
            {rows.filter((r) => r.unitId).length} ta faylni yuklash
          </button>
        </>
      )}

      {progress && <p className="mt-2 text-sm text-muted">{progress}</p>}
    </div>
  );
}
