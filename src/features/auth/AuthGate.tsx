import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../storage/supabase';
import LoginScreen from './LoginScreen';

/** Sessiya bo'lmasa login ekranini ko'rsatadi. Sessiya localStorage'da saqlanadi. */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Yuklanmoqda…
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  return <>{children}</>;
}
