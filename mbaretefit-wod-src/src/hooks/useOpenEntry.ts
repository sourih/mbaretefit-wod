import { useCallback } from 'react';
import { calculateLoad } from '../services/calc/plates';
import type { HistoryEntry, RouteId } from '../types';
import { MODULE_ROUTES } from '../utils/labels';
import { toInputKg } from '../utils/weight';
import { useAppData } from './appDataContext';

/** Vuelve a abrir un cálculo del historial en su módulo, con sus datos cargados. */
export function useOpenEntry(navigate: (route: RouteId) => void): (entry: HistoryEntry) => void {
  const { updateDraft, stock } = useAppData();
  return useCallback(
    (entry: HistoryEntry) => {
      if (entry.type === 'rm' && entry.reference !== null) {
        updateDraft('rm', {
          reference: toInputKg(entry.reference),
          percent: entry.percent ?? 1000,
          barWeight: entry.bar,
        });
      } else if (entry.type === 'strength' && entry.reference !== null) {
        updateDraft('strength', { reference: toInputKg(entry.reference), barWeight: entry.bar });
      } else if (entry.type === 'discos') {
        const load = calculateLoad({ target: entry.target, bar: entry.bar, stock, limit: 1 });
        const counts: Record<string, number> = {};
        if (load.status === 'exact') {
          for (const plate of load.combinations[0] ?? []) counts[String(plate.weight)] = plate.count;
        }
        updateDraft('discos', { barWeight: entry.bar, counts });
      }
      navigate(MODULE_ROUTES[entry.type]);
    },
    [navigate, stock, updateDraft],
  );
}
