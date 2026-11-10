import { ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Barbell } from '../../components/plates/Barbell';
import { plateLook } from '../../components/plates/plateLook';
import { PlateChips } from '../../components/plates/PlateChips';
import { Button } from '../../components/ui/Button';
import { Panel, PanelTitle } from '../../components/ui/Panel';
import { useAppData } from '../../hooks/appDataContext';
import { useOpenEntry } from '../../hooks/useOpenEntry';
import { calculateLoad, maxLoad } from '../../services/calc/plates';
import type { RouteId } from '../../types';
import { describeEntry, formatWhen, MODULE_NAMES } from '../../utils/labels';
import { formatKg } from '../../utils/weight';

const MODULES: Array<{ route: RouteId; name: string; does: string }> = [
  { route: 'rm', name: 'RM Calculator', does: 'Un porcentaje de tu RM y sus discos por lado.' },
  { route: 'strength', name: 'Strength', does: 'La tabla completa de porcentajes de un peso.' },
  { route: 'discos', name: 'Plate Calculator', does: 'Armá la barra a mano y mirá cuánto pesa.' },
];

export function HomePage({ navigate }: { navigate(route: RouteId): void }) {
  const { history, settings, stock } = useAppData();
  const openEntry = useOpenEntry(navigate);
  const [last, ...rest] = history;
  const recent = rest.slice(0, 3);

  const lastLoad =
    last && last.type !== 'strength'
      ? calculateLoad({ target: last.target, bar: last.bar, stock, limit: 1 })
      : null;
  const totalPlates = settings.inventory.reduce((sum, item) => sum + item.quantity, 0);
  const mainBar = settings.bars[0];

  const modules = (wide = false) => (
    <ul className={wide ? 'md:grid md:grid-cols-3 md:gap-x-6' : undefined}>
      {MODULES.map((module) => (
        <li key={module.route}>
          <a href={`#${module.route}`} className="flex min-h-[76px] items-center gap-3 rounded-inner">
            <span className="min-w-0 flex-1">
              <span className="block text-section font-semibold">{module.name}</span>
              <span className="block text-body text-muted">{module.does}</span>
            </span>
            <ChevronRight size={18} aria-hidden className="flex-none text-muted" />
          </a>
        </li>
      ))}
    </ul>
  );

  const box = (wide = false) => (
    <Panel>
      <div className="flex items-baseline justify-between gap-3">
        <PanelTitle>Tu box</PanelTitle>
        <a href="#ajustes" className="text-body font-medium underline-offset-4 hover:underline">
          Configurar
        </a>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-0.5 overflow-hidden rounded-inner">
        <div className="bg-raised px-3 py-2.5">
          <dt className="text-small text-muted">Barras</dt>
          <dd className="num mt-0.5 text-figure font-semibold">
            {settings.bars.map((bar) => formatKg(bar.weight)).join(' · ')}
            <span className="pl-1 text-body font-normal text-muted">kg</span>
          </dd>
        </div>
        <div className="bg-raised px-3 py-2.5">
          <dt className="text-small text-muted">Discos</dt>
          <dd className="num mt-0.5 text-figure font-semibold">{totalPlates}</dd>
        </div>
        <div className="bg-raised px-3 py-2.5">
          <dt className="text-small text-muted">Carga máxima</dt>
          <dd className="num mt-0.5 text-figure font-semibold">
            {mainBar ? formatKg(maxLoad(mainBar.weight, stock)) : '—'}
            <span className="pl-1 text-body font-normal text-muted">kg</span>
          </dd>
        </div>
      </dl>
      <p className="mt-4 mb-1 text-body font-medium">Discos, por par</p>
      <ul className={`grid gap-x-6 ${wide ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2'}`}>
        {settings.inventory.map((item) => {
          const pairs = Math.floor(item.quantity / 2);
          const look = plateLook(item.weight);
          return (
            <li key={item.weight} className="flex h-9 items-center gap-2">
              <span
                aria-hidden
                className="flex-none rounded-[2px]"
                style={{
                  width: look.thin ? 4 : 7,
                  height: Math.round(look.height / 5),
                  background: look.fill,
                }}
              />
              <span className="num flex-1 text-body">{formatKg(item.weight)} kg</span>
              <span className="num text-body text-muted">
                {pairs === 0 ? '—' : `${pairs} ${pairs === 1 ? 'par' : 'pares'}`}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );

  // Primer uso: sin cálculos guardados, los módulos ocupan el lugar del resultado.
  if (!last) {
    return (
      <>
        <PageHeader title="Inicio" summary="La fuerza está en vos." />
        <div className="grid gap-[14px]">
          <Panel>
            <div className="grid items-start gap-6 md:grid-cols-12">
              <div className="md:col-span-5">
                <PanelTitle>Empezá por tu RM</PanelTitle>
                <p className="mt-1 text-body text-muted">
                  Ingresá tu máximo y la app te dice la carga del día y qué discos poner en cada
                  lado, con los que hay de verdad en tu box.
                </p>
                <Button variant="primary" className="mt-4" onClick={() => navigate('rm')}>
                  Calcular con mi RM
                </Button>
              </div>
              <div className="md:col-span-7">
                {mainBar && <Barbell bar={mainBar.weight} combination={[]} />}
                <p className="num mt-2 text-body text-muted">
                  La barra sola pesa {mainBar ? formatKg(mainBar.weight) : '—'} kg. Cada módulo te
                  dibuja los discos que van de cada lado.
                </p>
              </div>
            </div>
            <div className="mt-2">{modules(true)}</div>
          </Panel>
          {box(true)}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Inicio" summary="La fuerza está en vos." />
      {/* 12 columnas, separación 14: 7 + 5 */}
      <div className="grid items-start gap-[14px] md:grid-cols-12">
        <div className="grid gap-[14px] md:col-span-7">
          <Panel>
            <PanelTitle>Último cálculo</PanelTitle>
            <p className="num mt-1 text-body text-muted">
              {describeEntry(last)} · {MODULE_NAMES[last.type]} · {formatWhen(last.date)}
            </p>
            <p className="num mt-2 text-answer font-semibold text-accent">
              {formatKg(last.target)}
              <span className="pl-1.5 text-section font-normal text-muted">kg</span>
            </p>
            {lastLoad?.status === 'exact' && (
              <div className="mt-3">
                <Barbell bar={last.bar} combination={lastLoad.combinations[0] ?? []} />
                <p className="num mt-4 mb-2 text-body font-medium">
                  Por lado{' '}
                  <span className="font-normal text-muted">· {formatKg(lastLoad.perSide)} kg</span>
                </p>
                <PlateChips combination={lastLoad.combinations[0] ?? []} />
              </div>
            )}
            {last.type === 'strength' && (
              <p className="num mt-1 text-body text-muted">
                Peso de referencia, con la barra de {formatKg(last.bar)} kg.
              </p>
            )}
            {lastLoad && lastLoad.status !== 'exact' && (
              <p className="mt-2 text-body text-muted">
                Con el inventario actual esta carga no se arma exacta. Abrila para ver las más
                cercanas.
              </p>
            )}
            <Button variant="primary" className="mt-5" onClick={() => openEntry(last)}>
              Retomar
            </Button>
          </Panel>

          {recent.length > 0 && (
            <Panel>
              <div className="flex items-baseline justify-between gap-3">
                <PanelTitle>Anteriores</PanelTitle>
                <a href="#historial" className="text-body font-medium underline-offset-4 hover:underline">
                  Ver los {history.length}
                </a>
              </div>
              <ul className="mt-2">
                {recent.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => openEntry(entry)}
                      className="flex min-h-14 w-full items-center justify-between gap-3 text-left"
                    >
                      <span className="min-w-0">
                        <span className="num block truncate text-body font-medium">
                          {describeEntry(entry)}
                        </span>
                        <span className="num block truncate text-[13px] leading-[18px] text-muted">
                          {MODULE_NAMES[entry.type]} · {formatWhen(entry.date)}
                        </span>
                      </span>
                      <span className="num flex-none text-section font-semibold">
                        {formatKg(entry.target)}
                        <span className="pl-1 text-body font-normal text-muted">kg</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="grid gap-[14px] md:col-span-5">
          <Panel>
            <PanelTitle>Módulos</PanelTitle>
            <div className="mt-2">{modules()}</div>
          </Panel>
          {box()}
        </div>
      </div>
    </>
  );
}
