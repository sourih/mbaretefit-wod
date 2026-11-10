import type { Mg } from '../../types';
import { formatHalfKg, formatKg } from '../../utils/weight';

interface Props {
  bar: Mg;
  /** Peso de los discos de los dos lados juntos. null si no aplica. */
  platesTotal: Mg | null;
}

/** Barra · discos · por lado, en una sola pieza dividida en tres. */
export function LoadStats({ bar, platesTotal }: Props) {
  const cells: Array<[string, string | null]> = [
    ['Barra', formatKg(bar)],
    ['Discos', platesTotal === null ? null : formatKg(platesTotal)],
    ['Por lado', platesTotal === null ? null : formatHalfKg(platesTotal)],
  ];
  return (
    <dl className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-inner">
      {cells.map(([label, value]) => (
        <div key={label} className="bg-raised px-3 py-2.5">
          <dt className="text-small text-muted">{label}</dt>
          <dd className="num mt-0.5 text-figure font-semibold">
            {value === null ? (
              <span className="text-section font-normal text-muted">—</span>
            ) : (
              <>
                {value}
                <span className="pl-1 text-body font-normal text-muted">kg</span>
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
