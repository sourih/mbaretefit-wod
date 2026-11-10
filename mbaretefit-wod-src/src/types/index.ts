/**
 * Tipos de dominio de MBARETEFIT WOD.
 *
 * Todos los pesos viajan como enteros en miligramos (`Mg`). Así 2,5 kg es
 * 2_500_000 y ningún cálculo pasa por decimales binarios: porcentajes, peso
 * por lado y sumas de discos son aritmética entera exacta.
 */
export type Mg = number;

/** Porcentaje en décimas: 75 % = 750, 72,5 % = 725. Siempre entero. */
export type PercentTenths = number;

export type PlateKind = 'disco' | 'fraccional';

/** Un tipo de disco del box y cuántas unidades físicas hay en total. */
export interface InventoryItem {
  weight: Mg;
  kind: PlateKind;
  /** Unidades totales en el box. Por lado se puede usar la mitad. */
  quantity: number;
}

export interface Bar {
  id: string;
  name: string;
  weight: Mg;
}

export type Unit = 'kg';

export interface BoxSettings {
  version: 1;
  unit: Unit;
  bars: Bar[];
  inventory: InventoryItem[];
  /** Porcentajes rápidos del RM Calculator. */
  rmPercentages: PercentTenths[];
  /** Filas de la tabla de Strength. */
  strengthPercentages: PercentTenths[];
}

/** Cuántos discos de un peso van en UN lado de la barra. */
export interface PlateCount {
  weight: Mg;
  count: number;
}

/** Discos de un lado, de mayor a menor. El otro lado es idéntico. */
export type Combination = PlateCount[];

/** Disponibilidad por lado: pares completos de cada peso. */
export interface PlateStock {
  weight: Mg;
  pairs: number;
}

export interface NearestLoad {
  /** Peso total de la barra cargada. */
  total: Mg;
  perSide: Mg;
  /** total − objetivo. Negativo por debajo, positivo por encima. */
  difference: Mg;
  combination: Combination;
}

export type InvalidReason = 'objetivo-menor-que-barra' | 'entrada-invalida';

export type LoadResult =
  | { status: 'invalid'; reason: InvalidReason; target: Mg; bar: Mg }
  | {
      status: 'exact';
      target: Mg;
      bar: Mg;
      /** Peso exacto por lado. */
      perSide: Mg;
      /** Todas las combinaciones exactas, la recomendada primero. */
      combinations: Combination[];
      /** true si existen más combinaciones que el límite pedido. */
      truncated: boolean;
    }
  | {
      status: 'approximate';
      target: Mg;
      bar: Mg;
      /** Peso de discos que haría falta sumando los dos lados (objetivo − barra). */
      platesTotal: Mg;
      below: NearestLoad | null;
      above: NearestLoad | null;
    };

export interface StrengthRow {
  percent: PercentTenths;
  target: Mg;
  load: LoadResult;
}

export type CalculationType = 'rm' | 'strength' | 'discos';

export interface HistoryEntry {
  id: string;
  /** Fecha ISO 8601. */
  date: string;
  type: CalculationType;
  /** RM o peso de referencia. null en Plate Calculator. */
  reference: Mg | null;
  /** null cuando el cálculo no usa un porcentaje único. */
  percent: PercentTenths | null;
  target: Mg;
  bar: Mg;
}

export type RouteId = 'inicio' | 'rm' | 'strength' | 'discos' | 'historial' | 'ajustes';
