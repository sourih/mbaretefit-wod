import type {
  Combination,
  InventoryItem,
  LoadResult,
  Mg,
  NearestLoad,
  PlateStock,
} from '../../types';

/**
 * Motor de combinaciones de discos.
 *
 * Reglas que garantiza:
 *  - La carga es simétrica: se calcula UN lado y el otro es idéntico.
 *  - Total = barra + 2 × lado.
 *  - Solo usa discos del inventario y nunca más pares de los que hay
 *    (un disco suelto no sirve: hacen falta dos, uno por lado).
 *  - Aritmética entera en miligramos: no hay errores de decimales.
 *
 * Es código puro, sin React ni almacenamiento.
 */

export const DEFAULT_COMBINATION_LIMIT = 200;

/** Inventario del box → pares disponibles por lado, de mayor a menor peso. */
export function stockFromInventory(inventory: readonly InventoryItem[]): PlateStock[] {
  const quantityByWeight = new Map<Mg, number>();
  for (const item of inventory) {
    if (!Number.isInteger(item.weight) || item.weight <= 0) continue;
    const quantity = Number.isFinite(item.quantity) ? Math.max(0, Math.floor(item.quantity)) : 0;
    quantityByWeight.set(item.weight, (quantityByWeight.get(item.weight) ?? 0) + quantity);
  }
  return [...quantityByWeight.entries()]
    .map(([weight, quantity]) => ({ weight, pairs: Math.floor(quantity / 2) }))
    .filter((stock) => stock.pairs > 0)
    .sort((a, b) => b.weight - a.weight);
}

export const combinationWeight = (combination: Combination): Mg =>
  combination.reduce((sum, plate) => sum + plate.weight * plate.count, 0);

export const combinationPlateCount = (combination: Combination): number =>
  combination.reduce((sum, plate) => sum + plate.count, 0);

export const totalWeight = (bar: Mg, combination: Combination): Mg =>
  bar + 2 * combinationWeight(combination);

/** [25, 25, 2.5] para dibujar un lado, del centro hacia afuera. */
export const expandCombination = (combination: Combination): Mg[] =>
  combination.flatMap((plate) => Array.from({ length: plate.count }, () => plate.weight));

/** Clave estable de una combinación; sirve para detectar duplicados. */
export const combinationKey = (combination: Combination): string =>
  combination.map((plate) => `${plate.weight}x${plate.count}`).join('+');

/**
 * Orden de preferencia: primero menos discos; si empatan, la que usa más
 * discos pesados (comparando de mayor a menor peso).
 */
