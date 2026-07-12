import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import type { Profile } from '../types';
import { storage } from '../storage';

const KEY = 'russkiy.profileId';

type ProfileCtx = {
  profile: Profile;
  switchProfile: () => void;
};

const Ctx = createContext<ProfileCtx | null>(null);

export function useProfile(): ProfileCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProfile faqat ProfileProvider ichida ishlaydi');
  return ctx;
}

/** Profil tanlanmagan bo'lsa — tanlov ekrani. Tanlov localStorage'da. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosenId, setChosenId] = useState<string | null>(
    () => localStorage.getItem(KEY),
  );

  useEffect(() => {
    storage.getProfiles().then(setProfiles, (e: unknown) => {
      setError(e instanceof Error ? e.message : String(e));
    });
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="text-miss">Bazaga ulanib bo'lmadi.</p>
          <p className="mt-2 text-sm text-muted">
            Supabase'da <code className="font-mono">schema.sql</code> ishga
            tushirilganini tekshiring. ({error})
          </p>
        </div>
      </div>
    );
  }

  if (!profiles) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Profil yuklanmoqda…
      </div>
    );
  }

  const profile = profiles.find((p) => p.id === chosenId);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-lg font-medium">Kim o'qiyapti?</h1>
          <div className="mt-6 grid gap-3">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  localStorage.setItem(KEY, p.id);
                  setChosenId(p.id);
                }}
                className="rounded border border-grid bg-white py-4 text-lg hover:border-ink"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const switchProfile = () => {
    localStorage.removeItem(KEY);
    setChosenId(null);
  };

  return <Ctx.Provider value={{ profile, switchProfile }}>{children}</Ctx.Provider>;
}
