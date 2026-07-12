/** U+0301 combining acute — urg'u belgisi bilan ishlash. */

export const STRESS_MARK = '́';

export const RU_VOWELS = 'аеёиоуыэюяАЕЁИОУЫЭЮЯ';

/** Urg'u belgilarini olib tashlaydi: "молоко́" → "молоко" (TTS va qidiruv uchun). */
export function stripStress(s: string): string {
  return s.normalize('NFD').replace(/́/g, '').normalize('NFC');
}

/** Berilgan indeksdagi unlidan keyin urg'u qo'yadi (eski urg'uni olib tashlab). */
export function applyStressAt(word: string, vowelIndex: number): string {
  const clean = stripStress(word);
  const chars = [...clean];
  if (vowelIndex < 0 || vowelIndex >= chars.length) return clean;
  if (!RU_VOWELS.includes(chars[vowelIndex])) return clean;
  chars[vowelIndex] = chars[vowelIndex] + STRESS_MARK;
  return chars.join('');
}

/**
 * Urg'uli matnni bo'laklarga ajratadi: [oddiy, urg'uli, oddiy, ...].
 * StressedText komponenti urg'uli bo'lakni --stress rang bilan bo'yaydi.
 */
export function splitByStress(s: string): { text: string; stressed: boolean }[] {
  const parts: { text: string; stressed: boolean }[] = [];
  let buf = '';
  const chars = [...s.normalize('NFC')];
  for (let i = 0; i < chars.length; i++) {
    const next = chars[i + 1];
    if (next === STRESS_MARK) {
      if (buf) parts.push({ text: buf, stressed: false });
      parts.push({ text: chars[i] + STRESS_MARK, stressed: true });
      buf = '';
      i++; // combining belgini o'tkazib yubor
    } else {
      buf += chars[i];
    }
  }
  if (buf) parts.push({ text: buf, stressed: false });
  return parts;
}
