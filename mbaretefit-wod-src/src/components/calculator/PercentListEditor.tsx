import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { isValidPercent, normalizePercentages } from '../../services/calc/strength';
import type { PercentTenths } from '../../types';
import { formatPercent, parsePercent } from '../../utils/weight';

interface Props {
  label: string;
  values: PercentTenths[];
  onChange(values: PercentTenths[]): void;
}

function Item({
  value,
  onCommit,
  onRemove,
  removable,
}: {
  value: PercentTenths;
  onCommit(next: PercentTenths): void;
  onRemove(): void;
  removable: boolean;
}) {
  const [text, setText] = useState(formatPercent(value));
  const commit = () => {
    const parsed = parsePercent(text);
    if (parsed !== null && isValidPercent(parsed)) onCommit(parsed);
    else setText(formatPercent(value));
  };
  return (
    <li className="flex h-11 items-center rounded-inner bg-raised pl-3">
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        inputMode="decimal"
        aria-label={`Porcentaje ${formatPercent(value)}`}
        className="num w-full min-w-0 bg-transparent text-section outline-none"
      />
      <span className="text-body text-muted">%</span>
      <button
        type="button"
        onClick={onRemove}
        disabled={!removable}
        aria-label={`Quitar ${formatPercent(value)} %`}
        className="grid size-11 flex-none place-items-center rounded-full text-muted hover:text-ink disabled:text-control"
      >
        <X size={16} aria-hidden />
      </button>
    </li>
  );
}

/** Lista editable de porcentajes: cada uno se modifica en su lugar, se quita o se agrega uno nuevo. */
export function PercentListEditor({ label, values, onChange }: Props) {
  const [draft, setDraft] = useState('');
  const parsed = parsePercent(draft);
  const canAdd = parsed !== null && isValidPercent(parsed) && !values.includes(parsed);

  const add = () => {
    if (!canAdd || parsed === null) return;
    onChange(normalizePercentages([...values, parsed]));
    setDraft('');
  };

  return (
    <div>
      <p className="mb-2 text-body font-medium">{label}</p>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {values.map((value) => (
          <Item
            key={value}
            value={value}
            removable={values.length > 1}
            onRemove={() => onChange(values.filter((item) => item !== value))}
            onCommit={(next) =>
              onChange(normalizePercentages(values.map((item) => (item === value ? next : item))))
            }
          />
        ))}
        <li className="flex h-11 items-center rounded-inner bg-raised pl-3 outline-1 -outline-offset-1 outline-control outline-dashed">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') add();
            }}
            inputMode="decimal"
            placeholder="Nuevo"
            aria-label={`Nuevo porcentaje para ${label}`}
            className="num w-full min-w-0 bg-transparent text-section outline-none placeholder:text-muted"
          />
          <span className="text-body text-muted">%</span>
          <button
            type="button"
            onClick={add}
            disabled={!canAdd}
            aria-label="Agregar porcentaje"
            className="grid size-11 flex-none place-items-center rounded-full text-ink disabled:text-control"
          >
            <Plus size={16} aria-hidden />
          </button>
        </li>
      </ul>
    </div>
  );
}
