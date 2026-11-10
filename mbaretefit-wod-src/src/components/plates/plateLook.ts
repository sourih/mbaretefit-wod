import type { Mg } from '../../types';
import { kg } from '../../utils/weight';

export interface PlateLook {
  /** Alto del disco dibujado, en px (a mayor peso, más alto). */
  height: number;
  /** true para los fraccionales: se dibujan más angostos. */
  thin: boolean;
  fill: string;
  ink: string;
}

/*
 * Los discos se distinguen por alto, ancho, tono y etiqueta, sin depender de
 * un código de colores que no todos los boxes tienen: más pesado = más alto y
 * más claro. El naranja no se usa acá; es del resultado.
 */
const LOOKS = new Map<Mg, PlateLook>([
  [kg(25), { height: 120, thin: false, fill: '#ffffff', ink: '#111111' }],
  [kg(20), { height: 108, thin: false, fill: '#dadada', ink: '#111111' }],
  [kg(15), { height: 96, thin: false, fill: '#b8b8b8', ink: '#111111' }],
  [kg(10), { height: 84, thin: false, fill: '#969696', ink: '#111111' }],
  [kg(5), { height: 70, thin: false, fill: '#6e6e6e', ink: '#ffffff' }],
  [kg(3), { height: 54, thin: true, fill: '#565656', ink: '#ffffff' }],
  [kg(2.5), { height: 50, thin: true, fill: '#565656', ink: '#ffffff' }],
  [kg(2), { height: 46, thin: true, fill: '#565656', ink: '#ffffff' }],
  [kg(1), { height: 40, thin: true, fill: '#565656', ink: '#ffffff' }],
  [kg(0.5), { height: 34, thin: true, fill: '#565656', ink: '#ffffff' }],
]);

/** Aspecto de un disco. Para pesos fuera de la lista se calcula por proporción. */
export function plateLook(weight: Mg): PlateLook {
  const known = LOOKS.get(weight);
  if (known) return known;
  const ratio = Math.min(1, Math.max(0, weight / kg(25)));
  const thin = weight < kg(5);
  return {
    height: Math.round(34 + 86 * Math.sqrt(ratio)),
    thin,
    fill: thin ? '#565656' : '#969696',
    ink: thin ? '#ffffff' : '#111111',
  };
}
