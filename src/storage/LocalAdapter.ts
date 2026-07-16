import { db } from './db';
import type {
  AudioAssetMeta, SpeakingLogMeta, StorageAdapter,
} from './StorageAdapter';
import type {
  Block, Book, CardState, DailyStat, Deck, Profile, QuizQuestion, QuizState,
  Resource, Rule, Unit, UnitProgress, Word,
} from '../types';

/**
 * Dexie (IndexedDB) implementatsiyasi — offline kesh / Supabase'siz lokal rejim.
 * Bloblar to'g'ridan-to'g'ri IndexedDB'da saqlanadi.
 */
export class LocalAdapter implements StorageAdapter {
  // ---- kontent ----
  getBooks(): Promise<Book[]> { return db.books.toArray(); }
  getUnits(): Promise<Unit[]> { return db.units.orderBy('order').toArray(); }
  getUnit(id: string): Promise<Unit | undefined> { return db.units.get(id); }
  async saveUnit(unit: Unit): Promise<void> { await db.units.put(unit); }

  getBlocks(unitId: string): Promise<Block[]> {
    return db.blocks.where('[unitId+order]')
      .between([unitId, -Infinity], [unitId, Infinity]).toArray();
  }
  async saveBlock(block: Block): Promise<void> { await db.blocks.put(block); }
  async deleteBlock(id: string): Promise<void> { await db.blocks.delete(id); }

  getResources(unitId: string): Promise<Resource[]> {
    return db.resources.where({ unitId }).toArray();
  }
  async saveResource(r: Resource): Promise<void> { await db.resources.put(r); }
  async deleteResource(id: string): Promise<void> { await db.resources.delete(id); }

  getRules(): Promise<Rule[]> { return db.rules.toArray(); }
  async saveRule(rule: Rule): Promise<void> { await db.rules.put(rule); }
  async deleteRule(id: string): Promise<void> { await db.rules.delete(id); }

  getDecks(): Promise<Deck[]> { return db.decks.toArray(); }
  async saveDeck(deck: Deck): Promise<void> { await db.decks.put(deck); }

  getWords(): Promise<Word[]> { return db.words.orderBy('createdAt').toArray(); }
  getWordsByUnit(unitId: string): Promise<Word[]> {
    return db.words.where({ unitId }).toArray();
  }
  async saveWord(word: Word): Promise<void> { await db.words.put(word); }
  async saveWords(words: Word[]): Promise<void> { await db.words.bulkPut(words); }
  async deleteWord(id: string): Promise<void> { await db.words.delete(id); }

  // ---- grammatika savollari ----
  getQuizQuestions(): Promise<QuizQuestion[]> {
    return db.quizQuestions.orderBy('createdAt').toArray();
  }
  getQuizQuestionsByUnit(unitId: string): Promise<QuizQuestion[]> {
    return db.quizQuestions.where({ unitId }).sortBy('createdAt');
  }
  async saveQuizQuestions(questions: QuizQuestion[]): Promise<void> {
    await db.quizQuestions.bulkPut(questions);
  }
  async deleteQuizQuestion(id: string): Promise<void> { await db.quizQuestions.delete(id); }

  // ---- audio ----
  async listAudioAssets(unitId: string): Promise<AudioAssetMeta[]> {
    const assets = await db.audioAssets.where({ unitId }).toArray();
    return assets.map(({ blob: _blob, ...meta }) => meta);
  }
  async saveAudioAsset(meta: AudioAssetMeta, blob: Blob): Promise<void> {
    await db.audioAssets.put({ ...meta, blob });
  }
  async getAudioUrl(id: string): Promise<string | undefined> {
    const asset = await db.audioAssets.get(id);
    return asset ? URL.createObjectURL(asset.blob) : undefined;
  }
  async deleteAudioAsset(id: string): Promise<void> { await db.audioAssets.delete(id); }

  // ---- profil va progress ----
  getProfiles(): Promise<Profile[]> { return db.profiles.toArray(); }

  getCardStates(profileId: string): Promise<CardState[]> {
    return db.cardStates.where({ profileId }).toArray();
  }
  getDueCards(profileId: string, before: number, limit: number): Promise<CardState[]> {
    return db.cardStates.where('[profileId+dueAt]')
      .between([profileId, 0], [profileId, before]).limit(limit).toArray();
  }
  async saveCardState(card: CardState): Promise<void> { await db.cardStates.put(card); }

  getQuizStates(profileId: string): Promise<QuizState[]> {
    return db.quizStates.where({ profileId }).toArray();
  }
  getDueQuizStates(profileId: string, before: number, limit: number): Promise<QuizState[]> {
    return db.quizStates.where('[profileId+dueAt]')
      .between([profileId, 0], [profileId, before]).limit(limit).toArray();
  }
  async saveQuizState(state: QuizState): Promise<void> { await db.quizStates.put(state); }

  getUnitProgress(profileId: string, unitId: string): Promise<UnitProgress | undefined> {
    return db.unitProgress.get([profileId, unitId]);
  }
  listUnitProgress(profileId: string): Promise<UnitProgress[]> {
    return db.unitProgress.where({ profileId }).toArray();
  }
  async saveUnitProgress(p: UnitProgress): Promise<void> { await db.unitProgress.put(p); }

  async listSpeakingLogs(profileId: string): Promise<SpeakingLogMeta[]> {
    const logs = await db.speakingLogs.where({ profileId }).reverse().sortBy('createdAt');
    return logs.map(({ audioBlob: _b, ...meta }) => meta);
  }
  async saveSpeakingLog(meta: SpeakingLogMeta, blob: Blob): Promise<void> {
    await db.speakingLogs.put({ ...meta, audioBlob: blob });
  }
  async getSpeakingAudioUrl(id: string): Promise<string | undefined> {
    const log = await db.speakingLogs.get(id);
    return log ? URL.createObjectURL(log.audioBlob) : undefined;
  }

  getDailyStat(profileId: string, date: string): Promise<DailyStat | undefined> {
    return db.dailyStats.get([profileId, date]);
  }
  getDailyStats(profileId: string): Promise<DailyStat[]> {
    return db.dailyStats.where({ profileId }).sortBy('date');
  }
  async saveDailyStat(stat: DailyStat): Promise<void> { await db.dailyStats.put(stat); }

  // ---- sozlamalar ----
  async getSetting<T>(key: string): Promise<T | undefined> {
    const row = await db.settings.get(key);
    return row ? (row.value as T) : undefined;
  }
  async setSetting(key: string, value: unknown): Promise<void> {
    await db.settings.put({ key, value });
  }
}
