import type { Mg, PercentTenths } from '../types';

export const MG_PER_KG = 1_000_000;

/** Solo para constantes de datos (25, 2.5, 0.5…). Nunca para entradas del usuario. */
export const kg = (value: number): Mg => Math.round(value * MG_PER_KG);

/**
 * Convierte lo que escribe el usuario ("102,5", "102.5", "80") a miligramos
 * sin pasar por float. Acepta hasta 2 decimales. Devuelve null si no es válido.
 */
export function parseKg(input: string): Mg | null {
  const match = /^(\d{1,4})(?:[.,](\d{1,2}))?$/.exec(input.trim());
  if (!match) return null;
  const whole = Number(match[1]);
  const decimals = (match[2] ?? '').padEnd(2, '0');
  return whole * MG_PER_KG + Number(decimals) * (MG_PER_KG / 100);
}

/** "72,5" → 725. Acepta un decimal. Devuelve null si no es válido. */
export function parsePercent(input: string): PercentTenths | null {
  const match = /^(\d{1,3})(?:[.,](\d))?$/.exec(input.trim());
  if (!match) return null;
  return Number(match[1]) * 10 + Number(match[2] ?? '0');
}

/** Escribe un entero con `decimals` decimales implícitos: exacto, con coma y sin ceros de más. */
function formatScaled(value: number, decimals: number): string {
  const sign = value < 0 ? '−' : '';
  const digits = String(Math.abs(value)).padStart(decimals + 1, '0');
  const whole = digits.slice(0, -decimals);
  const fraction = digits.slice(-decimals).replace(/0+$/, '');
  return fraction ? `${sign}${whole},${fraction}` : `${sign}${whole}`;
}

/** 27_500_000 → "27,5". Exacto: recorta ceros, nunca redondea. */
export const formatKg = (value: Mg): string => formatScaled(value, 6);

/** La mitad exacta de un peso (peso por lado), aunque el peso sea impar en mg. */
export const formatHalfKg = (value: Mg): string => formatScaled(value * 5, 7);

/** Diferencia con signo explícito: "+0,5" o "−0,5". */
export function formatSignedKg(value: Mg): string {
  return value > 0 ? `+${formatKg(value)}` : formatKg(value);
}

/** 725 → "72,5"; 750 → "75". */
export const formatPercent = (value: PercentTenths): string => formatScaled(value, 1);

/** Valor para un <input>: como formatKg, con el signo menos del teclado. */
export const toInputKg = (value: Mg): string => formatKg(value).replace('−', '-');
