import { useState } from 'react';
import Screen from '../../components/Screen';
import EmptyState from '../../components/EmptyState';
import Markdown from '../../components/Markdown';
import PadejMatrix from './PadejMatrix';
import { storage } from '../../storage';
import { useAsync } from '../../hooks/useAsync';
import type { Rule } from '../../types';

const CATEGORIES: Rule['category'][] = ['padej', "fe'l", 'ot', 'sifat', 'olmosh', 'boshqa'];

/** Qoidalar (cheatsheet). Padej matritsasi 4-bosqichda qo'shiladi. */
export default function RulesScreen() {
  const rules = useAsync(() => storage.getRules(), []);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<Rule['category'] | ''>('');
  const [open, setOpen] = useState<string | null>(null);

  if (rules.loading) return <p className="text-muted">Yuklanmoqda…</p>;
  if (rules.error !== undefined || rules.data === undefined) {
    return <EmptyState message="Yuklab bo'lmadi." hint={rules.error} />;
  }

  const q = query.trim().toLowerCase();
  const filtered = rules.data
    .filter((r) => !cat || r.category === cat)
    .filter((r) => !q || r.title.toLowerCase().includes(q) || r.body.toLowerCase().includes(q))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <Screen title="Qoidalar" subtitle="Cheatsheet — eng ko'p ochiladigan sahifa">
      <PadejMatrix onOpen={(ruleId) => setOpen(ruleId)} />

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          className="flex-1 rounded border border-grid bg-white px-3 py-1.5 text-sm"
          placeholder="Qidiruv…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="rounded border border-grid bg-white px-2 py-1.5 text-sm"
          value={cat}
          onChange={(e) => setCat(e.target.value as Rule['category'] | '')}
        >
          <option value="">hammasi</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <ul className="mt-4 grid gap-2">
        {filtered.map((r) => (
          <li key={r.id} className="rounded border border-grid bg-white">
            <button
              className="flex w-full items-baseline justify-between px-4 py-3 text-left"
              onClick={() => setOpen(open === r.id ? null : r.id)}
            >
              <span className="font-ru">{r.pinned && '📌 '}{r.title}</span>
              <span className="ml-2 shrink-0 text-sm text-muted">
                {r.body === '' ? "to'ldirilmagan" : (open === r.id ? '▲' : '▼')}
              </span>
            </button>
            {open === r.id && r.body && (
              <div className="border-t border-grid px-4 py-3 font-ru">
                <Markdown>{r.body}</Markdown>
              </div>
            )}
          </li>
        ))}
        {filtered.length === 0 && (
          <EmptyState message="Hech narsa topilmadi." />
        )}
      </ul>
    </Screen>
  );
}
