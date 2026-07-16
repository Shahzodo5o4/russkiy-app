import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { storage } from '../../storage';
import { useProfile } from '../../store/ProfileContext';
import { youtubeId } from '../../lib/youtube';
import EmptyState from '../../components/EmptyState';
import AudioList from './AudioList';
import BlockView from './BlockView';
import RulePanel from './RulePanel';
import SelectionPopover from './SelectionPopover';
import QuickAddWord from './QuickAddWord';
import UnitQuizPanel from './UnitQuizPanel';
import type { Block, Book, Resource, Rule, Unit, UnitProgress } from '../../types';

/** Dars sahifasi: bloklar + YouTube + qoida paneli + select-popover. */
export default function UnitScreen() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useProfile();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [addWord, setAddWord] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    const [u, bl, res, allRules, bks, prog] = await Promise.all([
      storage.getUnit(id),
      storage.getBlocks(id),
      storage.getResources(id),
      storage.getRules(),
      storage.getBooks(),
      storage.getUnitProgress(profile.id, id),
    ]);
    setUnit(u ?? null);
    setBlocks(bl);
    setResources(res);
    setRules(allRules.filter((r) => r.unitIds.includes(id)));
    setBooks(bks);
    setDone(prog?.blocksDone ?? []);
    setLoading(false);
  }, [id, profile.id]);

  useEffect(() => { void load(); }, [load]);

  async function toggleBlock(blockId: string) {
    if (!id) return;
    const next = done.includes(blockId)
      ? done.filter((b) => b !== blockId)
      : [...done, blockId];
    setDone(next);
    const progress: UnitProgress = {
      profileId: profile.id, unitId: id,
      state: next.length === 0 ? 'yangi'
        : next.length >= blocks.length ? 'tugadi' : 'jarayonda',
      blocksDone: next, updatedAt: Date.now(),
    };
    await storage.saveUnitProgress(progress);
  }

  if (loading) return <p className="text-muted">Yuklanmoqda…</p>;
  if (!unit) return <EmptyState message="Dars topilmadi." />;

  const bookTitle = (b: Block) =>
    b.source ? books.find((bk) => bk.id === b.source?.bookId)?.title : undefined;

  return (
    <div>
      <h1 className="text-xl font-semibold">
        {unit.order}-dars: <span className="font-ru">{unit.title}</span>
      </h1>
      <p className="mt-1 text-sm text-muted">
        {unit.topic} · {unit.grammarFocus}
        {unit.padejRef && <> · <span className="font-ru">{unit.padejRef}</span></>}
      </p>

      {blocks.length === 0 ? (
        <div className="mt-5">
          <EmptyState message="Bu dars hali to'ldirilmagan." />
          {profile.isAdmin && (
            <Link to={`/admin/units/${unit.id}`}
              className="mt-3 inline-block rounded bg-ink px-4 py-2 text-sm font-medium text-paper">
              Kontentni kiritish
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr),420px]">
          <SelectionPopover onAddWord={setAddWord}>
            <div className="grid gap-4">
              <AudioList unitId={unit.id} />
              {blocks.map((b) => (
                <BlockView key={b.id} block={b} bookTitle={bookTitle(b)}
                  done={done.includes(b.id)} onToggle={() => void toggleBlock(b.id)} />
              ))}
              <UnitQuizPanel unitId={unit.id} />
              {resources.map((r) => {
                const vid = youtubeId(r.youtubeUrl);
                return vid ? (
                  <div key={r.id} className="rounded border border-grid bg-white p-4">
                    {r.title && <h3 className="mb-2 font-medium">{r.title}</h3>}
                    <div className="aspect-video">
                      <iframe
                        className="h-full w-full rounded"
                        src={`https://www.youtube-nocookie.com/embed/${vid}`}
                        title={r.title || 'YouTube video'}
                        allowFullScreen
                      />
                    </div>
                    {r.note && <p className="mt-2 text-sm text-muted">{r.note}</p>}
                  </div>
                ) : null;
              })}
            </div>
          </SelectionPopover>
          <RulePanel rules={rules} />
        </div>
      )}

      {addWord !== null && (
        <QuickAddWord initialRu={addWord} unitId={unit.id}
          onClose={() => setAddWord(null)} />
      )}
    </div>
  );
}
