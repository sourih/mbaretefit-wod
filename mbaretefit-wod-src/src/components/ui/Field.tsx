import { useId, type InputHTMLAttributes } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> {
  label: string;
  value: string;
  onChange(value: string): void;
  suffix?: string;
  error?: string | null;
  hint?: string;
  size?: 'large' | 'regular';
}

/** Campo numérico con etiqueta arriba, unidad a la derecha y error debajo. */
export function Field({
  label,
  value,
  onChange,
  suffix,
  error,
  hint,
  size = 'regular',
  className = '',
  ...rest
}: Props) {
  const id = useId();
  const noteId = `${id}-nota`;
  const note = error ?? hint;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-body font-medium">
        {label}
      </label>
      <div
        className={`flex items-center rounded-inner bg-raised px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink ${
          size === 'large' ? 'h-14' : 'h-11'
        }`}
      >
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          className={`num w-full min-w-0 bg-transparent text-ink outline-none placeholder:text-muted ${
            size === 'large' ? 'text-figure font-semibold' : 'text-section'
          }`}
          {...rest}
        />
        {suffix && <span className="pl-2 text-body text-muted">{suffix}</span>}
      </div>
      {note && (
        <p id={noteId} className={`mt-2 text-small ${error ? 'text-negative' : 'text-muted'}`}>
          {note}
        </p>
      )}
    </div>
  );
}