export function compareCombinations(a: Combination, b: Combination): number {
  const byCount = combinationPlateCount(a) - combinationPlateCount(b);
  if (byCount !== 0) return byCount;
  const weightsA = expandCombination(a);
  const weightsB = expandCombination(b);
  for (let i = 0; i < weightsA.length; i += 1) {
    const diff = (weightsB[i] ?? 0) - (weightsA[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Todas las combinaciones de UN lado que suman exactamente `perSide`.
 *
 * Busca por cantidad creciente de discos (1, 2, 3…) y dentro de cada cantidad
 * prueba primero los discos más pesados. Por eso el resultado ya sale en orden
 * de preferencia y, si se corta por `limit`, lo que queda afuera son siempre
 * las peores alternativas, nunca la recomendada.
 */
export function findExactCombinations(
  perSide: Mg,
  stock: readonly PlateStock[],
  limit: number = DEFAULT_COMBINATION_LIMIT,
): { combinations: Combination[]; truncated: boolean } {
  if (!Number.isInteger(perSide) || perSide < 0) return { combinations: [], truncated: false };
  if (perSide === 0) return { combinations: [[]], truncated: false };

  const plates = [...stock].filter((s) => s.pairs > 0).sort((a, b) => b.weight - a.weight);
  const totalPairs = plates.reduce((sum, s) => sum + s.pairs, 0);
  const found: Combination[] = [];
  let truncated = false;

  /** Mayor peso alcanzable con `n` discos tomados desde el índice `from`. -1 si no hay tantos. */
  const maxWith = (from: number, n: number): number => {
    let left = n;
    let sum = 0;
    for (let i = from; i < plates.length && left > 0; i += 1) {
      const plate = plates[i]!;
      const take = Math.min(plate.pairs, left);
      sum += take * plate.weight;
      left -= take;
    }
    return left === 0 ? sum : -1;
  };

  /** Menor peso alcanzable con `n` discos tomados desde el índice `from`. */
  const minWith = (from: number, n: number): number => {
    let left = n;
    let sum = 0;
    for (let i = plates.length - 1; i >= from && left > 0; i -= 1) {
      const plate = plates[i]!;
      const take = Math.min(plate.pairs, left);
      sum += take * plate.weight;
      left -= take;
    }
    return left === 0 ? sum : Number.POSITIVE_INFINITY;
  };

  const counts: number[] = new Array<number>(plates.length).fill(0);

  /** Devuelve false cuando hay que cortar toda la búsqueda (se llegó al límite). */
  const search = (index: number, remaining: Mg, platesLeft: number): boolean => {
    if (platesLeft === 0) {
      if (remaining !== 0) return true;
      if (found.length >= limit) {
        truncated = true;
        return false;
      }
      found.push(
        plates
          .map((plate, i) => ({ weight: plate.weight, count: counts[i] ?? 0 }))
          .filter((plate) => plate.count > 0),
      );
      return true;
    }
    if (index >= plates.length) return true;
    if (maxWith(index, platesLeft) < remaining || minWith(index, platesLeft) > remaining) {
      return true;
    }

    const plate = plates[index]!;
    const most = Math.min(plate.pairs, platesLeft, Math.floor(remaining / plate.weight));
    for (let count = most; count >= 0; count -= 1) {
      counts[index] = count;
      const keepGoing = search(index + 1, remaining - count * plate.weight, platesLeft - count);
      counts[index] = 0;
      if (!keepGoing) return false;
    }
    return true;
  };

  for (let size = 1; size <= totalPairs; size += 1) {
    if (!search(0, perSide, size)) break;
  }
  return { combinations: found, truncated };
}

/** Todos los pesos por lado que el inventario puede armar, de menor a mayor. Incluye 0. */
export function reachablePerSideWeights(stock: readonly PlateStock[]): Mg[] {
  let sums = new Set<Mg>([0]);
  for (const plate of stock) {
    if (plate.pairs <= 0) continue;
    const next = new Set<Mg>(sums);
    for (const sum of sums) {
      for (let count = 1; count <= plate.pairs; count += 1) {
        next.add(sum + count * plate.weight);
      }
    }
    sums = next;
  }
  return [...sums].sort((a, b) => a - b);
}

function nearest(
  perSide: Mg,
  bar: Mg,
  target: Mg,
  stock: readonly PlateStock[],
): NearestLoad | null {
  const best = findExactCombinations(perSide, stock, 1).combinations[0];
  if (!best) return null;
  const total = bar + 2 * perSide;
  return { total, perSide, difference: total - target, combination: best };
}

export interface LoadRequest {
  target: Mg;
  bar: Mg;
  stock: readonly PlateStock[];
  /** Máximo de combinaciones exactas a devolver. */
  limit?: number;
}

/**
 * Qué discos poner por lado para llegar a `target` con la barra `bar`.
 *
 * - `exact`: existe al menos una combinación exacta; vienen todas, la
 *   recomendada primero.
 * - `approximate`: no existe; vienen la carga armable más cercana por debajo
 *   y por encima, cada una con su diferencia. Nunca se mezclan con `exact`.
 * - `invalid`: el objetivo es menor que la barra o la entrada no es válida.
 */
export function calculateLoad({ target, bar, stock, limit }: LoadRequest): LoadResult {
  const validNumbers = Number.isInteger(target) && Number.isInteger(bar) && target >= 0 && bar > 0;
  if (!validNumbers) return { status: 'invalid', reason: 'entrada-invalida', target, bar };
  if (target < bar) return { status: 'invalid', reason: 'objetivo-menor-que-barra', target, bar };

  const platesTotal = target - bar;
  if (platesTotal % 2 === 0) {
    const perSide = platesTotal / 2;
    const { combinations, truncated } = findExactCombinations(perSide, stock, limit);
    if (combinations.length > 0) {
      return { status: 'exact', target, bar, perSide, combinations, truncated };
    }
  }

  let belowSide: Mg | null = null;
  let aboveSide: Mg | null = null;
  for (const side of reachablePerSideWeights(stock)) {
    const total = bar + 2 * side;
    if (total < target) belowSide = side;
    else if (total > target) {
      aboveSide = side;
      break;
    }
  }
  return {
    status: 'approximate',
    target,
    bar,
    platesTotal,
    below: belowSide === null ? null : nearest(belowSide, bar, target, stock),
    above: aboveSide === null ? null : nearest(aboveSide, bar, target, stock),
  };
}

/** Carga máxima que el box puede armar con una barra. */
export const maxLoad = (bar: Mg, stock: readonly PlateStock[]): Mg =>
  bar + 2 * stock.reduce((sum, plate) => sum + plate.weight * plate.pairs, 0);
