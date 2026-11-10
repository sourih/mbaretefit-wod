import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { PlateStock, StrengthRow } from '../../types';
import { formatHalfKg, formatKg, formatPercent, formatSignedKg } from '../../utils/weight';
import { LoadDetail } from '../calculator/LoadDetail';
import { PlateChips } from '../plates/PlateChips';
import { Pill } from '../ui/Pill';

/* Columnas en escritorio: % · objetivo · por lado · discos por lado · estado · flecha.
 * 64 + 112 + 112 + 1fr + 168 + 20, con 16 de separación. */
const COLUMNS = 'md:grid-cols-[64px_112px_112px_minmax(0,1fr)_168px_20px]';

function perSideText(row: StrengthRow): string | null {
  if (row.load.status === 'exact') return formatKg(row.load.perSide);
  if (row.load.status === 'approximate') return formatHalfKg(row.load.platesTotal);
  return null;
}

function Plates({ row }: { row: StrengthRow }) {
  const { load } = row;
  if (load.status === 'exact') return <PlateChips combination={load.combinations[0] ?? []} />;
  if (load.status === 'approximate') {
    const parts = [load.below, load.above]
      .filter((option) => option !== null)
      .map((option) => `${formatKg(option.total)} kg (${formatSignedKg(option.difference)})`);
    return <p className="num text-body text-muted">Más cercanas: {parts.join(' · ')}</p>;
  }
  return <p className="text-body text-muted">No alcanza el peso de la barra.</p>;
}

function Status({ row }: { row: StrengthRow }) {
  const { load } = row;
  if (load.status === 'approximate') return <Pill tone="warning">Sin exacta</Pill>;
  if (load.status === 'invalid') return <Pill tone="negative">Menor que la barra</Pill>;
  const others = load.combinations.length - 1;
  return (
    <span className="num text-small text-muted">
      {others === 0
        ? 'Única'
        : `+${others}${load.truncated ? ' o más' : ''} ${others === 1 ? 'alternativa' : 'alternativas'}`}
    </span>
  );
}

interface Props {
  rows: StrengthRow[];
  stock: readonly PlateStock[];
}

/**
 * Tabla de Strength. En escritorio es una tabla de seis columnas; en el
 * celular cada fila pasa a dos líneas. Tocar una fila abre la barra dibujada
 * y sus alternativas.
 */
export function StrengthTable({ rows, stock }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div>
      <div
        aria-hidden
        className={`hidden gap-4 px-4 pb-2 text-small text-muted md:grid ${COLUMNS}`}
      >
        <span>%</span>
        <span className="text-right">Objetivo</span>
        <span className="text-right">Por lado</span>
        <span>Discos por lado</span>
        <span className="text-right">Alternativas</span>
        <span />
      </div>
      <ul className="grid gap-1.5">
        {rows.map((row) => {
          const expanded = open === row.percent;
          const perSide = perSideText(row);
          return (
            <li key={row.percent} className="rounded-inner bg-surface">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : row.percent)}
                className="block w-full rounded-inner px-4 py-3 text-left"
              >
                {/* Celular: dos líneas */}
                <span className="grid gap-2 md:hidden">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="num text-section font-semibold">{formatPercent(row.percent)} %</span>
                    <span className="num text-section font-semibold">
                      {formatKg(row.target)}
                      <span className="pl-1 text-body font-normal text-muted">kg</span>
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <Plates row={row} />
                    </span>
                    <span className="flex flex-none items-center gap-2">
                      {row.load.status === 'exact' ? (
                        <span className="num text-small text-muted">{perSide} por lado</span>
                      ) : (
                        <Status row={row} />
                      )}
                      <ChevronDown
                        size={18}
                        aria-hidden
                        className={`text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
                      />
                    </span>
                  </span>
                </span>

                {/* Escritorio: una línea en columnas */}
                <span className={`hidden items-center gap-4 md:grid ${COLUMNS}`}>
                  <span className="num text-section font-semibold">{formatPercent(row.percent)} %</span>
                  <span className="num text-right text-section font-semibold">
                    {formatKg(row.target)}
                    <span className="pl-1 text-body font-normal text-muted">kg</span>
                  </span>
                  <span className="num text-right text-section">
                    {perSide === null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <>
                        {perSide}
                        <span className="pl-1 text-body text-muted">kg</span>
                      </>
                    )}
                  </span>
                  <span className="min-w-0">
                    <Plates row={row} />
                  </span>
                  <span className="text-right">
                    <Status row={row} />
                  </span>
                  <ChevronDown
                    size={18}
                    aria-hidden
                    className={`text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>
              {expanded && (
                <div className="px-4 pt-1 pb-4 md:max-w-[640px]">
                  <LoadDetail key={`${row.target}-${row.load.bar}`} result={row.load} stock={stock} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
