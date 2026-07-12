import { useCallback, useEffect, useState } from 'react';
import { storage } from '../../storage';
import type { Block, Book } from '../../types';

const KINDS: Block['kind'][] = ['dialog', 'grammar', 'exercise', 'text', 'note'];
const inputCls = 'mt-1 w-full rounded border border-grid bg-white px-3 py-2';

function newBlock(unitId: string, order: number): Block {
  return {
    id: crypto.randomUUID(), unitId, kind: 'dialog',
    source: null, title: '', body: '', order,
  };
}

/** Dars bloklari: paste-Markdown CRUD. */
export default function BlocksEditor({ unitId }: { unitId: string }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [editing, setEditing] = useState<Block | null>(null);

  const reload = useCallback(
    () => storage.getBlocks(unitId).then(setBlocks),
    [unitId],
  );

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => { storage.getBooks().then(setBooks); }, []);

  async function saveBlock() {
    if (!editing) return;
    await storage.saveBlock(editing);
    setEditing(null);
    await reload();
  }

  async function removeBlock(id: string) {
    await storage.deleteBlock(id);
    await reload();
  }

  const setE = <K extends keyof Block>(key: K, value: Block[K]) =>
    setEditing((b) => (b ? { ...b, [key]: value } : b));

  return (
    <div className="rounded border border-grid bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Bloklar ({blocks.length})</h3>
        <button
          onClick={() => setEditing(newBlock(unitId, blocks.length + 1))}
          className="rounded border border-grid px-3 py-1.5 text-sm"
        >
          + Blok qo'shish
        </button>
      </div>

      <ul className="mt-3 grid gap-1">
        {blocks.map((b) => (
          <li key={b.id}
            className="flex items-center justify-between rounded border border-grid px-3 py-2">
            <span>
              <span className="mr-2 rounded bg-paper px-1.5 py-0.5 font-mono text-sm">
                {b.kind}
              </span>
              {b.title || <span className="text-muted">(nomsiz)</span>}
            </span>
            <span className="flex gap-2 text-sm">
              <button onClick={() => setEditing(b)} className="underline">tahrirlash</button>
              <button onClick={() => void removeBlock(b.id)} className="text-miss">o'chirish</button>
            </span>
          </li>
        ))}
      </ul>

      {editing && (
        <div className="mt-4 rounded border border-ink/30 bg-paper p-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm text-muted">
              Turi
              <select className={inputCls} value={editing.kind}
                onChange={(e) => setE('kind', e.target.value as Block['kind'])}>
                {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
            <label className="text-sm text-muted sm:col-span-2">
              Sarlavha
              <input className={inputCls} value={editing.title}
                onChange={(e) => setE('title', e.target.value)} />
            </label>
            <label className="text-sm text-muted">
              Manba kitob
              <select className={inputCls} value={editing.source?.bookId ?? ''}
                onChange={(e) => setE('source', e.target.value
                  ? { ...editing.source, bookId: e.target.value } : null)}>
                <option value="">—</option>
                {books.map((bk) => <option key={bk.id} value={bk.id}>{bk.title}</option>)}
              </select>
            </label>
            <label className="text-sm text-muted">
              Bet (dan)
              <input type="number" className={inputCls}
                value={editing.source?.pageFrom ?? ''}
                onChange={(e) => editing.source && setE('source',
                  { ...editing.source, pageFrom: Number(e.target.value) || undefined })} />
            </label>
            <label className="text-sm text-muted">
              Bet (gacha)
              <input type="number" className={inputCls}
                value={editing.source?.pageTo ?? ''}
                onChange={(e) => editing.source && setE('source',
                  { ...editing.source, pageTo: Number(e.target.value) || undefined })} />
            </label>
          </div>
          <label className="mt-3 block text-sm text-muted">
            Matn (Markdown — paste qiling)
            <textarea rows={10} className={`${inputCls} font-ru`} value={editing.body}
              onChange={(e) => setE('body', e.target.value)} />
          </label>
          <div className="mt-3 flex gap-2">
            <button onClick={() => void saveBlock()}
              className="rounded bg-ink px-4 py-2 text-sm font-medium text-paper">
              Blokni saqlash
            </button>
            <button onClick={() => setEditing(null)}
              className="rounded border border-grid px-4 py-2 text-sm">
              Bekor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
