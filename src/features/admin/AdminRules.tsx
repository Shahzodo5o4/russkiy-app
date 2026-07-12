import { Link } from 'react-router-dom';
import { storage } from '../../storage';
import { useAsync } from '../../hooks/useAsync';
import type { Rule } from '../../types';

/** Qoidalar ro'yxati + yangi qo'shish. */
export default function AdminRules() {
  const rules = useAsync(() => storage.getRules(), []);

  if (rules.loading) return <p className="text-muted">Yuklanmoqda…</p>;
  if (rules.error !== undefined || rules.data === undefined) {
    return <p className="text-miss">{rules.error}</p>;
  }

  return (
    <div>
      <Link
        to="new"
        className="inline-block rounded border border-grid bg-white px-3 py-1.5 text-sm"
      >
        + Yangi qoida
      </Link>
      <ul className="mt-3 grid gap-1">
        {rules.data.map((r: Rule) => (
          <li key={r.id}>
            <Link to={r.id}
              className="flex items-baseline justify-between rounded border border-grid bg-white px-3 py-2 hover:border-ink">
              <span className="font-ru">{r.pinned && '📌 '}{r.title}</span>
              <span className="text-sm text-muted">
                {r.category}{r.body === '' && " · to'ldirilmagan"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
