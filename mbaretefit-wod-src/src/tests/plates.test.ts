import { describe, expect, it } from 'vitest';
import { DEFAULT_INVENTORY } from '../data/defaults';
import {
  calculateLoad,
  combinationKey,
  combinationPlateCount,
  combinationWeight,
  compareCombinations,
  findExactCombinations,
  maxLoad,
  reachablePerSideWeights,
  stockFromInventory,
  totalWeight,
} from '../services/calc/plates';
import type { Combination, InventoryItem, PlateStock } from '../types';
import { kg } from '../utils/weight';

const stock = stockFromInventory(DEFAULT_INVENTORY);
const inventory = (items: Array<[number, number]>): InventoryItem[] =>
  items.map(([weight, quantity]) => ({ weight: kg(weight), kind: 'disco', quantity }));
const side = (combination: Combination): Array<[number, number]> =>
  combination.map((plate) => [plate.weight / 1_000_000, plate.count]);

describe('stockFromInventory', () => {
  it('convierte unidades del box en pares por lado', () => {
    const result = stockFromInventory(inventory([[25, 4], [10, 5], [5, 1], [2.5, 0]]));
    expect(result).toEqual<PlateStock[]>([
      { weight: kg(25), pairs: 2 },
      { weight: kg(10), pairs: 2 },
    ]);
  });

  it('ignora cantidades negativas o no numéricas', () => {
    expect(stockFromInventory(inventory([[25, -4], [20, Number.NaN]]))).toEqual([]);
  });
});

