import { describe, expect, it } from 'vitest';
import { createDefaultSettings, MAX_HISTORY_ENTRIES, MAX_PLATE_QUANTITY } from '../data/defaults';
import { createMemoryAdapter } from '../services/storage/adapter';
import {
  createDraftsRepository,
  createHistoryRepository,
  createSettingsRepository,
  STORAGE_KEYS,
} from '../services/storage/repositories';
import {
  sanitizeQuantity,
  sanitizeSettings,
  validateBarWeight,
  validateReference,
} from '../utils/validation';
import { kg } from '../utils/weight';

describe('validaciones', () => {
  it('las cantidades nunca son negativas ni decimales', () => {
    expect(sanitizeQuantity(-3)).toBe(0);
    expect(sanitizeQuantity(4.9)).toBe(4);
    expect(sanitizeQuantity('6')).toBe(6);
    expect(sanitizeQuantity('abc')).toBe(0);
    expect(sanitizeQuantity(999)).toBe(MAX_PLATE_QUANTITY);
  });

  it('valida el peso de referencia', () => {
    expect(validateReference('100')).toEqual({ ok: true, value: kg(100) });
    expect(validateReference('').ok).toBe(false);
    expect(validateReference('0').ok).toBe(false);
    expect(validateReference('-20').ok).toBe(false);
    expect(validateReference('700').ok).toBe(false);
  });

  it('valida el peso de una barra', () => {
    expect(validateBarWeight('7,5')).toEqual({ ok: true, value: kg(7.5) });
    expect(validateBarWeight('0').ok).toBe(false);
    expect(validateBarWeight('20,3').ok).toBe(false);
    expect(validateBarWeight('80').ok).toBe(false);
  });

  it('repara una configuración guardada con datos rotos', () => {
    const clean = sanitizeSettings({
      inventory: [{ weight: kg(25), quantity: -8 }, { weight: kg(7), quantity: 10 }],
      bars: [{ weight: kg(20) }, { weight: kg(20) }, { weight: -5 }, 'x'],
      rmPercentages: [900, 'a', 900, 0],
      strengthPercentages: [],
    });
    expect(clean.inventory.find((item) => item.weight === kg(25))?.quantity).toBe(0);
    expect(clean.inventory.some((item) => item.weight === kg(7))).toBe(false);
    expect(clean.inventory).toHaveLength(10);
    expect(clean.bars.map((bar) => bar.weight)).toEqual([kg(20)]);
    expect(clean.rmPercentages).toEqual([900]);
    expect(clean.strengthPercentages).toEqual(createDefaultSettings().strengthPercentages);
  });
});

describe('repositorios', () => {
  it('guarda, recupera y restaura la configuración', () => {
    const adapter = createMemoryAdapter();
    const repository = createSettingsRepository(adapter);
    expect(repository.load()).toEqual(createDefaultSettings());

    const edited = createDefaultSettings();
    edited.inventory[0]!.quantity = 8;
    repository.save(edited);
    expect(createSettingsRepository(adapter).load().inventory[0]!.quantity).toBe(8);

    expect(repository.reset()).toEqual(createDefaultSettings());
    expect(adapter.read(STORAGE_KEYS.settings)).toBeNull();
  });

  it('sobrevive a JSON corrupto', () => {
    const adapter = createMemoryAdapter({
      [STORAGE_KEYS.settings]: '{no es json',
      [STORAGE_KEYS.history]: '[{"id":1}]',
      [STORAGE_KEYS.drafts]: '"hola"',
    });
    expect(createSettingsRepository(adapter).load()).toEqual(createDefaultSettings());
    expect(createHistoryRepository(adapter).list()).toEqual([]);
    expect(createDraftsRepository(adapter).load().rm.percent).toBe(750);
  });

  it('agrega al historial lo más nuevo primero, y permite borrar', () => {
    const adapter = createMemoryAdapter();
    let clock = Date.parse('2026-11-10T12:00:00Z');
    const repository = createHistoryRepository(adapter, () => new Date((clock += 60_000)));
    const base = { type: 'rm', reference: kg(100), bar: kg(20) } as const;
    repository.add({ ...base, percent: 750, target: kg(75) });
    const two = repository.add({ ...base, percent: 800, target: kg(80) });

    expect(two.map((entry) => entry.percent)).toEqual([800, 750]);
    expect(two[0]!.date > two[1]!.date).toBe(true);
    expect(repository.remove(two[0]!.id).map((entry) => entry.percent)).toEqual([750]);
    expect(repository.clear()).toEqual([]);
    expect(repository.list()).toEqual([]);
  });

  it('limita el historial', () => {
    const repository = createHistoryRepository(createMemoryAdapter());
    for (let i = 0; i < MAX_HISTORY_ENTRIES + 5; i += 1) {
      repository.add({ type: 'discos', reference: null, percent: null, target: kg(60), bar: kg(20) });
    }
    expect(repository.list()).toHaveLength(MAX_HISTORY_ENTRIES);
  });
});
