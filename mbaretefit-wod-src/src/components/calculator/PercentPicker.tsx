import { useState } from 'react';
import { isValidPercent } from '../../services/calc/strength';
import type { PercentTenths } from '../../types';
import { formatPercent, parsePercent } from '../../utils/weight';
import { Field } from '../ui/Field';

interface Props {
  presets: PercentTenths[];
  value: PercentTenths;
  onChange(value: PercentTenths): void;
}

const cell = (selected: boolean) =>
  `num min-h-11 rounded-inner text-body transition-colors ${
    selected
      ? 'bg-accent-soft font-semibold text-ink outline-[1.5px] -outline-offset-[1.5px] outline-accent'
      : 'bg-raised font-medium text-ink active:bg-[#363636]'
  }`;

/** Porcentajes rápidos más uno personalizado. El elegido lleva el único acento de la pantalla. */
export function PercentPicker({ presets, value, onChange }: Props) {
  const isCustom = !presets.includes(value);
  const [customOpen, setCustomOpen] = useState(isCustom);
  const [text, setText] = useState(isCustom ? formatPercent(value) : '');

  const parsed = parsePercent(text);
  const error =
    customOpen && text !== '' && (parsed === null || !isValidPercent(parsed))
      ? 'Ingresá un porcentaje entre 1 y 200, con un decimal como máximo.'
      : null;

  const typeCustom = (next: string) => {
    setText(next);
    const percent = parsePercent(next);
    if (percent !== null && isValidPercent(percent)) onChange(percent);
  };

  return (
    <div>
      <p className="mb-2 text-body font-medium" id="porcentaje-label">
        Porcentaje
      </p>
      <div role="radiogroup" aria-labelledby="porcentaje-label" className="grid grid-cols-4 gap-2">
        {presets.map((preset) => {
          const selected = !customOpen && preset === value;
          return (
            <button
              key={preset}
              type="button"
              role="radio"
              aria-checked={selected}
              className={cell(selected)}
              onClick={() => {
                setCustomOpen(false);
                onChange(preset);
              }}
            >
              {formatPercent(preset)} %
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={customOpen}
          className={cell(customOpen)}
          onClick={() => {
            setCustomOpen(true);
            setText(formatPercent(value));
          }}
        >
          Otro
        </button>
      </div>
      {customOpen && (
        <Field
          className="mt-3"
          label="Porcentaje personalizado"
          value={text}
          onChange={typeCustom}
          suffix="%"
          placeholder="72,5"
          error={error}
          autoFocus
        />
      )}
    </div>
  );
}
