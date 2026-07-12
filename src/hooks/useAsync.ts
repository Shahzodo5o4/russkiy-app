import { useEffect, useState } from 'react';

type AsyncState<T> =
  | { loading: true; data?: undefined; error?: undefined }
  | { loading: false; data: T; error?: undefined }
  | { loading: false; data?: undefined; error: string };

/** Oddiy async fetch hook — skelet bosqichi uchun (keyin liveQuery keladi). */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ loading: true });

  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    fn().then(
      (data) => { if (alive) setState({ loading: false, data }); },
      (err: unknown) => {
        if (alive) {
          setState({
            loading: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      },
    );
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
