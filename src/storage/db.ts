import Dexie, { type Table } from 'dexie';
import type {
  AudioAsset, Block, Book, CardState, DailyStat, Deck, Profile,
  QuizQuestion, QuizState, Resource, Rule, SpeakingLog, Unit,
  UnitProgress, Word,
} from '../types';

type SettingRow = { key: string; value: unknown };

/** Dexie (IndexedDB) — offline kesh / lokal rejim. PLAN.md 2-bo'lim schema. */
export class RusskiyDB extends Dexie {
  books!: Table<Book, string>;
  units!: Table<Unit, string>;
  blocks!: Table<Block, string>;
  resources!: Table<Resource, string>;
  audioAssets!: Table<AudioAsset, string>;
  rules!: Table<Rule, string>;
  decks!: Table<Deck, string>;
  words!: Table<Word, string>;
  profiles!: Table<Profile, string>;
  cardStates!: Table<CardState, string>;
  unitProgress!: Table<UnitProgress, [string, string]>;
  speakingLogs!: Table<SpeakingLog, string>;
  dailyStats!: Table<DailyStat, [string, string]>;
  settings!: Table<SettingRow, string>;
  quizQuestions!: Table<QuizQuestion, string>;
  quizStates!: Table<QuizState, string>;

  constructor() {
    super('russkiy');
    this.version(1).stores({
      books: 'id, role',
      units: 'id, order, status, level',
      blocks: 'id, unitId, [unitId+order]',
      resources: 'id, unitId',
      audioAssets: 'id, unitId',
      rules: 'id, category, *unitIds',
      decks: 'id, level',
      words: 'id, ru, unitId, createdAt, *deckIds',
      profiles: 'id',
      cardStates: 'id, profileId, dueAt, [profileId+dueAt], [profileId+wordId+direction]',
      unitProgress: '[profileId+unitId], profileId, state',
      speakingLogs: 'id, profileId, unitId, createdAt',
      dailyStats: '[profileId+date], profileId, date',
      settings: 'key',
    });
    this.version(2).stores({
      quizQuestions: 'id, unitId, createdAt',
      quizStates: 'id, profileId, [profileId+dueAt]',
    });
  }
}

export const db = new RusskiyDB();
