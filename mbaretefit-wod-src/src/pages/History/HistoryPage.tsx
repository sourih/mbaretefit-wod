import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAppData } from '../../hooks/appDataContext';
import { useOpenEntry } from '../../hooks/useOpenEntry';
import type { CalculationType, RouteId } from '../../types';
import { describeEntry, formatWhen, MODULE_NAMES } from '../../utils/labels';
import { formatKg } from '../../utils/weight';

type Filter = 'todos' | CalculationType;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'rm', label: 'RM' },
  { id: 'strength', label: 'Strength' },
  { id: 'discos', label: 'Discos' },
];

const EMPTY: Record<Filter, string> = {
  todos: 'Todavía no guardaste cálculos. Guardá uno desde cualquier módulo y aparece acá.',
  rm: 'No hay cálculos de RM Calculator guardados.',
  strength: 'No hay tablas de Strength guardadas.',
  discos: 'No hay barras de Plate Calculator guardadas.',
};

export function HistoryPage({ navigate }: { navigate(route: RouteId): void }) {
  const { history, removeHistory, clearHistory } = useAppData();
  const openEntry = useOpenEntry(navigate);
  const [filter, setFilter] = useState<Filter>('todos');
  const [confirming, setConfirming] = useState(false);

  const countOf = (id: Filter): number =>
    id === 'todos' ? history.length : history.filter((entry) => entry.type === id).length;
  const visible = filter === 'todos' ? history : history.filter((entry) => entry.type === filter);

  return (
    <>
      <PageHeader
        title="Historial"
        summary={
          history.length === 0
            ? 'Los cálculos que guardes quedan en este dispositivo.'
            : `${history.length} ${history.length === 1 ? 'cálculo guardado' : 'cálculos guardados'} en este dispositivo.`
        }
        action={
          history.length > 0 && (
            <Button variant="danger" className="px-0" onClick={() => setConfirming(true)}>
              Borrar todo
            </Button>
          )
        }
      />

      {/* Los contadores son el filtro: 4 iguales, separación 8 */}
      <div role="radiogroup" aria-label="Filtrar por módulo" className="grid grid-cols-4 gap-2 md:max-w-[560px]">
        {FILTERS.map((item) => {
          const selected = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setFilter(item.id)}
              className={`h-[61px] rounded-inner px-3 text-left transition-colors ${
                selected
                  ? 'bg-accent-soft outline-[1.5px] -outline-offset-[1.5px] outline-accent'
                  : 'bg-surface'
              }`}
            >
              <span className="block text-[13px] leading-[18px] text-muted">{item.label}</span>
              <span className="num block text-section font-semibold">{countOf(item.id)}</span>
            </button>
          );
        })}
      </div>

      <section className="mt-6 md:max-w-[760px]" aria-label="Cálculos guardados">
        {visible.length === 0 ? (
          <p className="rounded-inner px-4 py-6 text-body text-muted outline-1 -outline-offset-1 outline-control outline-dashed">
            {EMPTY[filter]}
          </p>
        ) : (
          <ul className="grid gap-1.5">
            {visible.map((entry) => (
              <li key={entry.id} className="flex items-stretch rounded-inner bg-surface">
                <button
                  type="button"
                  onClick={() => openEntry(entry)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-inner py-3 pl-4 text-left"
                >
                  <span className="min-w-0">
                    <span className="num block truncate text-section font-semibold">
                      {describeEntry(entry)}
                    </span>
                    <span className="num mt-0.5 block truncate text-[13px] leading-[18px] text-muted">
                      {MODULE_NAMES[entry.type]} · barra {formatKg(entry.bar)} kg · {formatWhen(entry.date)}
                    </span>
                  </span>
                  <span className="num flex-none text-section font-semibold">
                    {formatKg(entry.target)}
                    <span className="pl-1 text-body font-normal text-muted">kg</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeHistory(entry.id)}
                  aria-label={`Eliminar: ${describeEntry(entry)}, ${formatWhen(entry.date)}`}
                  className="grid w-12 flex-none place-items-center rounded-inner text-muted hover:text-ink"
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={confirming}
        title="¿Borrar todo el historial?"
        description={`Se eliminan los ${history.length} cálculos guardados en este dispositivo. No se puede deshacer.`}
        confirmLabel="Borrar todo"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          clearHistory();
          setConfirming(false);
        }}
      />
    </>
  );
}
