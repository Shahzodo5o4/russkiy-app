import { useState, type FormEvent } from 'react';
import { supabase } from '../../storage/supabase';

/** Umumiy akkaunt bilan kirish — har qurilmada bir marta. */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError("Kirish muvaffaqiyatsiz — email yoki parol noto'g'ri.");
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded border border-grid bg-white p-6"
      >
        <h1 className="font-ru text-xl">Русский шаг за шагом</h1>
        <p className="mt-1 text-sm text-muted">Umumiy akkaunt bilan kiring</p>

        <label className="mt-6 block text-sm text-muted" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border border-grid bg-paper px-3 py-2"
        />

        <label className="mt-4 block text-sm text-muted" htmlFor="password">Parol</label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border border-grid bg-paper px-3 py-2"
        />

        {error && <p className="mt-3 text-sm text-miss">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded bg-ink py-2.5 font-medium text-paper disabled:opacity-50"
        >
          {busy ? 'Kirilmoqda…' : 'Kirish'}
        </button>
      </form>
    </div>
  );
}
