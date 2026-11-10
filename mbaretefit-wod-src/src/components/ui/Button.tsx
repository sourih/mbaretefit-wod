import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

/*
 * La acción principal se distingue por inversión (blanco sobre negro), no por
 * color: el naranja queda reservado para el resultado.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-ground font-semibold active:bg-[#d9d9d9]',
  secondary: 'bg-raised text-ink font-medium active:bg-[#363636]',
  ghost: 'text-ink font-medium underline-offset-4 hover:underline active:text-muted',
  danger: 'text-negative font-medium underline-offset-4 hover:underline',
};

export function Button({ variant = 'secondary', icon, className = '', children, ...rest }: Props) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-body whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:bg-raised disabled:text-muted disabled:no-underline ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
