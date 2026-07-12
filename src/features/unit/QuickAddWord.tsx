import { useEffect, useState } from 'react';
import { storage } from '../../storage';
import StressInput from '../admin/StressInput';
import { stripStress } from '../../lib/stress';
import type { Deck, Word } from '../../types';

const POS: Word['pos'][] = ['ot', "fe'l", 'sifat', 'ravish', 'ibora', 'boshqa'];
const inputCls = 'mt-1 w-full rounded border border-grid bg-white px-3 py-2';

type Props = {
  initialRu: string;
  unitId?: string;
  onClose: () => void;
};

/** Belgilangan so'zdan lug'atga tez qo'shish — forma oldindan to'ldirilgan. */
export default function QuickAddWord({ initialRu, unitId, onClose }: Props) {
  const [ru, setRu] = useState(initialRu.toLowerCase());
  const [uz, setUz] = useState('');
  const [pos, setPos] = useState<Word['pos']>('ot');
  const [gender, setGender] = useState<'' | 'm' | 'f' | 'n'>('');
  const [exampleRu, setExampleRu] = useState('');
  const [exampleUz, setExampleUz] = useState('');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckIds, setDeckIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { storage.getDecks().then(setDecks); }, []);

  async function save() {
    if (!ru.trim() || !uz.trim()) return;
    setBusy(true);
    const word: Word = {
      id: crypto.randomUUID(),
      ru: stripStress(ru).trim(),
      ruStressed: ru.trim(),
      uz: uz.trim(),
      pos,
      deckIds,
      unitId,
      createdAt: Date.now(),
    };
    if (pos === 'ot' && gender) word.gender = gender;
    if (exampleRu.trim()) word.exampleRu = exampleRu.trim();
    if (exampleUz.trim()) word.exampleUz = exampleUz.trim();
    await storage.saveWord(word);
    onClose();
  }

  const toggleDeck = (id: string) =>
    setDeckIds((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/30 p-4 sm:items-center"
      onClick={onClose}>
      <div className="w-full max-w-md rounded border border-grid bg-white p-4"
        onClick={(e) => e.stopPropagation()}>
        <h3 className="font-medium">Lug'atga qo'shish</h3>

        <label className="mt-3 block text-sm text-muted">
          Ruscha (urg'u qo'ying)
          <StressInput value={ru} onChange={setRu} />
        </label>

        <label className="mt-3 block text-sm text-muted">
          O'zbekcha tarjima
          <input className={inputCls} value={uz} autoFocus
            onChange={(e) => setUz(e.target.value)} />
        </label>

        <div className="mt-3 flex gap-3">
          <label className="flex-1 text-sm text-muted">
            Turkum
            <select className={inputCls} value={pos}
              onChange={(e) => setPos(e.target.value as Word['pos'])}>
              {POS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          {pos === 'ot' && (
            <label className="flex-1 text-sm text-muted">
              Jins
              <select className={inputCls} value={gender}
                onChange={(e) => setGender(e.target.value as typeof gender)}>
                <option value="">—</option>
                <option value="m">м (он)</option>
                <option value="f">ж (она)</option>
                <option value="n">с (оно)</option>
              </select>
            </label>
          )}
        </div>

        <label className="mt-3 block text-sm text-muted">
          Misol (ru)
          <input className={`${inputCls} font-ru`} value={exampleRu}
            onChange={(e) => setExampleRu(e.target.value)} />
        </label>
        <label className="mt-2 block text-sm text-muted">
          Misol (uz)
          <input className={inputCls} value={exampleUz}
            onChange={(e) => setExampleUz(e.target.value)} />
        </label>

        {decks.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {decks.map((d) => (
              <button key={d.id} type="button" onClick={() => toggleDeck(d.id)}
                className={`rounded border px-2 py-0.5 text-sm ${
                  deckIds.includes(d.id) ? 'border-ink bg-ink text-paper' : 'border-grid'
                }`}>
                {d.icon} {d.title}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button onClick={() => void save()} disabled={busy || !uz.trim()}
            className="flex-1 rounded bg-ink py-2 text-sm font-medium text-paper disabled:opacity-50">
            Saqlash
          </button>
          <button onClick={onClose} className="rounded border border-grid px-4 py-2 text-sm">
            Bekor
          </button>
        </div>
      </div>
    </div>
  );
}
