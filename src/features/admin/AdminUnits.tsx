import { Link } from 'react-router-dom';
import { storage } from '../../storage';
import { useAsync } from '../../hooks/useAsync';
import { unitLabels } from '../../lib/unitLabel';

/** Darslar ro'yxati — tahrirlash uchun. */
export default function AdminUnits() {
  const units = useAsync(() => storage.getUnits(), []);

  if (units.loading) return <p className="text-muted">Yuklanmoqda…</p>;
  if (units.error !== undefined || units.data === undefined) {
    return <p className="text-miss">{units.error}</p>;
  }

  const labels = unitLabels(units.data);

  return (
    <ul className="grid gap-1">
      {units.data.map((u) => (
        <li key={u.id}>
          <Link
            to={u.id}
            className="flex items-baseline justify-between rounded border border-grid bg-white px-3 py-2 hover:border-ink"
          >
            <span>
              <span className="mr-2 font-mono text-sm text-muted">
                {labels.get(u.id)?.badge}
                <span className="ml-1 opacity-50">#{u.order}</span>
              </span>
              <span className="font-ru">{u.title}</span>
            </span>
            <span
              className={`text-sm ${u.status === 'ready' ? 'text-ok' : 'text-muted'}`}
            >
              {u.status === 'ready' ? 'tayyor ✓' : 'qoralama'}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
