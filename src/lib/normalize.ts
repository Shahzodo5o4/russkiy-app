import { stripStress } from './stress';

/**
 * Yumshoq tekshiruv (spec 4.3): katta-kichik harf, ortiqcha probel,
 * ё↔е, urg'u belgisi, tinish belgilari — farq qilmasin.
 */
export function softNormalize(s: string): string {
  return stripStress(s)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:«»"()\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function softEqual(a: string, b: string): boolean {
  return softNormalize(a) === softNormalize(b);
}