describe('calculateLoad: combinaciones exactas', () => {
  it('resuelve el ejemplo del brief: 75 kg con barra de 20 → 27,5 kg por lado', () => {
    const result = calculateLoad({ target: kg(75), bar: kg(20), stock });
    expect(result.status).toBe('exact');
    if (result.status !== 'exact') return;
    expect(result.perSide).toBe(kg(27.5));
    expect(side(result.combinations[0]!)).toEqual([[25, 1], [2.5, 1]]);
  });

  it('con la barra de 15 kg el mismo objetivo pide 30 kg por lado', () => {
    const result = calculateLoad({ target: kg(75), bar: kg(15), stock });
    expect(result.status).toBe('exact');
    if (result.status !== 'exact') return;
    expect(result.perSide).toBe(kg(30));
    expect(side(result.combinations[0]!)).toEqual([[25, 1], [5, 1]]);
  });

  it('la barra sola es una carga exacta sin discos', () => {
    const result = calculateLoad({ target: kg(20), bar: kg(20), stock });
    expect(result).toMatchObject({ status: 'exact', perSide: 0, combinations: [[]] });
  });

  it('todas las combinaciones suman lo mismo y total = barra + 2 × lado', () => {
    const result = calculateLoad({ target: kg(100), bar: kg(20), stock });
    expect(result.status).toBe('exact');
    if (result.status !== 'exact') return;
    expect(result.combinations.length).toBeGreaterThan(1);
    for (const combination of result.combinations) {
      expect(combinationWeight(combination)).toBe(kg(40));
      expect(totalWeight(kg(20), combination)).toBe(kg(100));
    }
  });

  it('no repite combinaciones', () => {
    const result = calculateLoad({ target: kg(100), bar: kg(20), stock });
    if (result.status !== 'exact') throw new Error('se esperaba exacta');
    const keys = result.combinations.map(combinationKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('ordena por menos discos y, en empate, por discos más pesados', () => {
    const result = calculateLoad({ target: kg(100), bar: kg(20), stock });
    if (result.status !== 'exact') throw new Error('se esperaba exacta');
    // 40 por lado: 25+15 y 20+20 usan 2 discos; gana 25+15 por el disco más pesado.
    expect(side(result.combinations[0]!)).toEqual([[25, 1], [15, 1]]);
    expect(side(result.combinations[1]!)).toEqual([[20, 2]]);
    const sorted = [...result.combinations].sort(compareCombinations);
    expect(sorted.map(combinationKey)).toEqual(result.combinations.map(combinationKey));
    const sizes = result.combinations.map(combinationPlateCount);
    expect([...sizes].sort((a, b) => a - b)).toEqual(sizes);
  });

  it('encuentra las mismas combinaciones que una búsqueda por fuerza bruta', () => {
    const small: PlateStock[] = [
      { weight: kg(10), pairs: 2 },
      { weight: kg(5), pairs: 3 },
      { weight: kg(2.5), pairs: 2 },
      { weight: kg(1), pairs: 2 },
      { weight: kg(0.5), pairs: 2 },
    ];
    const brute = new Set<string>();
    for (let a = 0; a <= 2; a += 1)
      for (let b = 0; b <= 3; b += 1)
        for (let c = 0; c <= 2; c += 1)
          for (let d = 0; d <= 2; d += 1)
            for (let e = 0; e <= 2; e += 1) {
              const counts = [a, b, c, d, e];
              const combination = small
                .map((plate, i) => ({ weight: plate.weight, count: counts[i]! }))
                .filter((plate) => plate.count > 0);
              if (combinationWeight(combination) === kg(17.5)) brute.add(combinationKey(combination));
            }
    const { combinations, truncated } = findExactCombinations(kg(17.5), small);
    expect(truncated).toBe(false);
    expect(new Set(combinations.map(combinationKey))).toEqual(brute);
  });

  it('avisa cuando hay más combinaciones que el límite y conserva la mejor', () => {
    const big = stockFromInventory(
      inventory([[25, 20], [20, 20], [15, 20], [10, 20], [5, 20], [2.5, 20], [2, 20], [1, 20], [0.5, 20]]),
    );
    const all = findExactCombinations(kg(60), big, 100_000);
    const cut = findExactCombinations(kg(60), big, 5);
    expect(all.truncated).toBe(false);
    expect(cut.truncated).toBe(true);
    expect(cut.combinations).toHaveLength(5);
    expect(cut.combinations.map(combinationKey)).toEqual(
      all.combinations.slice(0, 5).map(combinationKey),
    );
  });
});

describe('calculateLoad: inventario', () => {
  it('no usa discos que no existen', () => {
    const only = stockFromInventory(inventory([[20, 4], [10, 2]]));
    const result = calculateLoad({ target: kg(70), bar: kg(20), stock: only });
    // 25 por lado no se puede armar con 20 y 10.
    expect(result.status).toBe('approximate');
  });

  it('respeta la cantidad disponible de cada disco', () => {
    const only = stockFromInventory(inventory([[10, 2], [5, 2]]));
    // 20 por lado necesitaría dos discos de 10 por lado: hay un solo par.
    const result = calculateLoad({ target: kg(60), bar: kg(20), stock: only });
    expect(result.status).toBe('approximate');
    if (result.status !== 'approximate') return;
    expect(result.below?.total).toBe(kg(50));
    expect(result.above).toBeNull();
  });

  it('un disco suelto no cuenta: hacen falta dos, uno por lado', () => {
    const single = stockFromInventory(inventory([[5, 1]]));
    const result = calculateLoad({ target: kg(30), bar: kg(20), stock: single });
    expect(result.status).toBe('approximate');
    const pair = stockFromInventory(inventory([[5, 2]]));
    expect(calculateLoad({ target: kg(30), bar: kg(20), stock: pair }).status).toBe('exact');
  });

  it('nunca supera los pares disponibles en ninguna combinación', () => {
    const result = calculateLoad({ target: kg(150), bar: kg(20), stock });
    if (result.status !== 'exact') throw new Error('se esperaba exacta');
    for (const combination of result.combinations) {
      for (const plate of combination) {
        const available = stock.find((s) => s.weight === plate.weight)?.pairs ?? 0;
        expect(plate.count).toBeLessThanOrEqual(available);
      }
    }
  });

  it('con inventario vacío solo se puede cargar la barra', () => {
    const result = calculateLoad({ target: kg(60), bar: kg(20), stock: [] });
    expect(result).toMatchObject({ status: 'approximate', above: null });
    if (result.status === 'approximate') expect(result.below?.total).toBe(kg(20));
  });
});

describe('calculateLoad: sin combinación exacta', () => {
  it('ofrece la carga más cercana por debajo y por encima con su diferencia', () => {
    // 72,3 kg: (72,3 − 20) / 2 = 26,15 por lado, imposible con discos de 0,5.
    const result = calculateLoad({ target: kg(72.3), bar: kg(20), stock });
    expect(result.status).toBe('approximate');
    if (result.status !== 'approximate') return;
    expect(result.platesTotal).toBe(kg(52.3));
    expect(result.below).toMatchObject({ total: kg(72), perSide: kg(26), difference: -kg(0.3) });
    expect(result.above).toMatchObject({ total: kg(73), perSide: kg(26.5), difference: kg(0.7) });
    expect(totalWeight(kg(20), result.below!.combination)).toBe(kg(72));
    expect(totalWeight(kg(20), result.above!.combination)).toBe(kg(73));
  });

  it('un objetivo impar en gramos nunca se presenta como exacto', () => {
    const result = calculateLoad({ target: kg(60) + 1, bar: kg(20), stock });
    expect(result.status).toBe('approximate');
  });

  it('por encima de la capacidad del box solo hay opción por debajo', () => {
    const result = calculateLoad({ target: kg(500), bar: kg(20), stock });
    expect(result.status).toBe('approximate');
    if (result.status !== 'approximate') return;
    expect(result.above).toBeNull();
    expect(result.below?.total).toBe(maxLoad(kg(20), stock));
  });

  it('sin fraccionales, 62,5 kg cae entre 60 y 70', () => {
    const coarse = stockFromInventory(inventory([[25, 4], [20, 4], [10, 4], [5, 2]]));
    const result = calculateLoad({ target: kg(62.5), bar: kg(20), stock: coarse });
    if (result.status !== 'approximate') throw new Error('se esperaba aproximada');
    expect(result.below?.difference).toBe(-kg(2.5));
    expect(result.above?.difference).toBe(kg(7.5));
  });
});

describe('calculateLoad: entradas inválidas', () => {
  it('rechaza objetivos por debajo del peso de la barra', () => {
    expect(calculateLoad({ target: kg(15), bar: kg(20), stock })).toMatchObject({
      status: 'invalid',
      reason: 'objetivo-menor-que-barra',
    });
  });

  it('rechaza negativos, decimales sueltos y barras de 0 kg', () => {
    for (const [target, bar] of [[-kg(10), kg(20)], [kg(50), 0], [50.5, kg(20)], [Number.NaN, kg(20)]]) {
      expect(calculateLoad({ target: target!, bar: bar!, stock }).status).toBe('invalid');
    }
  });
});

describe('precisión decimal', () => {
  it('0,5 + 1 + 2 + 2,5 + 3 por lado suma exactamente 9 kg', () => {
    const result = calculateLoad({ target: kg(38), bar: kg(20), stock });
    expect(result.status).toBe('exact');
  });

  it('todos los pesos alcanzables son múltiplos exactos de 0,5 kg', () => {
    const reachable = reachablePerSideWeights(stock);
    expect(reachable[0]).toBe(0);
    expect(reachable.every((weight) => weight % kg(0.5) === 0)).toBe(true);
    expect(reachable.at(-1)).toBe(kg(159));
  });

  it('cada objetivo de 20 a 338 kg en pasos de 0,5 da un resultado coherente', () => {
    for (let target = kg(20); target <= kg(338); target += kg(0.5)) {
      const result = calculateLoad({ target, bar: kg(20), stock, limit: 3 });
      if (result.status === 'exact') {
        for (const combination of result.combinations) {
          expect(totalWeight(kg(20), combination)).toBe(target);
        }
      } else if (result.status === 'approximate') {
        expect(result.below!.total).toBeLessThan(target);
        expect(result.below!.total - target).toBe(result.below!.difference);
        if (result.above) expect(result.above.total).toBeGreaterThan(target);
      } else {
        throw new Error(`resultado inválido para ${target}`);
      }
    }
  });
});
