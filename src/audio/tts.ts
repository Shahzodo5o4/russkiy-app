import { stripStress } from '../lib/stress';

/** Rus ovozi bormi — bir marta ogohlantirish uchun. */
export function hasRussianVoice(): boolean {
  return speechSynthesis.getVoices().some((v) => v.lang.startsWith('ru'));
}

/**
 * Rus matnini o'qiydi (spec 6-bo'lim).
 * MUHIM: urg'uli matn berilsa ham TTS'ga urg'usiz varianti yuboriladi.
 */
export function speak(text: string, rate = 1): void {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(stripStress(text));
  u.lang = 'ru-RU';
  u.rate = rate;
  const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith('ru'));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

/** O'qish tugaguncha kutadigan variant — shadowing ketma-ketligi uchun. */
export function speakAsync(text: string, rate = 1): Promise<void> {
  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(stripStress(text));
    u.lang = 'ru-RU';
    u.rate = rate;
    const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith('ru'));
    if (voice) u.voice = voice;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}
