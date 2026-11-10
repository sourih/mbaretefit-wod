import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { combinationKey, combinationPlateCount, maxLoad } from '../../services/calc/plates';
import type { Combination, LoadResult, Mg, NearestLoad, PlateStock } from '../../types';
import { formatKg, formatSignedKg } from '../../utils/weight';
import { Barbell } from '../plates/Barbell';
import { PlateChips } from '../plates/PlateChips';

const PAGE = 8;

function Alternatives({
  combinations,
  selected,
  onSelect,
  truncated,
}: {
  combinations: Combination[];
  selected: number;
  onSelect(index: number): void;
  truncated: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const count = combinations.length - 1;
  if (count < 1) {
    return <p className="mt-4 text-small text-muted">Es la única combinación exacta con tu inventario.</p>;
  }
  const visible = showAll ? combinations : combinations.slice(0, PAGE + 1);
  return (
    <div className="mt-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-inner bg-raised px-4 text-body font-medium"
      >
        <span>
          {count === 1 ? '1 alternativa exacta' : `${count}${truncated ? '+' : ''} alternativas exactas`}
        </span>
        <ChevronDown size={18} aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <ul className="mt-1 grid gap-1">
            {visible.map((combination, index) => {
              const active = index === selected;
              const plates = combinationPlateCount(combination);
              return (
                <li key={combinationKey(combination)}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSelect(index)}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-inner px-2 py-2 text-left transition-colors ${
                      active ? 'bg-raised' : 'hover:bg-raised'
                    }`}
                  >
                    <span className="grid size-5 flex-none place-items-center text-ink">
                      {active && <Check size={16} aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <PlateChips combination={combination} onRaised />
                    </span>
                    <span className="num flex-none text-small text-muted">
                      {index === 0 ? 'Recomendada' : `${plates} ${plates === 1 ? 'disco' : 'discos'}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {!showAll && combinations.length > visible.length && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-1 min-h-11 px-2 text-body font-medium underline-offset-4 hover:underline"
            >
              Mostrar las {combinations.length}
            </button>
          )}
          {truncated && (
            <p className="mt-2 px-2 text-small text-muted">
              Hay más combinaciones posibles. Se muestran las {combinations.length} que usan menos discos.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function NearestOption({ title, load, bar }: { title: string; load: NearestLoad; bar: Mg }) {
  return (
    <div className="rounded-inner bg-raised p-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-body font-medium">{title}</p>
        <p className="num text-body text-muted">{formatSignedKg(load.difference)} kg</p>
      </div>
      <p className="num mt-1 text-figure font-semibold">
        {formatKg(load.total)}
        <span className="pl-1 text-body font-normal text-muted">kg</span>
      </p>
      <Barbell bar={bar} combination={load.combination} compact />
      <p className="num mb-2 text-small text-muted">Por lado · {formatKg(load.perSide)} kg</p>
      <PlateChips combination={load.combination} onRaised />
    </div>
  );
}

interface Props {
  result: LoadResult;
  stock: readonly PlateStock[];
}

/**
 * El detalle de una carga: la barra dibujada, los discos por lado y las
 * alternativas. Si no hay combinación exacta, muestra las dos cargas armables
 * más cercanas, cada una con su diferencia.
 */
export function LoadDetail({ result, stock }: Props) {
  const [selected, setSelected] = useState(0);

  if (result.status === 'invalid') {
    return (
      <p className="text-body text-muted">
        {result.reason === 'objetivo-menor-que-barra'
          ? `La carga objetivo (${formatKg(result.target)} kg) es menor que la barra de ${formatKg(result.bar)} kg. Subí el porcentaje o usá una barra más liviana.`
          : 'Revisá los datos ingresados.'}
      </p>
    );
  }

  if (result.status === 'approximate') {
    const { below, above, bar, target } = result;
    return (
      <div>
        <p className="text-body text-muted">
          Con tu inventario no se puede armar {formatKg(target)} kg exactos. Estas son las cargas más
          cercanas:
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {below && <NearestOption title="Más cercana por debajo" load={below} bar={bar} />}
          {above ? (
            <NearestOption title="Más cercana por encima" load={above} bar={bar} />
          ) : (
            <div className="rounded-inner bg-raised p-3">
              <p className="text-body font-medium">No hay carga por encima</p>
              <p className="num mt-1 text-body text-muted">
                Tu inventario llega hasta {formatKg(maxLoad(bar, stock))} kg con esta barra.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const combination = result.combinations[selected] ?? result.combinations[0] ?? [];
  return (
    <div>
      <Barbell bar={result.bar} combination={combination} />
      <div className="mt-4 mb-2 flex items-baseline justify-between gap-3">
        <p className="num text-body font-medium">
          Por lado <span className="font-normal text-muted">· {formatKg(result.perSide)} kg</span>
        </p>
        <p className="text-small text-muted">{selected === 0 ? 'Recomendada' : 'Alternativa'}</p>
      </div>
      <PlateChips combination={combination} />
      <Alternatives
        combinations={result.combinations}
        selected={selected}
        onSelect={setSelected}
        truncated={result.truncated}
      />
    </div>
  );
}
