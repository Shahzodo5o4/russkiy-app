import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import type { Profile } from '../types';
import { storage } from '../storage';
import { supabase } from '../storage/supabase';

const KEY = 'russkiy.profileId';

type ProfileCtx = {
  profile: Profile;
  /** Profil emailga bog'langan bo'lsa almashtirish yo'q */
  locked: boolean;
  switchProfile: () => void;
};

const Ctx = createContext<ProfileCtx | null>(null);

export function useProfile(): ProfileCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProfile faqat ProfileProvider ichida ishlaydi');
  return ctx;
}

/**
 * Profil tanlash. Agar kirgan akkaunt emaili biror profilga bog'langan bo'lsa —
 * o'sha profil avtomatik ochiladi (tanlash ekransiz).
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosenId, setChosenId] = useState<string | null>(
    () => localStorage.getItem(KEY),
  );

  useEffect(() => {
    Promise.all([storage.getProfiles(), supabase.auth.getUser()]).then(
      ([ps, { data }]) => {
        setProfiles(ps);
        setEmail(data.user?.email?.toLowerCase() ?? null);
      },
      (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
    );
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="text-miss">Bazaga ulanib bo'lmadi.</p>
          <p className="mt-2 text-sm text-muted">({error})</p>
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

  // Email bo'yicha bog'langan profil — ustuvor
  const bound = email
    ? profiles.find((p) => p.email?.toLowerCase() === email)
    : undefined;
  const profile = bound ?? profiles.find((p) => p.id === chosenId);

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
    if (bound) return; // emailga bog'langan — almashtirib bo'lmaydi
    localStorage.removeItem(KEY);
    setChosenId(null);
  };

  return (
    <Ctx.Provider value={{ profile, locked: !!bound, switchProfile }}>
      {children}
    </Ctx.Provider>
  );
}
