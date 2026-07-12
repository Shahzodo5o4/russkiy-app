import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Bugun', icon: '📖' },
  { to: '/review', label: 'Takrorlash', icon: '🔁' },
  { to: '/rules', label: 'Qoidalar', icon: '📐' },
  { to: '/stats', label: 'Statistika', icon: '📊' },
] as const;

/** Pastki tab bar — mobil birinchi. */
export default function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-grid bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-sm ${
                isActive ? 'font-medium text-ink' : 'text-muted'
              }`
            }
          >
            <span aria-hidden>{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
