import type { Bar, BoxSettings, InventoryItem, PercentTenths } from '../types';
import { kg } from '../utils/weight';

/**
 * Inventario de arranque. Los pesos son los del brief; las cantidades son un
 * supuesto razonable para una estación (2 pares de cada disco, 1 par de cada
 * fraccional) y se ajustan en Configuración con lo que haya de verdad en el box.
 */
export const DEFAULT_INVENTORY: InventoryItem[] = [
  { weight: kg(25), kind: 'disco', quantity: 4 },
  { weight: kg(20), kind: 'disco', quantity: 4 },
  { weight: kg(15), kind: 'disco', quantity: 4 },
  { weight: kg(10), kind: 'disco', quantity: 4 },
  { weight: kg(5), kind: 'disco', quantity: 4 },
  { weight: kg(3), kind: 'fraccional', quantity: 2 },
  { weight: kg(2.5), kind: 'fraccional', quantity: 2 },
  { weight: kg(2), kind: 'fraccional', quantity: 2 },
  { weight: kg(1), kind: 'fraccional', quantity: 2 },
  { weight: kg(0.5), kind: 'fraccional', quantity: 2 },
];

export const DEFAULT_BARS: Bar[] = [
  { id: 'barra-20', name: 'Barra olímpica', weight: kg(20) },
  { id: 'barra-15', name: 'Barra olímpica', weight: kg(15) },
];

export const DEFAULT_RM_PERCENTAGES: PercentTenths[] = [
  500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000,
];

export const DEFAULT_STRENGTH_PERCENTAGES: PercentTenths[] = [
  400, 500, 600, 650, 700, 750, 800, 850, 900, 950, 1000,
];

export const createDefaultSettings = (): BoxSettings => ({
  version: 1,
  unit: 'kg',
  bars: DEFAULT_BARS.map((bar) => ({ ...bar })),
  inventory: DEFAULT_INVENTORY.map((item) => ({ ...item })),
  rmPercentages: [...DEFAULT_RM_PERCENTAGES],
  strengthPercentages: [...DEFAULT_STRENGTH_PERCENTAGES],
});

export const MAX_PLATE_QUANTITY = 40;
export const MAX_BARS = 6;
export const MAX_HISTORY_ENTRIES = 200;
