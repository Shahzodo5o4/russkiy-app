import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Markdown render — jadval qo'llab-quvvatlanadi (GFM). Stil: index.css `.md`. */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
