import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

/** Sahifa sarlavhasi bilan umumiy o'rash. */
export default function Screen({ title, subtitle, children }: Props) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}
