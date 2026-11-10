import { describe, expect, it } from 'vitest';
import { DEFAULT_INVENTORY, DEFAULT_STRENGTH_PERCENTAGES } from '../data/defaults';
import { percentOf } from '../services/calc/percentage';
import { stockFromInventory } from '../services/calc/plates';
import { buildStrengthTable, normalizePercentages } from '../services/calc/strength';
import {
  formatKg,
  formatPercent,
  formatSignedKg,
  kg,
  parseKg,
  parsePercent,
} from '../utils/weight';

const stock = stockFromInventory(DEFAULT_INVENTORY);

describe('percentOf', () => {
  it('calcula el ejemplo del brief: 75 % de 100 kg = 75 kg', () => {
    expect(percentOf(kg(100), 750)).toBe(kg(75));
  });

  it('es exacto con decimales que en float fallan', () => {
    // En float, 102.5 * 0.7 = 71.74999999999999.
    expect(percentOf(parseKg('102,5')!, 700)).toBe(71_750_000);
    expect(formatKg(percentOf(parseKg('102,5')!, 750))).toBe('76,875');
    expect(formatKg(percentOf(parseKg('87,35')!, 725))).toBe('63,32875');
  });

  it('acepta porcentajes sobre 100', () => {
    expect(percentOf(kg(100), 1050)).toBe(kg(105));
  });

  it('rechaza negativos y no enteros', () => {
    expect(() => percentOf(-1, 500)).toThrow(RangeError);
    expect(() => percentOf(kg(100), 72.5)).toThrow(RangeError);
  });
});

describe('formato y lectura de pesos', () => {
  it('lee coma o punto sin pasar por float', () => {
    expect(parseKg('102,5')).toBe(102_500_000);
    expect(parseKg('102.5')).toBe(102_500_000);
    expect(parseKg(' 80 ')).toBe(80_000_000);
    expect(parseKg('0,05')).toBe(50_000);
  });

  it('rechaza texto, negativos y más de 2 decimales', () => {
    for (const input of ['', 'abc', '-5', '1,234', '1e3', '12,', ',5']) {
      expect(parseKg(input)).toBeNull();
    }
  });

  it('escribe con coma y sin ceros de más', () => {
    expect(formatKg(kg(27.5))).toBe('27,5');
    expect(formatKg(kg(75))).toBe('75');
    expect(formatKg(0)).toBe('0');
    expect(formatSignedKg(kg(0.5))).toBe('+0,5');
    expect(formatSignedKg(-kg(0.5))).toBe('−0,5');
  });

  it('lee y escribe porcentajes en décimas', () => {
    expect(parsePercent('72,5')).toBe(725);
    expect(parsePercent('100')).toBe(1000);
    expect(parsePercent('7.55')).toBeNull();
    expect(formatPercent(725)).toBe('72,5');
    expect(formatPercent(750)).toBe('75');
  });
});

describe('buildStrengthTable', () => {
  it('reproduce la tabla del brief para 100 kg', () => {
    const rows = buildStrengthTable(kg(100), kg(20), DEFAULT_STRENGTH_PERCENTAGES, stock);
    expect(rows.map((row) => [row.percent / 10, row.target / 1_000_000])).toEqual([
      [40, 40], [50, 50], [60, 60], [65, 65], [70, 70], [75, 75],
      [80, 80], [85, 85], [90, 90], [95, 95], [100, 100],
    ]);
    expect(rows.every((row) => row.load.status === 'exact')).toBe(true);
  });

  it('recalcula el peso por lado al cambiar la barra', () => {
    const with20 = buildStrengthTable(kg(100), kg(20), [800], stock)[0]!;
    const with15 = buildStrengthTable(kg(100), kg(15), [800], stock)[0]!;
    expect(with20.load).toMatchObject({ status: 'exact', perSide: kg(30) });
    expect(with15.load).toMatchObject({ status: 'exact', perSide: kg(32.5) });
  });

  it('marca las filas sin combinación exacta', () => {
    // 65 % de 97 kg = 63,05 kg.
    const row = buildStrengthTable(kg(97), kg(20), [650], stock)[0]!;
    expect(formatKg(row.target)).toBe('63,05');
    expect(row.load.status).toBe('approximate');
  });

  it('marca las filas que no llegan al peso de la barra', () => {
    const row = buildStrengthTable(kg(40), kg(20), [400], stock)[0]!;
    expect(row.load).toMatchObject({ status: 'invalid', reason: 'objetivo-menor-que-barra' });
  });

  it('ordena y quita porcentajes repetidos o fuera de rango', () => {
    expect(normalizePercentages([900, 500, 500, 0, -10, 2500, 72.5, 725])).toEqual([500, 725, 900]);
  });
});
