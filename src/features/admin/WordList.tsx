import { useCallback, useEffect, useState } from 'react';
import { storage } from '../../storage';
import StressedText from '../../components/StressedText';
import type { Word } from '../../types';

/** Kiritilgan so'zlar — qidiruv + o'chirish. */
export default function WordList({ refreshKey }: { refreshKey: number }) {
  const [words, setWords] = useState<Word[]>([]);
  const [query, setQuery] = useState('');

  const reload = useCallback(() => storage.getWords().then(setWords), []);
  useEffect(() => { void reload(); }, [reload, refreshKey]);

  async function remove(id: string) {
    await storage.deleteWord(id);
    await reload();
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? words.filter((w) => w.ru.includes(q) || w.uz.toLowerCase().includes(q))
    : words.slice(-50).reverse();

  return (
    <div className="rounded border border-grid bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-medium">So'zlar ({words.length})</h3>
        <input
          className="rounded border border-grid bg-paper px-3 py-1.5 text-sm"
          placeholder="Qidiruv…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ul className="mt-3 grid gap-1">
        {filtered.map((w) => (
          <li key={w.id}
            className="flex items-baseline justify-between rounded border border-grid px-3 py-1.5">
            <span>
              <span className="font-ru"><StressedText text={w.ruStressed} /></span>
              <span className="mx-2 text-muted">—</span>
              {w.uz}
              <span className="ml-2 text-sm text-muted">
                {w.pos}{w.gender ? `, ${w.gender}` : ''}
              </span>
            </span>
            <button onClick={() => void remove(w.id)} className="text-sm text-miss">
              o'chirish
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-2 text-sm text-muted">Hech narsa topilmadi.</li>
        )}
      </ul>
    </div>
  );
}
