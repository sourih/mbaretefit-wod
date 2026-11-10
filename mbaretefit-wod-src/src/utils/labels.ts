import type { CalculationType, Combination, HistoryEntry, RouteId } from '../types';
import { formatKg, formatPercent } from './weight';

export const MODULE_NAMES: Record<CalculationType, string> = {
  rm: 'RM Calculator',
  strength: 'Strength',
  discos: 'Plate Calculator',
};

export const MODULE_ROUTES: Record<CalculationType, RouteId> = {
  rm: 'rm',
  strength: 'strength',
  discos: 'discos',
};

/** "25 + 2,5" o "2 × 20 + 5". Vacío: "sin discos". */
export function describeCombination(combination: Combination): string {
  if (combination.length === 0) return 'sin discos';
  return combination
    .map((plate) =>
      plate.count > 1 ? `${plate.count} × ${formatKg(plate.weight)}` : formatKg(plate.weight),
    )
    .join(' + ');
}

/** Qué se calculó, en una línea: "75 % de 100 kg". */
export function describeEntry(entry: HistoryEntry): string {
  if (entry.type === 'rm' && entry.reference !== null && entry.percent !== null) {
    return `${formatPercent(entry.percent)} % de ${formatKg(entry.reference)} kg`;
  }
  if (entry.type === 'strength' && entry.reference !== null) {
    return `Tabla sobre ${formatKg(entry.reference)} kg`;
  }
  return 'Barra armada a mano';
}

const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "Hoy 14:32", "Ayer 09:10" o "8 nov 18:05". */
export function formatWhen(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (sameDay(date, now)) return `Hoy ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return `Ayer ${time}`;
  const day = date.toLocaleDateString('es', { day: 'numeric', month: 'short' }).replace('.', '');
  return `${day} ${time}`;
}
