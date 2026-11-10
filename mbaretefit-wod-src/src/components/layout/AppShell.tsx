import { Dumbbell, History, House, Percent, Settings, Table2, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { RouteId } from '../../types';
import { BrandMark } from '../ui/BrandMark';

interface Destination {
  id: RouteId;
  label: string;
  short: string;
  icon: LucideIcon;
}

const DESTINATIONS: Destination[] = [
  { id: 'inicio', label: 'Inicio', short: 'Inicio', icon: House },
  { id: 'rm', label: 'RM Calculator', short: 'RM', icon: Percent },
  { id: 'strength', label: 'Strength', short: 'Strength', icon: Table2 },
  { id: 'discos', label: 'Plate Calculator', short: 'Discos', icon: Dumbbell },
  { id: 'historial', label: 'Historial', short: 'Historial', icon: History },
  { id: 'ajustes', label: 'Configuración', short: 'Config.', icon: Settings },
];

/** En el celular el historial vive en la barra superior: abajo entran cinco destinos. */
const BOTTOM: readonly RouteId[] = ['inicio', 'rm', 'strength', 'discos', 'ajustes'];

interface Props {
  route: RouteId;
  children: ReactNode;
}

/*
 * Marco sin barra lateral: una barra superior con la marca y, según el ancho,
 * los destinos arriba (escritorio) o en una barra inferior al alcance del
 * pulgar (celular). El destino activo se marca solo por el brillo del texto.
 */
export function AppShell({ route, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="z-20 bg-ground md:sticky md:top-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex h-[52px] w-full max-w-[1148px] items-center gap-6 px-4 md:h-16 md:px-6">
          <a href="#inicio" className="flex items-center gap-2.5 rounded-full" aria-label="MBARETEFIT WOD, inicio">
            <BrandMark />
            <span className="text-section font-semibold">MBARETEFIT WOD</span>
          </a>
          <nav aria-label="Principal" className="ml-auto hidden items-center gap-1 md:flex">
            {DESTINATIONS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={route === item.id ? 'page' : undefined}
                className={`rounded-full px-3 py-2 text-body transition-colors ${
                  route === item.id ? 'font-medium text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="#historial"
            aria-label="Historial"
            aria-current={route === 'historial' ? 'page' : undefined}
            className={`ml-auto grid size-11 place-items-center rounded-full md:hidden ${
              route === 'historial' ? 'text-ink' : 'text-muted'
            }`}
          >
            <History size={22} aria-hidden />
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1148px] flex-1 px-4 pb-28 md:px-6 md:pb-16">{children}</main>

      <nav
        aria-label="Módulos"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-raised bg-ground pb-[env(safe-area-inset-bottom,0px)] md:hidden"
      >
        <ul className="mx-auto grid max-w-[520px] grid-cols-5">
          {DESTINATIONS.filter((item) => BOTTOM.includes(item.id)).map((item) => {
            const active = route === item.id;
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-[60px] flex-col items-center justify-center gap-1 text-small transition-colors ${
                    active ? 'font-medium text-ink' : 'text-muted'
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2 : 1.5} aria-hidden />
                  {item.short}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
