import type { Word } from '../types';
import { stripStress } from './stress';

export type ParsedWord = Omit<Word, 'id' | 'createdAt' | 'deckIds' | 'unitId'>;

const POS_MAP: Record<string, Word['pos']> = {
  ot: 'ot', "fe'l": "fe'l", fel: "fe'l", sifat: 'sifat',
  ravish: 'ravish', ibora: 'ibora', boshqa: 'boshqa',
};

const GENDERS = new Set(['m', 'f', 'n']);

/**
 * Bulk format (har qatorda, | bilan):
 *   молоко́ | sut | ot,n | Я пью молоко. | Men sut ichaman.
 *   де́лать / сде́лать | qilmoq | fe'l | Что ты делаешь? | Nima qilyapsan?
 * Majburiy: ru | uz. Qolganlari ixtiyoriy.
 */
export function parseBulkWords(text: string): { words: ParsedWord[]; errors: string[] } {
  const words: ParsedWord[] = [];
  const errors: string[] = [];

  text.split('\n').forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) return;
    const cols = line.split('|').map((c) => c.trim());
    if (cols.length < 2 || !cols[0] || !cols[1]) {
      errors.push(`${idx + 1}-qator: kamida "ru | uz" bo'lishi kerak`);
      return;
    }

    const [ruRaw, uz, posRaw = '', exampleRu = '', exampleUz = ''] = cols;

    // pos[,gender] — masalan "ot,n" yoki "fe'l"
    const [posToken = '', genderToken = ''] = posRaw.split(',').map((s) => s.trim());
    const pos = POS_MAP[posToken.toLowerCase()] ?? 'boshqa';
    if (posToken && !(posToken.toLowerCase() in POS_MAP)) {
      errors.push(`${idx + 1}-qator: noma'lum turkum "${posToken}" → "boshqa" qilindi`);
    }
    const gender = GENDERS.has(genderToken) ? (genderToken as Word['gender']) : undefined;

    // Aspekt juftligi: "де́лать / сде́лать"
    const isPair = ruRaw.includes('/');
    const ruStressed = ruRaw;
    const ruClean = stripStress(ruRaw);
    const ru = isPair ? ruClean.split('/')[0].trim() : ruClean;
    const aspectPair = isPair ? ruClean.replace(/\s*\/\s*/, ' / ') : undefined;

    const word: ParsedWord = { ru, ruStressed, uz, pos };
    if (gender) word.gender = gender;
    if (aspectPair) word.aspectPair = aspectPair;
    if (exampleRu) word.exampleRu = exampleRu;
    if (exampleUz) word.exampleUz = exampleUz;
    words.push(word);
  });

  return { words, errors };
}
