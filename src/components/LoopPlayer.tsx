import { useEffect, useId, useRef, useState } from 'react';

const SPEEDS = [1.0, 1.25, 1.5] as const;

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

type Props = { src: string; title?: string };

/**
 * Audio pleyer: tezlik + A–B loop + qalqib turuvchi mini-panel —
 * sahifani aylantirsangiz ham pauza/davom qo'l ostida.
 */
export default function LoopPlayer({ src, title }: Props) {
  const id = useId();
  const ref = useRef<HTMLAudioElement | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [a, setA] = useState<number | null>(null);
  const [b, setB] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [bar, setBar] = useState(false);
  const [time, setTime] = useState(0);

  // Element hodisalari + boshqa pleyerlar bilan eksklyuzivlik
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onPlay = () => {
      setPlaying(true);
      setBar(true);
      window.dispatchEvent(new CustomEvent('lp-play', { detail: id }));
    };
    const onPause = () => setPlaying(false);
    const onTime = () => {
      setTime(el.currentTime);
      if (a !== null && b !== null && el.currentTime >= b) {
        el.currentTime = a;
        void el.play();
      }
    };
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== id) el.pause();
    };
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('timeupdate', onTime);
    window.addEventListener('lp-play', onOther);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('timeupdate', onTime);
      window.removeEventListener('lp-play', onOther);
    };
  }, [a, b, id]);

  function applySpeed(s: number) {
    setSpeed(s);
    if (ref.current) ref.current.playbackRate = s;
  }

  function mark(which: 'a' | 'b') {
    const t = ref.current?.currentTime ?? 0;
    if (which === 'a') { setA(t); if (b !== null && b <= t) setB(null); }
    else if (a !== null && t > a) setB(t);
  }

  const btn = 'rounded border px-2 py-1 font-mono text-sm';

  return (
    <div className="grid gap-2">
      <audio
        ref={(el) => { ref.current = el; if (el) el.playbackRate = speed; }}
        controls
        preload="metadata"
        src={src}
        className="w-full"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {SPEEDS.map((s) => (
          <button key={s} onClick={() => applySpeed(s)}
            className={`${btn} ${speed === s ? 'border-ink bg-ink text-paper' : 'border-grid bg-white'}`}>
            {s}×
          </button>
        ))}
        <span className="mx-1 text-grid">|</span>
        <button onClick={() => mark('a')}
          className={`${btn} border-grid bg-white ${a !== null ? 'border-ink' : ''}`}>
          A{a !== null && ` ${fmt(a)}`}
        </button>
        <button onClick={() => mark('b')} disabled={a === null}
          className={`${btn} border-grid bg-white disabled:opacity-40 ${b !== null ? 'border-ink' : ''}`}>
          B{b !== null && ` ${fmt(b)}`}
        </button>
        {a !== null && b !== null && (
          <button onClick={() => { setA(null); setB(null); }}
            className={`${btn} border-miss text-miss`}>
            loop ✕
          </button>
        )}
      </div>

      {/* Qalqib turuvchi mini-panel — tab bar ustida */}
      {bar && (
        <div className="fixed inset-x-0 bottom-[4.2rem] z-30 flex justify-center px-4">
          <div className="flex w-full max-w-md items-center gap-2 rounded border border-grid bg-white px-3 py-2 shadow-md">
            <button
              onClick={() => {
                const el = ref.current;
                if (!el) return;
                if (el.paused) void el.play();
                else el.pause();
              }}
              className="rounded border border-grid px-3 py-1.5 text-lg leading-none"
            >
              {playing ? '⏸' : '▶'}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{title ?? 'Audio'}</p>
              <p className="font-mono text-[11px] text-muted">
                {fmt(time)}{a !== null && b !== null && ' · loop'} · {speed}×
              </p>
            </div>
            <button
              onClick={() => { ref.current?.pause(); setBar(false); }}
              className="px-1 text-muted"
              title="Yopish"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
