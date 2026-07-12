import { NavLink, Outlet } from 'react-router-dom';

const SECTIONS = [
  { to: 'units', label: 'Darslar' },
  { to: 'words', label: "So'zlar" },
  { to: 'rules', label: 'Qoidalar' },
  { to: 'audio', label: 'Audio' },
  { to: 'backup', label: 'Zaxira' },
] as const;

/** Admin qobiq — chiroyli emas, TEZ (spec 4.7). */
export default function AdminLayout() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Admin</h1>
      <nav className="mt-3 flex flex-wrap gap-1 border-b border-grid pb-2">
        {SECTIONS.map((s) => (
          <NavLink
            key={s.to}
            to={s.to}
            className={({ isActive }) =>
              `rounded px-3 py-1.5 text-sm ${
                isActive ? 'bg-ink text-paper' : 'bg-white border border-grid'
              }`
            }
          >
            {s.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-4">
        <Outlet />
      </div>
    </div>
  );
}
