import { X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { PercentListEditor } from '../../components/calculator/PercentListEditor';
import { PageHeader } from '../../components/layout/PageHeader';
import { plateLook } from '../../components/plates/plateLook';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Field } from '../../components/ui/Field';
import { SavedStamp } from '../../components/ui/SavedStamp';
import { useStamp } from '../../hooks/useStamp';
import { Stepper } from '../../components/ui/Stepper';
import { MAX_BARS, MAX_PLATE_QUANTITY } from '../../data/defaults';
import { useAppData } from '../../hooks/appDataContext';
import { maxLoad } from '../../services/calc/plates';
import type { BoxSettings } from '../../types';
import { validateBarWeight } from '../../utils/validation';
import { formatKg } from '../../utils/weight';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 border-t border-raised py-6 first:border-t-0 first:pt-0 md:grid-cols-12 md:gap-[14px]">
      <div className="md:col-span-5 md:pt-4 md:pr-8">
        <h2 className="text-section font-medium">{title}</h2>
        <div className="mt-1 text-body text-muted">{description}</div>
      </div>
      <div className="rounded-card bg-surface p-4 md:col-span-7">{children}</div>
    </section>
  );
}

/** Configuración del box. Cada control guarda solo; no hay botón de guardar. */
export function SettingsPage() {
  const { settings, stock, updateSettings, resetSettings } = useAppData();
  const [saved, showSaved] = useStamp();
  const [newBar, setNewBar] = useState('');
  const [barError, setBarError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const change = (recipe: (current: BoxSettings) => BoxSettings) => {
    updateSettings(recipe);
    showSaved();
  };

  const addBar = () => {
    const check = validateBarWeight(newBar);
    if (!check.ok) return setBarError(check.message);
    if (settings.bars.some((bar) => bar.weight === check.value)) {
      return setBarError(`Ya hay una barra de ${formatKg(check.value)} kg.`);
    }
    change((current) => ({
      ...current,
      bars: [...current.bars, { id: `barra-${check.value}`, name: 'Barra', weight: check.value }],
    }));
    setNewBar('');
    setBarError(null);
  };

  const totalPlates = settings.inventory.reduce((sum, item) => sum + item.quantity, 0);
  const heaviestBar = settings.bars[0];

  return (
    <>
      <PageHeader
        title="Configuración"
        summary={`${settings.bars.length} ${settings.bars.length === 1 ? 'barra' : 'barras'} y ${totalPlates} discos en el box. Los cambios se guardan solos en este dispositivo.`}
        action={<SavedStamp visible={saved}>Guardado</SavedStamp>}
      />

      <Section
        title="Inventario de discos"
        description={
          <>
            <p>
              Cargá cuántos discos de cada peso hay en el box. Las combinaciones solo usan pares
              completos: uno para cada lado.
            </p>
            {heaviestBar && (
              <p className="num mt-3">
                Carga máxima con la barra de {formatKg(heaviestBar.weight)} kg:{' '}
                <span className="font-medium text-ink">
                  {formatKg(maxLoad(heaviestBar.weight, stock))} kg
                </span>
                .
              </p>
            )}
          </>
        }
      >
        <ul className="md:grid md:grid-cols-2 md:gap-x-6">
          {settings.inventory.map((item) => {
            const look = plateLook(item.weight);
            const pairs = Math.floor(item.quantity / 2);
            const spare = item.quantity % 2 === 1;
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
                    {item.kind === 'disco' ? 'Disco' : 'Fraccional'} ·{' '}
                    {item.quantity === 0
                      ? 'no hay en el box'
                      : `${pairs} ${pairs === 1 ? 'par' : 'pares'}${spare ? ' · 1 suelto sin uso' : ''}`}
                  </span>
                </span>
                <Stepper
                  label={`unidades de ${formatKg(item.weight)} kg`}
                  value={item.quantity}
                  max={MAX_PLATE_QUANTITY}
                  onChange={(quantity) =>
                    change((current) => ({
                      ...current,
                      inventory: current.inventory.map((entry) =>
                        entry.weight === item.weight ? { ...entry, quantity } : entry,
                      ),
                    }))
                  }
                />
              </li>
            );
          })}
        </ul>
      </Section>

      <Section
        title="Barras"
        description="Las barras que se pueden elegir en cada módulo. El peso va de 1 a 50 kg, en pasos de 0,5 kg."
      >
        <ul className="grid gap-1.5">
          {settings.bars.map((bar) => (
            <li key={bar.id} className="flex h-12 items-center justify-between rounded-inner bg-raised pl-4">
              <span className="num text-section font-semibold">
                {formatKg(bar.weight)}
                <span className="pl-1 text-body font-normal text-muted">kg</span>
              </span>
              <button
                type="button"
                disabled={settings.bars.length === 1}
                aria-label={`Quitar la barra de ${formatKg(bar.weight)} kg`}
                onClick={() =>
                  change((current) => ({
                    ...current,
                    bars: current.bars.filter((candidate) => candidate.id !== bar.id),
                  }))
                }
                className="grid size-12 place-items-center rounded-full text-muted hover:text-ink disabled:text-control"
              >
                <X size={18} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        {settings.bars.length === 1 && (
          <p className="mt-2 text-small text-muted">Tiene que quedar al menos una barra.</p>
        )}
        {settings.bars.length < MAX_BARS && (
          <div className="mt-4 flex items-start gap-2">
            <Field
              className="min-w-0 flex-1"
              label="Agregar una barra"
              suffix="kg"
              placeholder="10"
              value={newBar}
              onChange={(value) => {
                setNewBar(value);
                setBarError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') addBar();
              }}
              error={barError}
            />
            <Button className="mt-7" onClick={addBar} disabled={newBar.trim() === ''}>
              Agregar
            </Button>
          </div>
        )}
      </Section>

      <Section
        title="Porcentajes predeterminados"
        description="Los accesos rápidos de RM Calculator y las filas de la tabla de Strength. Tocá un valor para cambiarlo."
      >
        <div className="grid gap-6">
          <PercentListEditor
            label="Rápidos de RM Calculator"
            values={settings.rmPercentages}
            onChange={(values) => change((current) => ({ ...current, rmPercentages: values }))}
          />
          <PercentListEditor
            label="Tabla de Strength"
            values={settings.strengthPercentages}
            onChange={(values) => change((current) => ({ ...current, strengthPercentages: values }))}
          />
        </div>
      </Section>

      <Section
        title="Unidad de medida"
        description="Todos los pesos se ingresan y se muestran en esta unidad."
      >
        <p className="flex h-12 items-center justify-between rounded-inner bg-raised px-4">
          <span className="text-section font-semibold">Kilogramos</span>
          <span className="text-body text-muted">kg</span>
        </p>
        <p className="mt-2 text-small text-muted">Libras todavía no está disponible en esta versión.</p>
      </Section>

      <Section
        title="Restaurar valores predeterminados"
        description="Vuelve a las barras, el inventario y los porcentajes con los que viene la app. El historial no se borra."
      >
        <Button variant="danger" className="px-0" onClick={() => setConfirming(true)}>
          Restaurar inventario y ajustes
        </Button>
      </Section>

      <ConfirmDialog
        open={confirming}
        title="¿Restaurar los valores predeterminados?"
        description="Se reemplazan las barras, el inventario de discos y los porcentajes por los originales. No se puede deshacer."
        confirmLabel="Restaurar"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          resetSettings();
          setConfirming(false);
          showSaved();
        }}
      />
    </>
  );
}
