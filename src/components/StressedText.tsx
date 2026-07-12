import { splitByStress } from '../lib/stress';

/**
 * Urg'uli rus matni. --stress rangi BUTUN ILOVADA faqat shu yerda ishlatiladi.
 * молок<span class="text-stress-accent">о́</span>
 */
export default function StressedText({ text }: { text: string }) {
  return (
    <>
      {splitByStress(text).map((part, i) =>
        part.stressed ? (
          <span key={i} className="text-stress-accent">{part.text}</span>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
