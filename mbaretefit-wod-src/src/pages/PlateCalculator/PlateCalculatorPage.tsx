import { BarSelector } from '../../components/calculator/BarSelector';
import { LoadStats } from '../../components/calculator/LoadStats';
import { PageHeader } from '../../components/layout/PageHeader';
import { Barbell } from '../../components/plates/Barbell';
import { PlateChips } from '../../components/plates/PlateChips';
import { plateLook } from '../../components/plates/plateLook';
import { Button } from '../../components/ui/Button';
import { Panel, PanelTitle } from '../../components/ui/Panel';
import { SavedStamp } from '../../components/ui/SavedStamp';
import { useStamp } from '../../hooks/useStamp';
import { Stepper } from '../../components/ui/Stepper';
import { useAppData } from '../../hooks/appDataContext';
import { resolveBar } from '../../hooks/useSelectedBar';
import { combinationPlateCount, combinationWeight, totalWeight } from '../../services/calc/plates';
import type { Combination } from '../../types';
import { formatKg } from '../../utils/weight';

/** Módulo C: armar la barra a mano y ver cuánto pesa. */
export function PlateCalculatorPage() {
  const { settings, stock, drafts, updateDraft, addHistory } = useAppData();
  const bar = resolveBar(settings, drafts.discos.barWeight);
  const [saved, showSaved] = useStamp();

  const pairsOf = (weight: number): number =>
    stock.find((plate) => plate.weight === weight)?.pairs ?? 0;

  // Lo guardado se recorta a lo que hoy hay en el inventario.
  const combination: Combination = settings.inventory
    .map((item) => ({
      weight: item.weight,
      count: Math.min(drafts.discos.counts[String(item.weight)] ?? 0, pairsOf(item.weight)),
    }))
    .filter((plate) => plate.count > 0);

  const total = totalWeight(bar.weight, combination);
  const perSideCount = combinationPlateCount(combination);

  const setCount = (weight: number, count: number) => {
    const counts = { ...drafts.discos.counts };
    if (count > 0) counts[String(weight)] = count;
    else delete counts[String(weight)];
    updateDraft('discos', { counts });
  };

  const save = () => {
    addHistory({ type: 'discos', reference: null, percent: null, target: total, bar: bar.weight });
    showSaved();
  };

  return (
    <>
      <PageHeader
        title="Plate Calculator"
        summary={
          perSideCount === 0
            ? `La barra de ${formatKg(bar.weight)} kg, sin discos.`
            : `Barra de ${formatKg(bar.weight)} kg con ${perSideCount} ${perSideCount === 1 ? 'disco' : 'discos'} por lado.`
        }
      />
      {/* 12 columnas, separación 14: 7 + 5 */}
      <div className="grid gap-[14px]">
        <Panel aria-live="polite">
          <PanelTitle>Peso total</PanelTitle>
          <p className="num mt-2 text-answer font-semibold text-accent">
            {formatKg(total)}
            <span className="pl-1.5 text-section font-normal text-muted">kg</span>
          </p>
          <div className="mt-4">
            <LoadStats bar={bar.weight} platesTotal={2 * combinationWeight(combination)} />
          </div>
          <div className="mt-5">
            <Barbell bar={bar.weight} combination={combination} />
          </div>
          <p className="mt-4 mb-2 text-body font-medium">Por lado</p>
          <PlateChips combination={combination} />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={save}>
              Guardar en el historial
            </Button>
            <Button onClick={() => updateDraft('discos', { counts: {} })} disabled={perSideCount === 0}>
              Vaciar la barra
            </Button>
            <SavedStamp visible={saved}>Guardado</SavedStamp>
          </div>
        </Panel>

        <Panel aria-label="Discos">
          <BarSelector
            bars={settings.bars}
            value={bar.weight}
            onChange={(weight) => updateDraft('discos', { barWeight: weight })}
          />
          <p className="mt-5 mb-1 text-body font-medium">Discos por lado</p>
          <ul className="md:grid md:grid-cols-2 md:gap-x-8 lg:grid-cols-3">
            {settings.inventory.map((item) => {
              const pairs = pairsOf(item.weight);
              const count = Math.min(drafts.discos.counts[String(item.weight)] ?? 0, pairs);
              const look = plateLook(item.weight);
              return (
                <li key={item.weight} className="flex h-[56px] items-center gap-3">
                  <span className="grid w-3 flex-none place-items-center" aria-hidden>
                    <span
                      className="rounded-[2px]"
                      style={{
                        width: look.thin ? 5 : 9,
                        height: Math.round(look.height / 3.6),
                        background: look.fill,
                      }}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="num block truncate text-section font-semibold">
                      {formatKg(item.weight)}
                      <span className="pl-1 text-body font-normal text-muted">kg</span>
                    </span>
                    <span className="num block truncate text-[13px] leading-[18px] text-muted">
                      {pairs === 0
                        ? 'Sin pares en el box'
                        : `${pairs} ${pairs === 1 ? 'par' : 'pares'} en el box`}
                    </span>
                  </span>
                  <Stepper
                    label={`discos de ${formatKg(item.weight)} kg por lado`}
                    value={count}
                    max={pairs}
                    onChange={(next) => setCount(item.weight, next)}
                  />
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </>
  );
}
