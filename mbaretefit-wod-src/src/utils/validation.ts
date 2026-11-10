import {
  createDefaultSettings,
  DEFAULT_INVENTORY,
  MAX_BARS,
  MAX_HISTORY_ENTRIES,
  MAX_PLATE_QUANTITY,
} from '../data/defaults';
import { normalizePercentages } from '../services/calc/strength';
import type { Bar, BoxSettings, CalculationType, HistoryEntry, InventoryItem, Mg } from '../types';
import { kg, parseKg } from './weight';

export type Validated<T> = { ok: true; value: T } | { ok: false; message: string };

export const MAX_REFERENCE: Mg = kg(600);
export const MIN_BAR: Mg = kg(1);
export const MAX_BAR: Mg = kg(50);
const HALF_KG: Mg = kg(0.5);

/** RM o peso de referencia escrito por el usuario. */
export function validateReference(input: string): Validated<Mg> {
  if (input.trim() === '') return { ok: false, message: 'Ingresá un peso en kg.' };
  const value = parseKg(input);
  if (value === null) {
    return { ok: false, message: 'Usá solo números, con hasta 2 decimales. Ejemplo: 102,5' };
  }
  if (value <= 0) return { ok: false, message: 'El peso tiene que ser mayor que 0 kg.' };
  if (value > MAX_REFERENCE) return { ok: false, message: 'El máximo admitido es 600 kg.' };
  return { ok: true, value };
}

/** Peso de una barra: entre 1 y 50 kg, en pasos de 0,5 kg. */
export function validateBarWeight(input: string): Validated<Mg> {
  const value = parseKg(input);
  if (value === null) return { ok: false, message: 'Ingresá el peso de la barra en kg.' };
  if (value < MIN_BAR || value > MAX_BAR) {
    return { ok: false, message: 'Una barra pesa entre 1 y 50 kg.' };
  }
  if (value % HALF_KG !== 0) return { ok: false, message: 'Usá pasos de 0,5 kg.' };
  return { ok: true, value };
}

/** Cantidad de discos: entero entre 0 y el máximo. Nunca negativa. */
export function sanitizeQuantity(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_PLATE_QUANTITY, Math.max(0, Math.floor(n)));
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isMg = (value: unknown): value is Mg =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

/**
 * Lo que venga de LocalStorage (o de otro backend) se revisa campo por campo.
 * Los tipos de disco son fijos: del guardado solo se toman las cantidades.
 */
export function sanitizeSettings(raw: unknown): BoxSettings {
  const defaults = createDefaultSettings();
  if (!isRecord(raw)) return defaults;

  const savedInventory = Array.isArray(raw.inventory) ? raw.inventory.filter(isRecord) : [];
  const inventory: InventoryItem[] = DEFAULT_INVENTORY.map((item) => {
    const saved = savedInventory.find((entry) => entry.weight === item.weight);
    return { ...item, quantity: saved ? sanitizeQuantity(saved.quantity) : item.quantity };
  });

  const bars: Bar[] = [];
  if (Array.isArray(raw.bars)) {
    for (const entry of raw.bars.filter(isRecord)) {
      const { weight, id, name } = entry;
      const validWeight =
        isMg(weight) && weight >= MIN_BAR && weight <= MAX_BAR && weight % HALF_KG === 0;
      if (!validWeight || bars.some((bar) => bar.weight === weight)) continue;
      bars.push({
        id: typeof id === 'string' && id ? id : `barra-${weight}`,
        name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 40) : 'Barra',
        weight,
      });
      if (bars.length === MAX_BARS) break;
    }
  }

  const numbers = (value: unknown): number[] =>
    Array.isArray(value) ? value.filter((n): n is number => typeof n === 'number') : [];
  const rmPercentages = normalizePercentages(numbers(raw.rmPercentages));
  const strengthPercentages = normalizePercentages(numbers(raw.strengthPercentages));

  return {
    version: 1,
    unit: 'kg',
    bars: bars.length > 0 ? bars.sort((a, b) => b.weight - a.weight) : defaults.bars,
    inventory,
    rmPercentages: rmPercentages.length > 0 ? rmPercentages : defaults.rmPercentages,
    strengthPercentages:
      strengthPercentages.length > 0 ? strengthPercentages : defaults.strengthPercentages,
  };
}

const TYPES: readonly CalculationType[] = ['rm', 'strength', 'discos'];

export function sanitizeHistory(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: HistoryEntry[] = [];
  for (const item of raw.filter(isRecord)) {
    const { id, date, type, reference, percent, target, bar } = item;
    if (typeof id !== 'string' || typeof date !== 'string' || Number.isNaN(Date.parse(date))) {
      continue;
    }
    if (!TYPES.includes(type as CalculationType) || !isMg(target) || !isMg(bar)) continue;
    entries.push({
      id,
      date,
      type: type as CalculationType,
      reference: isMg(reference) ? reference : null,
      percent: isMg(percent) ? percent : null,
      target,
      bar,
    });
  }
  return entries.slice(0, MAX_HISTORY_ENTRIES);
}
