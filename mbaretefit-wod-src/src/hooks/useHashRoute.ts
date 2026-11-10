import { useCallback, useSyncExternalStore } from 'react';
import type { RouteId } from '../types';

export const ROUTES: readonly RouteId[] = [
  'inicio',
  'rm',
  'strength',
  'discos',
  'historial',
  'ajustes',
];

export function parseRoute(hash: string): RouteId {
  const id = hash.replace(/^#/, '');
  return (ROUTES as readonly string[]).includes(id) ? (id as RouteId) : 'inicio';
}

const subscribe = (onChange: () => void): (() => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};

/**
 * Navegación por hash (#rm, #strength…). No necesita servidor ni reglas de
 * reescritura, así que el build funciona igual en GitHub Pages o abierto local.
 */
export function useHashRoute(): [RouteId, (route: RouteId) => void] {
  const route = useSyncExternalStore(subscribe, () => parseRoute(window.location.hash));
  const navigate = useCallback((next: RouteId) => {
    window.location.hash = next;
    window.scrollTo(0, 0);
  }, []);
  return [route, navigate];
}
