import { stripStress } from './stress';

/**
 * Lotin «egizak» harflar → kirill (klaviatura aralashib ketganda):
 * a→а, c→с, e→е, o→о, p→р, x→х, y→у, k→к, m→м, t→т, b→в, h→н
 */
const LATIN_LOOKALIKES: Record<string, string> = {
  a: 'а', c: 'с', e: 'е', o: 'о', p: 'р', x: 'х',
  y: 'у', k: 'к', m: 'м', t: 'т', b: 'в', h: 'н',
};

/**
 * Yumshoq tekshiruv (spec 4.3): katta-kichik harf, ortiqcha probel,
 * ё↔е, urg'u belgisi, tinish belgilari, defis↔probel va lotin
 * egizak harflar — farq qilmasin.
 */
export function softNormalize(s: string): string {
  return stripStress(s)
    .toLowerCase()
    .replace(/[a-z]/g, (ch) => LATIN_LOOKALIKES[ch] ?? ch)
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:«»"()[\]…'’ʼ`]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function softEqual(a: string, b: string): boolean {
  return softNormalize(a) === softNormalize(b);
}
