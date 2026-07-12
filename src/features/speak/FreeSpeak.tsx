import { useEffect, useState } from 'react';
import { storage } from '../../storage';
import { useProfile } from '../../store/ProfileContext';
import { startRecording, type Recorder } from '../../audio/recorder';

/** Erkin gapirish: savol → yozib olish → saqlash (SpeakingLog). */
export default function FreeSpeak({ unitId }: { unitId: string }) {
  const { profile } = useProfile();
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [rec, setRec] = useState<Recorder | null>(null);
  const [status, setStatus] = useState<'idle' | 'recording' | 'saving' | 'saved'>('idle');
  const [err, setErr] = useState<string | null>(null);

  // «О себе» blokidan savollarni taklif sifatida olish
  useEffect(() => {
    storage.getBlocks(unitId).then((blocks) => {
      const speak = blocks.find((b) => b.title.toLowerCase().includes('о себе'));
      if (!speak) { setSuggestions([]); return; }
      const qs = speak.body
        .split('\n')
        .map((l) => l.replace(/^\d+\.\s*/, '').trim())
        .filter((l) => l.includes('?') && /[а-яё]/i.test(l));
      setSuggestions(qs.slice(0, 6));
    });
  }, [unitId]);

  async function start() {
    try {
      setErr(null);
      const r = await startRecording();
      setRec(r);
      setStatus('recording');
    } catch {
      setErr("Mikrofonga ruxsat berilmadi.");
    }
  }

  async function stopAndSave() {
    if (!rec) return;
    setStatus('saving');
    const { blob, seconds } = await rec.stop();
    await storage.saveSpeakingLog(
      {
        id: crypto.randomUUID(),
        profileId: profile.id,
        unitId,
        prompt: prompt || '(erkin mavzu)',
        seconds,
        createdAt: Date.now(),
      },
      blob,
    );
    setStatus('saved');
  }

  return (
    <div className="grid gap-3">
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((q) => (
            <button key={q} onClick={() => setPrompt(q)}
              className={`rounded border px-2 py-1 text-left font-ru text-sm ${
                prompt === q ? 'border-ink' : 'border-grid bg-white'
              }`}>
              {q}
            </button>
          ))}
        </div>
      )}
      <textarea
        rows={2}
        className="rounded border border-grid bg-white px-3 py-2 font-ru"
        placeholder="Savol yoki mavzu (ixtiyoriy) — yoki yuqoridan tanlang"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      {status === 'recording' ? (
        <button onClick={() => void stopAndSave()}
          className="animate-pulse rounded bg-miss py-3 font-medium text-paper">
          ⏹ To'xtatish va saqlash
        </button>
      ) : (
        <button onClick={() => void start()} disabled={status === 'saving'}
          className="rounded bg-ink py-3 font-medium text-paper disabled:opacity-50">
          {status === 'saving' ? 'Saqlanmoqda…' : '🎙 Yozishni boshlash'}
        </button>
      )}

      {status === 'saved' && (
        <p className="text-center text-sm text-ok">
          Saqlandi ✓ — «Yozuvlarim» bo'limida eshitishingiz mumkin.
        </p>
      )}
      {err && <p className="text-center text-sm text-miss">{err}</p>}
      <p className="text-[11px] text-muted">
        Maslahat: savolga 4–6 gap bilan javob berishga harakat qiling. Oylar o'tib eski
        yozuvlaringizni eshitsangiz — o'sish aniq seziladi.
      </p>
    </div>
  );
}
