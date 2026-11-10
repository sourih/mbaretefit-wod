import type { Mg, PercentTenths } from '../../types';

/**
 * Carga objetivo = referencia × porcentaje.
 *
 * `reference` llega en miligramos y `percent` en décimas, así que el producto
 * se divide por 1000. Con referencias de hasta 2 decimales de kg el resultado
 * es siempre entero; si no lo fuera, es un error de programación y se avisa
 * en lugar de redondear en silencio.
 */
export function percentOf(reference: Mg, percent: PercentTenths): Mg {
  if (!Number.isInteger(reference) || !Number.isInteger(percent)) {
    throw new RangeError('percentOf espera enteros (mg y décimas de %).');
  }
  if (reference < 0 || percent < 0) {
    throw new RangeError('percentOf no acepta valores negativos.');
  }
  const product = reference * percent;
  if (product % 1000 !== 0) {
    throw new RangeError('La referencia tiene más precisión de la soportada (2 decimales de kg).');
  }
  return product / 1000;
}
