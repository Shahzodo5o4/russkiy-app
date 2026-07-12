type Props = {
  message: string;
  hint?: string;
};

/** Bo'sh holat — kontent hali yo'q bo'lganda. */
export default function EmptyState({ message, hint }: Props) {
  return (
    <div className="rounded border border-dashed border-grid bg-white/60 p-6 text-center">
      <p className="text-muted">{message}</p>
      {hint && <p className="mt-1 text-sm text-muted/80">{hint}</p>}
    </div>
  );
}
