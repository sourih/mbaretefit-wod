/**
 * Único punto de contacto con el almacenamiento.
 *
 * Hoy lo implementa LocalStorage. Para pasar a Supabase o Firebase alcanza con
 * escribir otro adaptador (o reemplazar los repositorios que lo usan): las
 * páginas y los hooks no conocen de dónde salen los datos.
 */
export interface StorageAdapter {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
}

export function createMemoryAdapter(initial: Record<string, string> = {}): StorageAdapter {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    read: (key) => data.get(key) ?? null,
    write: (key, value) => void data.set(key, value),
    remove: (key) => void data.delete(key),
  };
}

/**
 * LocalStorage puede no existir o estar bloqueado (modo privado, cuota llena).
 * En ese caso la app sigue funcionando con memoria y pierde los datos al cerrar.
 */
export function createLocalStorageAdapter(): StorageAdapter {
  const memory = createMemoryAdapter();
  return {
    read(key) {
      try {
        return window.localStorage.getItem(key) ?? memory.read(key);
      } catch {
        return memory.read(key);
      }
    },
    write(key, value) {
      memory.write(key, value);
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* queda en memoria */
      }
    },
    remove(key) {
      memory.remove(key);
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* nada que borrar */
      }
    },
  };
}

/** Lee y valida un valor JSON. Lo que no se pueda leer vuelve como `undefined`. */
export function readJson(adapter: StorageAdapter, key: string): unknown {
  const raw = adapter.read(key);
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

export const writeJson = (adapter: StorageAdapter, key: string, value: unknown): void =>
  adapter.write(key, JSON.stringify(value));
