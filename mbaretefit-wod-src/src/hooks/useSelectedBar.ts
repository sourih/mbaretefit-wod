import type { Bar, BoxSettings } from '../types';

/** La barra elegida en un módulo; si ya no existe en Configuración, la primera disponible. */
export function resolveBar(settings: BoxSettings, weight: number | null): Bar {
  const bar = settings.bars.find((candidate) => candidate.weight === weight) ?? settings.bars[0];
  if (!bar) throw new Error('La configuración siempre tiene al menos una barra.');
  return bar;
}
