import { useEffect, useRef, useState, type ReactNode } from 'react';
import { speak } from '../../audio/tts';

type Props = {
  children: ReactNode;
  onAddWord: (text: string) => void;
};

type Pop = { text: string; x: number; y: number };

const HAS_CYRILLIC = /[а-яё]/i;

/**
 * Rus matni belgilanganda popover: 🔊 O'qish | ➕ Lug'atga qo'sh.
 * Ilovaning eng ko'p ishlatiladigan qismi (spec 4.4).
 */
export default function SelectionPopover({ children, onAddWord }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pop, setPop] = useState<Pop | null>(null);

  useEffect(() => {
    function onSelect() {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? '';
      if (!sel || sel.isCollapsed || !text || !HAS_CYRILLIC.test(text)) {
        setPop(null);
        return;
      }
      // Faqat shu konteyner ichidagi belgilash
      const anchor = sel.anchorNode;
      if (!anchor || !ref.current?.contains(anchor)) { setPop(null); return; }

      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const host = ref.current.getBoundingClientRect();
      setPop({
        text,
        x: rect.left - host.left + rect.width / 2,
        y: rect.top - host.top,
      });
    }
    document.addEventListener('selectionchange', onSelect);
    return () => document.removeEventListener('selectionchange', onSelect);
  }, []);

  return (
    <div ref={ref} className="relative">
      {children}
      {pop && (
        <div
          className="absolute z-20 flex -translate-x-1/2 -translate-y-full gap-1 rounded border border-grid bg-white p-1 shadow-sm"
          style={{ left: pop.x, top: pop.y - 6 }}
        >
          <button
            className="rounded px-2 py-1 text-sm hover:bg-paper"
            onMouseDown={(e) => { e.preventDefault(); speak(pop.text); }}
          >
            🔊 O'qish
          </button>
          <button
            className="rounded px-2 py-1 text-sm hover:bg-paper"
            onMouseDown={(e) => {
              e.preventDefault();
              onAddWord(pop.text);
              setPop(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            ➕ Lug'atga qo'sh
          </button>
        </div>
      )}
    </div>
  );
}
