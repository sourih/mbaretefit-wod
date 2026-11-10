import type { Mg, PercentTenths, PlateStock, StrengthRow } from '../../types';
import { percentOf } from './percentage';
import { calculateLoad } from './plates';

export const MAX_PERCENT: PercentTenths = 2000;

export const isValidPercent = (value: number): value is PercentTenths =>
  Number.isInteger(value) && value > 0 && value <= MAX_PERCENT;

/** De menor a mayor, sin repetidos ni valores fuera de rango. */
export function normalizePercentages(values: readonly number[]): PercentTenths[] {
  return [...new Set(values.filter(isValidPercent))].sort((a, b) => a - b);
}

/** Tabla de Strength: una fila por porcentaje. */
export function buildStrengthTable(
  reference: Mg,
  bar: Mg,
  percentages: readonly PercentTenths[],
  stock: readonly PlateStock[],
  limit = 24,
): StrengthRow[] {
  return normalizePercentages(percentages).map((percent) => {
    const target = percentOf(reference, percent);
    return { percent, target, load: calculateLoad({ target, bar, stock, limit }) };
  });
}
