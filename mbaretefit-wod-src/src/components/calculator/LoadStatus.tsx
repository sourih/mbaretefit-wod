import type { LoadResult } from '../../types';
import { Pill } from '../ui/Pill';

/** Estado de una carga. Una aproximación nunca lleva la etiqueta de exacta. */
export function LoadStatus({ result }: { result: LoadResult }) {
  if (result.status === 'exact') return <Pill tone="positive">Combinación exacta</Pill>;
  if (result.status === 'approximate') return <Pill tone="warning">Sin combinación exacta</Pill>;
  return <Pill tone="negative">Menor que la barra</Pill>;
}
