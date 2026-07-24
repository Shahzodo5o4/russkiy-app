import { useState } from 'react';
import Screen from '../../components/Screen';
import { storage } from '../../storage';
import { useAsync } from '../../hooks/useAsync';
import { DEFAULT_NEW_LIMIT, DEFAULT_REVIEW_LIMIT } from '../../srs/queue';
import { DEFAULT_QUIZ_REVIEW_LIMIT } from '../../srs/quizQueue';

type Initial = {
  newLimit: number;
  reviewLimit: number;
  quizLimit: number;
  autoTTS: boolean;
};

function NumberRow({
  label,
  hint,
  value,
  min,
  max,
  onSave,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onSave: (n: number) => void;
}) {
  const [v, setV] = useState(value);
  return (
    <label className="flex items-center justify-between gap-4 border-b border-grid py-3">
      <span className="text-sm">
        {label}
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <input
        type="number"
        min={min}
        max={max}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        onBlur={() => {
          const clamped = Math.max(min, Math.min(max, Math.round(v) || min));
          setV(clamped);
          onSave(clamped);
        }}
        className="w-20 rounded border border-grid bg-white px-2 py-1.5 text-right text-sm"
      />
    </label>
  );
}

function Form({ initial }: { initial: Initial }) {
  const [autoTTS, setAutoTTS] = useState(initial.autoTTS);
  const [saved, setSaved] = useState(false);

  function flash() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  }
  async function save(key: string, val: number | boolean) {
    await storage.setSetting(key, val);
    flash();
  }

  return (
    <div>
      <h2 className="mb-1 text-sm font-medium text-muted">Kunlik limitlar</h2>
      <NumberRow
        label="Yangi so'zlar / kun"
        hint={`Har kuni nechta yangi kartochka ochiladi (default ${DEFAULT_NEW_LIMIT})`}
        value={initial.newLimit}
        min={0}
        max={100}
        onSave={(n) => void save('newLimit', n)}
      />
      <NumberRow
        label="Takrorlash / kun"
        hint={`Muddati kelgan so'zlar chegarasi (default ${DEFAULT_REVIEW_LIMIT})`}
        value={initial.reviewLimit}
        min={10}
        max={500}
        onSave={(n) => void save('reviewLimit', n)}
      />
      <NumberRow
        label="Grammatika takrori / kun"
        hint={`Muddati kelgan test savollari chegarasi (default ${DEFAULT_QUIZ_REVIEW_LIMIT})`}
        value={initial.quizLimit}
        min={0}
        max={100}
        onSave={(n) => void save('quizReviewLimit', n)}
      />

      <h2 className="mb-1 mt-6 text-sm font-medium text-muted">Ovoz</h2>
      <label className="flex items-center justify-between gap-4 border-b border-grid py-3">
        <span className="text-sm">
          Avto-talaffuz (TTS)
          <span className="block text-xs text-muted">
            Takrorlashda kartochka ruscha tomonini avtomatik o'qib beradi
          </span>
        </span>
        <input
          type="checkbox"
          checked={autoTTS}
          onChange={(e) => {
            setAutoTTS(e.target.checked);
            void save('autoTTS', e.target.checked);
          }}
          className="h-5 w-5"
        />
      </label>

      <p className="mt-4 h-5 text-sm text-green-600" aria-live="polite">
        {saved ? 'Saqlandi ✓' : ''}
      </p>
    </div>
  );
}

/** Sozlamalar — kunlik limitlar va ovoz. Global (barcha profillar uchun). */
export default function SettingsScreen() {
  const data = useAsync(
    () =>
      Promise.all([
        storage.getSetting<number>('newLimit'),
        storage.getSetting<number>('reviewLimit'),
        storage.getSetting<number>('quizReviewLimit'),
        storage.getSetting<boolean>('autoTTS'),
      ]),
    [],
  );

  const title = '⚙ Sozlamalar';
  const subtitle = 'Kunlik limitlar har kuni nechta karta chiqishini boshqaradi';

  if (!data.data) {
    return (
      <Screen title={title} subtitle={subtitle}>
        {data.error ? (
          <p className="text-red-600">Xato: {data.error}</p>
        ) : (
          <p className="text-muted">Yuklanmoqda…</p>
        )}
      </Screen>
    );
  }

  const [nl, rl, ql, tts] = data.data;
  return (
    <Screen title={title} subtitle={subtitle}>
      <Form
        initial={{
          newLimit: nl ?? DEFAULT_NEW_LIMIT,
          reviewLimit: rl ?? DEFAULT_REVIEW_LIMIT,
          quizLimit: ql ?? DEFAULT_QUIZ_REVIEW_LIMIT,
          autoTTS: tts ?? true,
        }}
      />
    </Screen>
  );
}
