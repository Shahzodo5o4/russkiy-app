import Markdown from '../../components/Markdown';
import type { Block } from '../../types';

const KIND_LABELS: Record<Block['kind'], string> = {
  dialog: 'Dialog', grammar: 'Grammatika', exercise: 'Mashq',
  text: 'Matn', note: 'Izoh',
};

type Props = {
  block: Block;
  bookTitle?: string;
  done: boolean;
  onToggle: () => void;
};

/** Bitta dars bloki: sarlavha + manba + Markdown + ✓ checkbox. */
export default function BlockView({ block, bookTitle, done, onToggle }: Props) {
  const pages = block.source?.pageFrom
    ? `, ${block.source.pageFrom}${block.source.pageTo ? `–${block.source.pageTo}` : ''}-bet`
    : '';

  return (
    <section className={`rounded border bg-white p-4 ${done ? 'border-ok/50' : 'border-grid'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rounded bg-paper px-1.5 py-0.5 font-mono text-sm text-muted">
            {KIND_LABELS[block.kind]}
          </span>
          {block.title && <h3 className="mt-1 font-medium">{block.title}</h3>}
          {bookTitle && (
            <p className="mt-0.5 text-sm text-muted">({bookTitle}{pages})</p>
          )}
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm text-muted">
          <input type="checkbox" checked={done} onChange={onToggle} className="h-4 w-4" />
          {done ? <span className="text-ok">bajarildi</span> : 'bajarildi'}
        </label>
      </div>
      <div className="ru-text mt-3">
        <Markdown>{block.body}</Markdown>
      </div>
    </section>
  );
}
