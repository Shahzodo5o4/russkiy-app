import { supabase } from './supabase';
import { toCamelRow, toSnakeRow } from '../lib/case';
import type {
  AudioAssetMeta,
  SpeakingLogMeta,
  StorageAdapter,
} from './StorageAdapter';
import type {
  Block, Book, CardState, DailyStat, Deck, Profile, QuizQuestion, QuizState,
  Resource, Rule, Unit, UnitProgress, Word,
} from '../types';

const BUCKET = 'audio';

function fail(op: string, message: string): never {
  throw new Error(`[storage] ${op}: ${message}`);
}

/** Asosiy adapter — Supabase Postgres + private Storage bucket. */
export class SupabaseAdapter implements StorageAdapter {
  private async rows<T>(
    table: string,
    match?: Record<string, unknown>,
    orderBy?: string,
  ): Promise<T[]> {
    let q = supabase.from(table).select('*');
    if (match) q = q.match(match);
    if (orderBy) q = q.order(orderBy, { ascending: true });
    const { data, error } = await q;
    if (error) fail(`select ${table}`, error.message);
    return (data ?? []).map((r) => toCamelRow<T>(r));
  }

  private async upsert(table: string, obj: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from(table).upsert(toSnakeRow(obj));
    if (error) fail(`upsert ${table}`, error.message);
  }

