import { createDefaultSettings, MAX_HISTORY_ENTRIES } from '../../data/defaults';
import type { BoxSettings, HistoryEntry } from '../../types';
import { sanitizeHistory, sanitizeSettings } from '../../utils/validation';
import { readJson, writeJson, type StorageAdapter } from './adapter';

export const STORAGE_KEYS = {
  settings: 'mbaretefit-wod:configuracion:v1',
  history: 'mbaretefit-wod:historial:v1',
  drafts: 'mbaretefit-wod:borradores:v1',
} as const;

export interface SettingsRepository {
  load(): BoxSettings;
  save(settings: BoxSettings): BoxSettings;
  reset(): BoxSettings;
}

export function createSettingsRepository(adapter: StorageAdapter): SettingsRepository {
  return {
    load: () => sanitizeSettings(readJson(adapter, STORAGE_KEYS.settings)),
    save(settings) {
      const clean = sanitizeSettings(settings);
      writeJson(adapter, STORAGE_KEYS.settings, clean);
      return clean;
    },
    reset() {
      adapter.remove(STORAGE_KEYS.settings);
      return createDefaultSettings();
    },
  };
}

export interface HistoryRepository {
  list(): HistoryEntry[];
  add(entry: Omit<HistoryEntry, 'id' | 'date'>): HistoryEntry[];
  remove(id: string): HistoryEntry[];
  clear(): HistoryEntry[];
}

export function createHistoryRepository(
  adapter: StorageAdapter,
  now: () => Date = () => new Date(),
): HistoryRepository {
  const list = (): HistoryEntry[] => sanitizeHistory(readJson(adapter, STORAGE_KEYS.history));
  const persist = (entries: HistoryEntry[]): HistoryEntry[] => {
    const capped = entries.slice(0, MAX_HISTORY_ENTRIES);
    writeJson(adapter, STORAGE_KEYS.history, capped);
    return capped;
  };
  return {
    list,
    add(entry) {
      const date = now();
      const id = `${date.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      return persist([{ ...entry, id, date: date.toISOString() }, ...list()]);
    },
    remove: (id) => persist(list().filter((entry) => entry.id !== id)),
    clear: () => persist([]),
  };
}

/** Lo último que el usuario dejó escrito en cada módulo, para retomarlo al volver. */
export interface Drafts {
  rm: { reference: string; percent: number; barWeight: number | null };
  strength: { reference: string; barWeight: number | null };
  discos: { barWeight: number | null; counts: Record<string, number> };
}

export const createEmptyDrafts = (): Drafts => ({
  rm: { reference: '', percent: 750, barWeight: null },
  strength: { reference: '', barWeight: null },
  discos: { barWeight: null, counts: {} },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): string => (typeof value === 'string' ? value.slice(0, 8) : '');
const weightOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;

export function sanitizeDrafts(raw: unknown): Drafts {
  const drafts = createEmptyDrafts();
  if (!isRecord(raw)) return drafts;
  if (isRecord(raw.rm)) {
    const percent = raw.rm.percent;
    drafts.rm = {
      reference: text(raw.rm.reference),
      percent:
        typeof percent === 'number' && Number.isInteger(percent) && percent > 0 && percent <= 2000
          ? percent
          : 750,
      barWeight: weightOrNull(raw.rm.barWeight),
    };
  }
  if (isRecord(raw.strength)) {
    drafts.strength = {
      reference: text(raw.strength.reference),
      barWeight: weightOrNull(raw.strength.barWeight),
    };
  }
  if (isRecord(raw.discos)) {
    const counts: Record<string, number> = {};
    if (isRecord(raw.discos.counts)) {
      for (const [weight, count] of Object.entries(raw.discos.counts)) {
        if (typeof count === 'number' && Number.isInteger(count) && count > 0 && count <= 20) {
          counts[weight] = count;
        }
      }
    }
    drafts.discos = { barWeight: weightOrNull(raw.discos.barWeight), counts };
  }
  return drafts;
}

export interface DraftsRepository {
  load(): Drafts;
  save(drafts: Drafts): void;
}

export const createDraftsRepository = (adapter: StorageAdapter): DraftsRepository => ({
  load: () => sanitizeDrafts(readJson(adapter, STORAGE_KEYS.drafts)),
  save: (drafts) => writeJson(adapter, STORAGE_KEYS.drafts, drafts),
});
