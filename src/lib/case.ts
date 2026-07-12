/**
 * camelCase (TS) ↔ snake_case (Postgres) — faqat yuqori daraja kalitlar.
 * Ichki jsonb obyektlar (masalan Block.source) camelCase'ligicha qoladi.
 */

const toSnakeKey = (k: string): string =>
  k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());

const toCamelKey = (k: string): string =>
  k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export function toSnakeRow(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[toSnakeKey(k)] = v ?? null;
  return out;
}

export function toCamelRow<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v !== null) out[toCamelKey(k)] = v;
  }
  return out as T;
}
