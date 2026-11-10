import type { HTMLAttributes } from 'react';

/** Tarjeta: un paso de luminosidad sobre el fondo. Sin borde ni sombra. */
export function Panel({ className = '', ...rest }: HTMLAttributes<HTMLElement>) {
  return <section className={`rounded-card bg-surface p-4 md:p-[22px] ${className}`} {...rest} />;
}

export function PanelTitle({ className = '', ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-section font-semibold ${className}`} {...rest} />;
}
