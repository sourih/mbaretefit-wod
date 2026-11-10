import type { Combination } from '../../types';
import { formatKg } from '../../utils/weight';
import { plateLook } from './plateLook';

interface Props {
  combination: Combination;
  /** true cuando la lista ya está sobre un panel interno: las fichas suben un tono. */
  onRaised?: boolean;
}

/** Los discos de un lado como fichas: la muestra de cada ficha es el disco, en chico. */
export function PlateChips({ combination, onRaised = false }: Props) {
  if (combination.length === 0) {
    return <p className="text-body text-muted">Sin discos: solo la barra.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {combination.map((plate) => {
        const look = plateLook(plate.weight);
        return (
          <li
            key={plate.weight}
            className={`num inline-flex h-8 flex-none items-center gap-2 rounded-chip px-2.5 text-body whitespace-nowrap ${
              onRaised ? 'bg-[#383838]' : 'bg-raised'
            }`}
          >
            <span
              aria-hidden
              className="rounded-[2px]"
              style={{
                width: look.thin ? 4 : 7,
                height: Math.round(look.height / 6),
                background: look.fill,
              }}
            />
            <span>
              {plate.count > 1 && <span className="text-muted">{plate.count} × </span>}
              <span className="font-medium">{formatKg(plate.weight)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
