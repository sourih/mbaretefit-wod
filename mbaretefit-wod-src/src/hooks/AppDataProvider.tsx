import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { stockFromInventory } from '../services/calc/plates';
import { createLocalStorageAdapter, type StorageAdapter } from '../services/storage/adapter';
import {
  createDraftsRepository,
  createHistoryRepository,
  createSettingsRepository,
  type Drafts,
} from '../services/storage/repositories';
import type { BoxSettings, HistoryEntry } from '../types';
import { AppDataContext, type AppData } from './appDataContext';

interface Props {
  children: ReactNode;
  /** Se puede inyectar otro almacenamiento (pruebas, o un backend más adelante). */
  adapter?: StorageAdapter;
}

/**
 * Estado compartido de la app: configuración del box, historial y borradores.
 * Es el único lugar que habla con los repositorios.
 */
export function AppDataProvider({ children, adapter }: Props) {
  const repositories = useMemo(() => {
    const storage = adapter ?? createLocalStorageAdapter();
    return {
      settings: createSettingsRepository(storage),
      history: createHistoryRepository(storage),
      drafts: createDraftsRepository(storage),
    };
  }, [adapter]);

  const [settings, setSettings] = useState<BoxSettings>(() => repositories.settings.load());
  const [history, setHistory] = useState<HistoryEntry[]>(() => repositories.history.list());
  const [drafts, setDrafts] = useState<Drafts>(() => repositories.drafts.load());

  const updateSettings = useCallback<AppData['updateSettings']>(
    (recipe) => setSettings((current) => repositories.settings.save(recipe(current))),
    [repositories],
  );
  const resetSettings = useCallback(
    () => setSettings(repositories.settings.reset()),
    [repositories],
  );

  const addHistory = useCallback<AppData['addHistory']>(
    (entry) => setHistory(repositories.history.add(entry)),
    [repositories],
  );
  const removeHistory = useCallback(
    (id: string) => setHistory(repositories.history.remove(id)),
    [repositories],
  );
  const clearHistory = useCallback(() => setHistory(repositories.history.clear()), [repositories]);

  const updateDraft = useCallback<AppData['updateDraft']>(
    (key, patch) =>
      setDrafts((current) => {
        const next = { ...current, [key]: { ...current[key], ...patch } };
        repositories.drafts.save(next);
        return next;
      }),
    [repositories],
  );

  const stock = useMemo(() => stockFromInventory(settings.inventory), [settings.inventory]);

  const value = useMemo<AppData>(
    () => ({
      settings,
      stock,
      updateSettings,
      resetSettings,
      history,
      addHistory,
      removeHistory,
      clearHistory,
      drafts,
      updateDraft,
    }),
    [
      settings,
      stock,
      updateSettings,
      resetSettings,
      history,
      addHistory,
      removeHistory,
      clearHistory,
      drafts,
      updateDraft,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
