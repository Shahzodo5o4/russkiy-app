import Markdown from '../../components/Markdown';
import type { Rule } from '../../types';

/** Darsga bog'langan qoida kartalari — desktopda o'ng panel (spec 4.4). */
export default function RulePanel({ rules }: { rules: Rule[] }) {
  if (rules.length === 0) return null;

  return (
    <aside className="grid content-start gap-3 self-start lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
      <h2 className="text-sm font-medium text-muted">Qoida kartalari</h2>
      {rules.map((r, i) => (
        <details
          key={r.id}
          open={i === 0}
          className="rounded border border-grid bg-white"
        >
          <summary className="cursor-pointer list-none px-3 py-2.5 font-ru font-medium marker:hidden [&::-webkit-details-marker]:hidden">
            {r.title}
          </summary>
          <div className="border-t border-grid px-3 py-2">
            {r.body ? (
              <div className="text-sm [&_table]:text-[13px] [&_td]:px-1.5 [&_td]:py-1 [&_th]:px-1.5 [&_th]:py-1">
                <Markdown>{r.body}</Markdown>
              </div>
            ) : (
              <p className="text-sm text-muted">hali to'ldirilmagan</p>
            )}
          </div>
        </details>
      ))}
    </aside>
  );
}
