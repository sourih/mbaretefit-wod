interface Option<T> {
  value: T;
  label: string;
}

interface Props<T> {
  label: string;
  options: Array<Option<T>>;
  value: T;
  onChange(value: T): void;
}

/** Selector de una opción entre pocas. La elegida se marca por inversión. */
export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-[26px] bg-raised p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`num min-h-11 min-w-[72px] flex-1 rounded-full px-4 text-body transition-colors ${
              selected ? 'bg-ink font-semibold text-ground' : 'font-medium text-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
