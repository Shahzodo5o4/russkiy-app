import { useCallback, useEffect, useState } from 'react';
import { storage } from '../../storage';
import type { Resource } from '../../types';

const inputCls = 'mt-1 w-full rounded border border-grid bg-white px-3 py-2';

/** YouTube linklar — darsga biriktirish. */
export default function ResourcesEditor({ unitId }: { unitId: string }) {
  const [items, setItems] = useState<Resource[]>([]);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  const reload = useCallback(
    () => storage.getResources(unitId).then(setItems),
    [unitId],
  );
  useEffect(() => { void reload(); }, [reload]);

  async function add() {
    if (!url.trim()) return;
    await storage.saveResource({
      id: crypto.randomUUID(), unitId,
      youtubeUrl: url.trim(), title: title.trim(),
      note: note.trim() || undefined,
    });
    setUrl(''); setTitle(''); setNote('');
    await reload();
  }

  async function remove(id: string) {
    await storage.deleteResource(id);
    await reload();
  }

  return (
    <div className="rounded border border-grid bg-white p-4">
      <h3 className="font-medium">YouTube ({items.length})</h3>
      <ul className="mt-2 grid gap-1">
        {items.map((r) => (
          <li key={r.id}
            className="flex items-center justify-between rounded border border-grid px-3 py-2 text-sm">
            <span className="truncate">
              {r.title || r.youtubeUrl}
              {r.note && <span className="ml-2 text-muted">— {r.note}</span>}
            </span>
            <button onClick={() => void remove(r.id)} className="ml-2 text-miss">o'chirish</button>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <input className={inputCls} placeholder="YouTube URL" value={url}
          onChange={(e) => setUrl(e.target.value)} />
        <input className={inputCls} placeholder="Sarlavha" value={title}
          onChange={(e) => setTitle(e.target.value)} />
        <input className={inputCls} placeholder="Izoh (13:20 dan padej…)" value={note}
          onChange={(e) => setNote(e.target.value)} />
      </div>
      <button onClick={() => void add()}
        className="mt-2 rounded border border-grid px-3 py-1.5 text-sm">
        + Qo'shish
      </button>
    </div>
  );
}
