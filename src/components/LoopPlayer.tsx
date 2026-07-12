import { useEffect, useRef, useState } from 'react';

const SPEEDS = [1.0, 1.25, 1.5] as const;

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Audio pleyer (spec 4.6): tezlik 0.6/0.75/1.0 + A–B loop —
 * bir bo'lakni belgilab qayta-qayta aylantirish.
 */
export default function LoopPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [a, setA] = useState<number | null>(null);
  const [b, setB] = useState<number | null>(null);

  // A–B loop: B ga yetganda A ga qaytish
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onTime() {
      if (el && a !== null && b !== null && el.currentTime >= b) {
        el.currentTime = a;
        void el.play();
      }
    }
    el.addEventListener('timeupdate', onTime);
    return () => el.removeEventListener('timeupdate', onTime);
  }, [a, b]);

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
          className={`${btn} ${a !== null ? 'border-ink bg-white' : 'border-grid bg-white'}`}>
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
        <span className="text-[11px] text-muted">
          A–B: bo'lak boshida A, oxirida B bosing — aylanadi
        </span>
      </div>
    </div>
  );
}
