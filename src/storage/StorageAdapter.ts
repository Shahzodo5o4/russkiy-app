import type {
  AudioAsset,
  Block,
  Book,
  CardState,
  DailyStat,
  Deck,
  Profile,
  Resource,
  Rule,
  SpeakingLog,
  Unit,
  UnitProgress,
  Word,
} from '../types';

/** Blob'siz metama'lumot — ro'yxatlar uchun (blob alohida URL orqali olinadi) */
export type AudioAssetMeta = Omit<AudioAsset, 'blob'>;
export type SpeakingLogMeta = Omit<SpeakingLog, 'audioBlob'>;

/**
 * BARCHA ma'lumot o'qish/yozish shu interfeys orqali.
 * Komponentlar ichida to'g'ridan-to'g'ri supabase/db chaqiruvi TAQIQLANADI.
 */
export interface StorageAdapter {
  // ---- kontent ----
  getBooks(): Promise<Book[]>;
  getUnits(): Promise<Unit[]>;
  getUnit(id: string): Promise<Unit | undefined>;
  saveUnit(unit: Unit): Promise<void>;

  getBlocks(unitId: string): Promise<Block[]>;
  saveBlock(block: Block): Promise<void>;
  deleteBlock(id: string): Promise<void>;

  getResources(unitId: string): Promise<Resource[]>;
  saveResource(resource: Resource): Promise<void>;
  deleteResource(id: string): Promise<void>;

  getRules(): Promise<Rule[]>;
  saveRule(rule: Rule): Promise<void>;
  deleteRule(id: string): Promise<void>;

  getDecks(): Promise<Deck[]>;
  saveDeck(deck: Deck): Promise<void>;

  getWords(): Promise<Word[]>;
  getWordsByUnit(unitId: string): Promise<Word[]>;
  saveWord(word: Word): Promise<void>;
  saveWords(words: Word[]): Promise<void>;
  deleteWord(id: string): Promise<void>;

  // ---- audio (blob → private storage) ----
  listAudioAssets(unitId: string): Promise<AudioAssetMeta[]>;
  saveAudioAsset(meta: AudioAssetMeta, blob: Blob): Promise<void>;
  getAudioUrl(id: string): Promise<string | undefined>;
  deleteAudioAsset(id: string): Promise<void>;

  // ---- profil va progress ----
  getProfiles(): Promise<Profile[]>;

  getCardStates(profileId: string): Promise<CardState[]>;
  getDueCards(profileId: string, before: number, limit: number): Promise<CardState[]>;
  saveCardState(card: CardState): Promise<void>;

  getUnitProgress(profileId: string, unitId: string): Promise<UnitProgress | undefined>;
  saveUnitProgress(progress: UnitProgress): Promise<void>;

  listSpeakingLogs(profileId: string): Promise<SpeakingLogMeta[]>;
  saveSpeakingLog(meta: SpeakingLogMeta, blob: Blob): Promise<void>;
  getSpeakingAudioUrl(id: string): Promise<string | undefined>;

  getDailyStat(profileId: string, date: string): Promise<DailyStat | undefined>;
  getDailyStats(profileId: string): Promise<DailyStat[]>;
  saveDailyStat(stat: DailyStat): Promise<void>;

  // ---- sozlamalar (umumiy, kalit-qiymat) ----
  getSetting<T>(key: string): Promise<T | undefined>;
  setSetting(key: string, value: unknown): Promise<void>;
}
