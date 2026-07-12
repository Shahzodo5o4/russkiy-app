import { useState } from 'react';
import { storage } from '../../storage';
import { dateKey } from '../../lib/date';
import type { Block, Resource } from '../../types';

type ContentDump = {
  version: 1;
  exportedAt: string;
  books: unknown[]; units: unknown[]; blocks: Block[]; resources: Resource[];
  rules: unknown[]; decks: unknown[]; words: unknown[];
};

function download(obj: unknown, name: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Kontent eksport/import — JSON. Audio bloblar KIRMAYDI. */
export default function AdminBackup() {
  const [status, setStatus] = useState<string | null>(null);

  async function exportContent() {
    setStatus('Yig‘ilmoqda…');
    const units = await storage.getUnits();
    const blocks: Block[] = [];
    const resources: Resource[] = [];
    for (const u of units) {
      blocks.push(...(await storage.getBlocks(u.id)));
      resources.push(...(await storage.getResources(u.id)));
    }
    const dump: ContentDump = {
      version: 1, exportedAt: new Date().toISOString(),
      books: await storage.getBooks(), units, blocks, resources,
      rules: await storage.getRules(), decks: await storage.getDecks(),
      words: await storage.getWords(),
    };
    download(dump, `russkiy-content-${dateKey()}.json`);
    setStatus('Eksport tayyor ✓');
  }

  async function importContent(file: File) {
    setStatus('Import qilinmoqda…');
    try {
      const dump = JSON.parse(await file.text()) as ContentDump;
      for (const u of dump.units as never[]) await storage.saveUnit(u);
      for (const b of dump.blocks) await storage.saveBlock(b);
      for (const r of dump.resources) await storage.saveResource(r);
      for (const r of dump.rules as never[]) await storage.saveRule(r);
      for (const d of dump.decks as never[]) await storage.saveDeck(d);
      await storage.saveWords(dump.words as never[]);
      setStatus('Import tayyor ✓');
    } catch (e: unknown) {
      setStatus(`Xato: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div className="rounded border border-grid bg-white p-4">
      <h3 className="font-medium">Zaxira</h3>
      <p className="mt-1 text-sm text-muted">
        Ma'lumot Supabase'da — bu qo'shimcha JSON zaxira / bo'lishish uchun.
        Audio fayllar JSON'ga kirmaydi.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button onClick={() => void exportContent()}
          className="rounded bg-ink px-4 py-2 text-sm font-medium text-paper">
          Kontentni JSON'ga eksport
        </button>
        <label className="cursor-pointer rounded border border-grid px-4 py-2 text-sm">
          JSON'dan import
          <input type="file" accept=".json" className="hidden"
            onChange={(e) => e.target.files?.[0] && void importContent(e.target.files[0])} />
        </label>
      </div>
      {status && <p className="mt-3 text-sm text-muted">{status}</p>}
    </div>
  );
}
