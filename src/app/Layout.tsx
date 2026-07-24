import { Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useProfile } from '../store/ProfileContext';
import { supabase } from '../storage/supabase';
import TabBar from './TabBar';

/** Umumiy qobiq: yuqori panel + kontent + pastki tab bar. */
export default function Layout() {
  const { profile, locked, switchProfile } = useProfile();

  return (
    <div className="mx-auto min-h-screen max-w-6xl pb-20">
      <header className="flex items-center justify-between border-b border-grid px-4 py-3">
        <Link to="/" className="font-ru font-bold">
          Русский шаг за шагом
        </Link>
        <div className="flex items-center gap-2">
          {/* Qoidalar — har sahifada, doim (spec 4.5) */}
          <Link
            to="/rules"
            className="rounded border border-grid bg-white px-3 py-1.5 text-sm"
          >
            Qoidalar
          </Link>
          <Link
            to="/settings"
            title="Sozlamalar"
            aria-label="Sozlamalar"
            className="rounded border border-grid bg-white px-3 py-1.5 text-sm text-muted"
          >
            ⚙
          </Link>
          {profile.isAdmin && (
            <Link
              to="/admin"
              title="Kontent kiritish (admin)"
              aria-label="Admin"
              className="rounded border border-grid bg-white px-3 py-1.5 text-sm text-muted"
            >
              🛠
            </Link>
          )}
          <button
            onClick={() => {
              if (locked) void supabase.auth.signOut();
              else switchProfile();
            }}
            title={locked ? 'Chiqish' : 'Profilni almashtirish'}
            className="rounded border border-grid bg-white px-3 py-1.5 text-sm"
          >
            {profile.name}
          </button>
        </div>
      </header>

      <main className="px-4 py-5">
        <Suspense fallback={<p className="text-muted">Yuklanmoqda…</p>}>
          <Outlet />
        </Suspense>
      </main>

      <TabBar />
    </div>
  );
}
