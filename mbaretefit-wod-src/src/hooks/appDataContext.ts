import { createContext, useContext } from 'react';
import type { Drafts } from '../services/storage/repositories';
import type { BoxSettings, HistoryEntry, PlateStock } from '../types';

export interface AppData {
  settings: BoxSettings;
  /** Pares disponibles por lado, derivados del inventario. */
  stock: PlateStock[];
  updateSettings(recipe: (current: BoxSettings) => BoxSettings): void;
  resetSettings(): void;

  history: HistoryEntry[];
  addHistory(entry: Omit<HistoryEntry, 'id' | 'date'>): void;
  removeHistory(id: string): void;
  clearHistory(): void;

  drafts: Drafts;
  updateDraft<K extends keyof Drafts>(key: K, patch: Partial<Drafts[K]>): void;
}

export const AppDataContext = createContext<AppData | null>(null);

export function useAppData(): AppData {
  const value = useContext(AppDataContext);
  if (!value) throw new Error('useAppData necesita un <AppDataProvider>.');
  return value;
}