  private async remove(table: string, id: string): Promise<void> {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) fail(`delete ${table}`, error.message);
  }

  // ---- kontent ----
  getBooks(): Promise<Book[]> { return this.rows('books'); }
  getUnits(): Promise<Unit[]> { return this.rows('units', undefined, 'order'); }
  async getUnit(id: string): Promise<Unit | undefined> {
    return (await this.rows<Unit>('units', { id }))[0];
  }
  saveUnit(unit: Unit): Promise<void> { return this.upsert('units', unit); }

  getBlocks(unitId: string): Promise<Block[]> {
    return this.rows('blocks', { unit_id: unitId }, 'order');
  }
  saveBlock(block: Block): Promise<void> { return this.upsert('blocks', block); }
  deleteBlock(id: string): Promise<void> { return this.remove('blocks', id); }

  getResources(unitId: string): Promise<Resource[]> {
    return this.rows('resources', { unit_id: unitId });
  }
  saveResource(r: Resource): Promise<void> { return this.upsert('resources', r); }
  deleteResource(id: string): Promise<void> { return this.remove('resources', id); }

  getRules(): Promise<Rule[]> { return this.rows('rules', undefined, 'title'); }
  saveRule(rule: Rule): Promise<void> { return this.upsert('rules', rule); }
  deleteRule(id: string): Promise<void> { return this.remove('rules', id); }

  getDecks(): Promise<Deck[]> { return this.rows('decks', undefined, 'title'); }
  saveDeck(deck: Deck): Promise<void> { return this.upsert('decks', deck); }

  getWords(): Promise<Word[]> { return this.rows('words', undefined, 'created_at'); }
  getWordsByUnit(unitId: string): Promise<Word[]> {
    return this.rows('words', { unit_id: unitId });
  }
  saveWord(word: Word): Promise<void> { return this.upsert('words', word); }
  async saveWords(words: Word[]): Promise<void> {
    const { error } = await supabase.from('words').upsert(words.map(toSnakeRow));
    if (error) fail('upsert words', error.message);
  }
  deleteWord(id: string): Promise<void> { return this.remove('words', id); }

  // ---- grammatika savollari ----
  getQuizQuestions(): Promise<QuizQuestion[]> {
    return this.rows('quiz_questions', undefined, 'created_at');
  }
  getQuizQuestionsByUnit(unitId: string): Promise<QuizQuestion[]> {
    return this.rows('quiz_questions', { unit_id: unitId }, 'created_at');
  }
  async saveQuizQuestions(questions: QuizQuestion[]): Promise<void> {
    const { error } = await supabase.from('quiz_questions').upsert(questions.map(toSnakeRow));
    if (error) fail('upsert quiz_questions', error.message);
  }
  deleteQuizQuestion(id: string): Promise<void> { return this.remove('quiz_questions', id); }

  // ---- audio ----
  private audioPath(meta: AudioAssetMeta): string {
    return `units/${meta.unitId}/${meta.id}.mp3`;
  }

  async listAudioAssets(unitId: string): Promise<AudioAssetMeta[]> {
    const { data, error } = await supabase
      .from('audio_assets')
      .select('id, unit_id, title, seconds, transcript')
      .eq('unit_id', unitId);
    if (error) fail('select audio_assets', error.message);
    return (data ?? []).map((r) => toCamelRow<AudioAssetMeta>(r));
  }

  async saveAudioAsset(meta: AudioAssetMeta, blob: Blob): Promise<void> {
    const path = this.audioPath(meta);
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { upsert: true, contentType: 'audio/mpeg' });
    if (upErr) fail('upload audio', upErr.message);
    await this.upsert('audio_assets', { ...meta, storagePath: path });
  }

  async getAudioUrl(id: string): Promise<string | undefined> {
    const { data, error } = await supabase
      .from('audio_assets').select('storage_path').eq('id', id).maybeSingle();
    if (error) fail('select audio path', error.message);
    if (!data) return undefined;
    const { data: signed, error: sErr } = await supabase.storage
      .from(BUCKET).createSignedUrl(data.storage_path as string, 3600);
    if (sErr) fail('sign audio url', sErr.message);
    return signed.signedUrl;
  }

  async deleteAudioAsset(id: string): Promise<void> {
    const { data } = await supabase
      .from('audio_assets').select('storage_path').eq('id', id).maybeSingle();
    if (data) await supabase.storage.from(BUCKET).remove([data.storage_path as string]);
    await this.remove('audio_assets', id);
  }

  // ---- profil va progress ----
  getProfiles(): Promise<Profile[]> { return this.rows('profiles', undefined, 'name'); }

  getCardStates(profileId: string): Promise<CardState[]> {
    return this.rows('card_states', { profile_id: profileId });
  }

  async getDueCards(profileId: string, before: number, limit: number): Promise<CardState[]> {
    const { data, error } = await supabase
      .from('card_states').select('*')
      .eq('profile_id', profileId).lte('due_at', before)
      .order('due_at', { ascending: true }).limit(limit);
    if (error) fail('select due cards', error.message);
    return (data ?? []).map((r) => toCamelRow<CardState>(r));
  }

  saveCardState(card: CardState): Promise<void> { return this.upsert('card_states', card); }

  getQuizStates(profileId: string): Promise<QuizState[]> {
    return this.rows('quiz_states', { profile_id: profileId });
  }

  async getDueQuizStates(profileId: string, before: number, limit: number): Promise<QuizState[]> {
    const { data, error } = await supabase
      .from('quiz_states').select('*')
      .eq('profile_id', profileId).lte('due_at', before)
      .order('due_at', { ascending: true }).limit(limit);
    if (error) fail('select due quiz states', error.message);
    return (data ?? []).map((r) => toCamelRow<QuizState>(r));
  }

  saveQuizState(state: QuizState): Promise<void> { return this.upsert('quiz_states', state); }

  async getUnitProgress(profileId: string, unitId: string): Promise<UnitProgress | undefined> {
    return (await this.rows<UnitProgress>('unit_progress', {
      profile_id: profileId, unit_id: unitId,
    }))[0];
  }

  listUnitProgress(profileId: string): Promise<UnitProgress[]> {
    return this.rows('unit_progress', { profile_id: profileId });
  }

  async saveUnitProgress(p: UnitProgress): Promise<void> {
    const { error } = await supabase.from('unit_progress')
      .upsert(toSnakeRow(p), { onConflict: 'profile_id,unit_id' });
    if (error) fail('upsert unit_progress', error.message);
  }

  // ---- gapirish yozuvlari ----
  private speakingPath(id: string): string { return `speaking/${id}.webm`; }

  async listSpeakingLogs(profileId: string): Promise<SpeakingLogMeta[]> {
    const { data, error } = await supabase
      .from('speaking_logs')
      .select('id, profile_id, unit_id, prompt, seconds, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });
    if (error) fail('select speaking_logs', error.message);
    return (data ?? []).map((r) => toCamelRow<SpeakingLogMeta>(r));
  }

  async saveSpeakingLog(meta: SpeakingLogMeta, blob: Blob): Promise<void> {
    const path = this.speakingPath(meta.id);
    const { error: upErr } = await supabase.storage
      .from(BUCKET).upload(path, blob, { upsert: true, contentType: 'audio/webm' });
    if (upErr) fail('upload speaking', upErr.message);
    await this.upsert('speaking_logs', { ...meta, storagePath: path });
  }

  async getSpeakingAudioUrl(id: string): Promise<string | undefined> {
    const { data: signed, error } = await supabase.storage
      .from(BUCKET).createSignedUrl(this.speakingPath(id), 3600);
    if (error) return undefined;
    return signed.signedUrl;
  }

  // ---- statistika va sozlamalar ----
  async getDailyStat(profileId: string, date: string): Promise<DailyStat | undefined> {
    return (await this.rows<DailyStat>('daily_stats', {
      profile_id: profileId, date,
    }))[0];
  }

  getDailyStats(profileId: string): Promise<DailyStat[]> {
    return this.rows('daily_stats', { profile_id: profileId }, 'date');
  }

  async saveDailyStat(stat: DailyStat): Promise<void> {
    const { error } = await supabase.from('daily_stats')
      .upsert(toSnakeRow(stat), { onConflict: 'profile_id,date' });
    if (error) fail('upsert daily_stats', error.message);
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    const { data, error } = await supabase
      .from('settings').select('value').eq('key', key).maybeSingle();
    if (error) fail('select settings', error.message);
    return data ? (data.value as T) : undefined;
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    const { error } = await supabase.from('settings').upsert({ key, value });
    if (error) fail('upsert settings', error.message);
  }
}
