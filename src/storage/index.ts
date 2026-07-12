import { SupabaseAdapter } from './SupabaseAdapter';
import type { StorageAdapter } from './StorageAdapter';

/**
 * YAGONA ALMASHTIRISH NUQTASI.
 * Boshqa adapterga o'tish uchun faqat shu qatorni o'zgartiring.
 */
export const storage: StorageAdapter = new SupabaseAdapter();

export type { StorageAdapter, AudioAssetMeta, SpeakingLogMeta } from './StorageAdapter';
