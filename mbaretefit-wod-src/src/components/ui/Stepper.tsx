import { Minus, Plus } from 'lucide-react';

interface Props {
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange(value: number): void;
}

/** − valor + con botones de 44 px, pensado para el pulgar. */
export function Stepper({ label, value, min = 0, max, onChange }: Props) {
  const button =
    'grid size-11 flex-none place-items-center rounded-full bg-raised text-ink transition-colors active:bg-[#363636] disabled:text-control disabled:active:bg-raised';
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <button
        type="button"
        className={button}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Quitar: ${label}`}
      >
        <Minus size={18} aria-hidden />
      </button>
      <output className="num w-9 text-center text-section font-semibold" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={button}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Agregar: ${label}`}
      >
        <Plus size={18} aria-hidden />
      </button>
    </div>
  );
}
