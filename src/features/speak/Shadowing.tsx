import { useEffect, useMemo, useState } from 'react';
import { storage } from '../../storage';
import { extractSentences } from '../../lib/sentences';
import { speakAsync } from '../../audio/tts';
import { startRecording, type Recorder } from '../../audio/recorder';
import StressedText from '../../components/StressedText';
import type { Block } from '../../types';

type Phase = 'idle' | 'recording' | 'recorded';

/** Shadowing (spec 4.6): jumla eshitiladi → takrorlab yozasiz → solishtirasiz. */
export default function Shadowing({ unitId }: { unitId: string }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blockId, setBlockId] = useState('');
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [rec, setRec] = useState<Recorder | null>(null);
  const [myUrl, setMyUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1.0);

  useEffect(() => {
    storage.getBlocks(unitId).then((all) => {
      const usable = all.filter((b) => b.kind === 'dialog' || b.kind === 'text');
      setBlocks(usable);
      setBlockId(usable[0]?.id ?? '');
      setIdx(0);
    });
  }, [unitId]);

  const sentences = useMemo(() => {
    const b = blocks.find((x) => x.id === blockId);
    return b ? extractSentences(b.body) : [];
  }, [blocks, blockId]);

  const sentence = sentences[idx];

  function reset() {
    if (myUrl) URL.revokeObjectURL(myUrl);
    setMyUrl(null);
    setPhase('idle');
  }

  async function record() {
    try {
      setErr(null);
      const r = await startRecording();
      setRec(r);
      setPhase('recording');
    } catch {
      setErr("Mikrofonga ruxsat berilmadi — brauzer so'roviga «Allow» deng.");
    }
  }

  async function stopRec() {
    if (!rec) return;
    const { blob } = await rec.stop();
    setMyUrl(URL.createObjectURL(blob));
    setPhase('recorded');
  }

  function playMine(): Promise<void> {
    return new Promise((res) => {
      if (!myUrl) return res();
      const a = new Audio(myUrl);
      a.onended = () => res();
      void a.play();
    });
  }

  if (blocks.length === 0) {
    return <p className="text-sm text-muted">Bu darsda dialog/matn bloki yo'q.</p>;
  }

  const btn = 'rounded border border-grid bg-white px-3 py-2 text-sm';

  return (
    <div className="grid gap-3">
      <select className="rounded border border-grid bg-white px-2 py-2 text-sm"
        value={blockId}
        onChange={(e) => { setBlockId(e.target.value); setIdx(0); reset(); }}>
        {blocks.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
      </select>

      {sentence ? (
        <>
          <div className="rounded border border-grid bg-white p-5 text-center">
            <p className="text-sm text-muted">{idx + 1} / {sentences.length}</p>
            <p className="ru-text mt-2"><StressedText text={sentence} /></p>
          </div>

          <div className="flex justify-center gap-1">
            {[0.75, 1.0, 1.25].map((s) => (
              <button key={s} onClick={() => setSpeed(s)}
                className={`rounded border px-2 py-1 font-mono text-sm ${
                  speed === s ? 'border-ink bg-ink text-paper' : 'border-grid bg-white'
                }`}>
                {s}×
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <button className={btn} onClick={() => void speakAsync(sentence, speed)}>
              🔊 Eshitish
            </button>
            {phase === 'idle' && (
              <button className={`${btn} border-miss text-miss`} onClick={() => void record()}>
                🎙 Yozishni boshlash
              </button>
            )}
            {phase === 'recording' && (
              <button className="animate-pulse rounded bg-miss px-3 py-2 text-sm text-paper"
                onClick={() => void stopRec()}>
                ⏹ To'xtatish
              </button>
            )}
            {phase === 'recorded' && (
              <>
                <button className={btn} onClick={() => void playMine()}>▶ Mening ovozim</button>
                <button className={btn}
                  onClick={async () => { await speakAsync(sentence, speed); await playMine(); }}>
                  ▶▶ Yonma-yon
                </button>
                <button className={btn} onClick={() => void record()}>🎙 Qayta</button>
              </>
            )}
          </div>
          {err && <p className="text-center text-sm text-miss">{err}</p>}

          <div className="flex justify-between">
            <button className={btn} disabled={idx === 0}
              onClick={() => { setIdx(idx - 1); reset(); }}>
              ← Oldingi
            </button>
            <button className={btn} disabled={idx + 1 >= sentences.length}
              onClick={() => { setIdx(idx + 1); reset(); }}>
              Keyingi jumla →
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted">Bu blokda jumla topilmadi.</p>
      )}
    </div>
  );
}
