import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../../store/ProfileContext';
import { useReviewSession } from '../../hooks/useReviewSession';
import { storage } from '../../storage';
import { speak } from '../../audio/tts';
import EmptyState from '../../components/EmptyState';
import TypeAnswer from '../../components/TypeAnswer';
import FlipCard from './FlipCard';
import GradeButtons from './GradeButtons';
import type { Quality } from '../../srs/sm2';

/** SRS sessiyasi (spec 4.2). Space = ochish, 1–4 = baholash. */
export default function ReviewScreen() {
  const { profile } = useProfile();
  const s = useReviewSession(profile.id);
  const [flipped, setFlipped] = useState(false);
  const [typed, setTyped] = useState(false); // uz2ru: javob tekshirildimi
  const [autoTts, setAutoTts] = useState(true);

  useEffect(() => {
    storage.getSetting<boolean>('autoTTS').then((v) => setAutoTts(v ?? true));
  }, []);

  const current = s.current;

  // Yangi karta ochilganda holatni tozalash + avto-o'qish
  useEffect(() => {
    setFlipped(false);
    setTyped(false);
    if (current && current.card.direction === 'ru2uz' && autoTts) {
      speak(current.word.ru, 0.9);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.index, s.phase]);

  const grade = useCallback((q: Quality) => { void s.grade(q); }, [s]);

  // Klaviatura: Space = ochish, 1-4 = baho
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current || current.card.direction === 'uz2ru') return;
      if (e.code === 'Space') { e.preventDefault(); setFlipped(true); }
      if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        grade(([0, 3, 4, 5] as Quality[])[Number(e.key) - 1]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, flipped, grade]);

  if (s.phase === 'loading') return <p className="text-muted">Navbat tuzilmoqda…</p>;

  if (s.phase === 'empty') {
    return (
      <div className="mx-auto max-w-md">
        <EmptyState
          message="Bugungi takrorlash bo'sh — hammasi bajarilgan!"
          hint="Yangi so'zlar darslar import qilinganda avtomatik qo'shiladi."
        />
        <Link to="/quiz" className="mt-4 block rounded border border-grid bg-white py-2.5 text-center">
          Test rejimiga o'tish →
        </Link>
      </div>
    );
  }

  if (s.phase === 'done') {
    const pct = s.reviewed ? Math.round((s.correct / s.reviewed) * 100) : 0;
    return (
      <div className="mx-auto grid max-w-md gap-4 text-center">
        <h1 className="text-xl font-semibold">Sessiya tugadi 🎉</h1>
        <div className="rounded border border-grid bg-white p-6">
          <p className="text-2xl font-semibold">{s.reviewed}</p>
          <p className="text-sm text-muted">ta karta · to'g'ri: {pct}%</p>
        </div>
        <Link to="/" className="rounded bg-ink py-2.5 font-medium text-paper">Bugunga qaytish</Link>
        <Link to="/quiz" className="text-sm text-muted underline">Test rejimi →</Link>
      </div>
    );
  }

  if (!current) return null;
  const isTyping = current.card.direction === 'uz2ru';

  return (
    <div className="mx-auto grid max-w-md gap-4">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{s.index + 1} / {s.total}{current.isNew && ' · yangi so’z'}</span>
        <button
          onClick={() => {
            const v = !autoTts;
            setAutoTts(v);
            void storage.setSetting('autoTTS', v);
          }}
          className={`rounded border px-2 py-1 ${autoTts ? 'border-ink' : 'border-grid'}`}
          title="Avtomatik o'qish"
        >
          🔊 {autoTts ? 'yoqiq' : 'o’chiq'}
        </button>
      </div>

      {isTyping ? (
        <div className="grid gap-3">
          <div className="rounded border border-grid bg-white px-4 py-8 text-center">
            <p className="text-sm text-muted">ruschasini yozing:</p>
            <p className="mt-1 text-xl font-semibold">{current.word.uz}</p>
            {current.word.exampleUz && (
              <p className="mt-1 text-sm text-muted">{current.word.exampleUz}</p>
            )}
          </div>
          <TypeAnswer
            key={current.card.id + s.index}
            expected={current.word.ru}
            expectedStressed={current.word.ruStressed}
            onResult={() => setTyped(true)}
            afterSlot={typed ? <GradeButtons card={current.card} onGrade={grade} /> : undefined}
          />
        </div>
      ) : (
        <>
          <FlipCard word={current.word} flipped={flipped} onFlip={() => setFlipped(true)} />
          {flipped ? (
            <GradeButtons card={current.card} onGrade={grade} />
          ) : (
            <button onClick={() => setFlipped(true)}
              className="rounded bg-ink py-2.5 font-medium text-paper">
              Ochish (Space)
            </button>
          )}
        </>
      )}
    </div>
  );
}
