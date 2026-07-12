import { useEffect, useState } from 'react';
import { storage } from '../../storage';
import { parseBulkWords, type ParsedWord } from '../../lib/bulkParse';
import StressedText from '../../components/StressedText';
import type { Deck, Unit, Word } from '../../types';

const PLACEHOLDER = `молоко́ | sut | ot,n | Я пью молоко. | Men sut ichaman.
де́лать / сде́лать | qilmoq | fe'l | Что ты делаешь? | Nima qilyapsan?`;

/** Ommaviy so'z kiritish — eng ko'p ishlatiladigan admin forma (spec 4.7). */
export default function BulkWords({ onSaved }: { onSaved: () => void }) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedWord[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [unitId, setUnitId] = useState('');
  const [deckIds, setDeckIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    storage.getUnits().then(setUnits);
    storage.getDecks().then(setDecks);
  }, []);

  function preview() {
    const res = parseBulkWords(text);
    setParsed(res.words);
    setErrors(res.errors);
  }

  async function confirm() {
    if (!parsed?.length) return;
    setBusy(true);
    const now = Date.now();
    const words: Word[] = parsed.map((p, i) => ({
      ...p, id: crypto.randomUUID(),
      unitId: unitId || undefined, deckIds, createdAt: now + i,
    }));
    await storage.saveWords(words);
    setText(''); setParsed(null); setErrors([]); setBusy(false);
    onSaved();
  }

  const toggleDeck = (id: string) =>
    setDeckIds((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  return (
    <div className="rounded border border-grid bg-white p-4">
      <h3 className="font-medium">Ommaviy so'z kiritish</h3>
      <p className="mt-1 text-sm text-muted">
        Har qatorda: <code className="font-mono">ru | uz | turkum[,jins] | misol ru | misol uz</code>
      </p>
      <textarea
        rows={8}
        className="mt-2 w-full rounded border border-grid bg-paper px-3 py-2 font-ru"
        placeholder={PLACEHOLDER}
        value={text}
        onChange={(e) => { setText(e.target.value); setParsed(null); }}
      />
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="text-sm text-muted">
          Dars (ixtiyoriy)
          <select className="mt-1 w-full rounded border border-grid bg-white px-3 py-2"
            value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            <option value="">—</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.order} · {u.title}</option>
            ))}
          </select>
        </label>
        <div className="text-sm text-muted">
          To'plamlar (ixtiyoriy)
          <div className="mt-1 flex max-h-24 flex-wrap gap-1 overflow-y-auto">
            {decks.map((d) => (
              <button key={d.id} type="button" onClick={() => toggleDeck(d.id)}
                className={`rounded border px-2 py-0.5 ${
                  deckIds.includes(d.id) ? 'border-ink bg-ink text-paper' : 'border-grid bg-white'
                }`}>
                {d.icon} {d.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!parsed && (
        <button onClick={preview} disabled={!text.trim()}
          className="mt-3 rounded bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50">
          Ko'rib chiqish
        </button>
      )}

      {errors.length > 0 && (
        <ul className="mt-3 text-sm text-miss">
          {errors.map((e, i) => <li key={i}>⚠ {e}</li>)}
        </ul>
      )}

      {parsed && (
        <div className="mt-3">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['ru', 'uz', 'turkum', 'misol'].map((h) => (
                  <th key={h} className="border border-grid bg-paper px-2 py-1 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.map((w, i) => (
                <tr key={i}>
                  <td className="border border-grid px-2 py-1 font-ru">
                    <StressedText text={w.ruStressed} />
                  </td>
                  <td className="border border-grid px-2 py-1">{w.uz}</td>
                  <td className="border border-grid px-2 py-1">
                    {w.pos}{w.gender ? `, ${w.gender}` : ''}
                  </td>
                  <td className="border border-grid px-2 py-1 font-ru">{w.exampleRu ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex gap-2">
            <button onClick={() => void confirm()} disabled={busy || parsed.length === 0}
              className="rounded bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50">
              {busy ? 'Saqlanmoqda…' : `${parsed.length} ta so'zni saqlash`}
            </button>
            <button onClick={() => setParsed(null)}
              className="rounded border border-grid px-4 py-2 text-sm">
              Tahrirga qaytish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
