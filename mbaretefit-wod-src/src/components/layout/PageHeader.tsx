import type { ReactNode } from 'react';

interface Props {
  title: string;
  /** Una frase sobre los datos de la pantalla, no sobre la interfaz. */
  summary?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, summary, action }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pt-5 pb-5 md:pt-8">
      <div className="min-w-0">
        <h1 className="text-title font-semibold">{title}</h1>
        {summary && <p className="mt-1 text-body text-muted">{summary}</p>}
      </div>
      {action}
    </header>
  );
}
