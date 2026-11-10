import type { ReactNode } from 'react';

type Tone = 'positive' | 'warning' | 'negative' | 'neutral';

const TONES: Record<Tone, string> = {
  positive: 'bg-positive-soft text-positive',
  warning: 'bg-warning-soft text-warning',
  negative: 'bg-negative-soft text-negative',
  neutral: 'bg-raised text-ink',
};

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex h-6 flex-none items-center rounded-full px-2.5 text-small font-medium whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
