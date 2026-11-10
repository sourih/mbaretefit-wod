import { Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BarSelector } from '../../components/calculator/BarSelector';
import { PercentListEditor } from '../../components/calculator/PercentListEditor';
import { PageHeader } from '../../components/layout/PageHeader';
import { StrengthTable } from '../../components/strength/StrengthTable';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Panel } from '../../components/ui/Panel';
import { SavedStamp } from '../../components/ui/SavedStamp';
import { useStamp } from '../../hooks/useStamp';
import { useAppData } from '../../hooks/appDataContext';
import { resolveBar } from '../../hooks/useSelectedBar';
import { DEFAULT_STRENGTH_PERCENTAGES } from '../../data/defaults';
import { buildStrengthTable } from '../../services/calc/strength';
import { validateReference } from '../../utils/validation';
import { formatKg } from '../../utils/weight';

/** Módulo B: tabla completa de porcentajes sobre un peso de referencia. */
export function StrengthPage() {
  const { settings, stock, drafts, updateDraft, updateSettings, addHistory } = useAppData();
  const { reference } = drafts.strength;
  const bar = resolveBar(settings, drafts.strength.barWeight);
  const [editing, setEditing] = useState(false);
  const [saved, showSaved] = useStamp();

  const check = validateReference(reference);
  const weight = check.ok ? check.value : null;
  const rows = useMemo(
    () =>
      weight === null
        ? []
        : buildStrengthTable(weight, bar.weight, settings.strengthPercentages, stock),
    [weight, bar.weight, settings.strengthPercentages, stock],
  );
  const inexact = rows.filter((row) => row.load.status !== 'exact').length;

  const save = () => {
    if (weight === null) return;
    addHistory({ type: 'strength', reference: weight, percent: null, target: weight, bar: bar.weight });
    showSaved();
  };

  let summary = 'Todos los porcentajes de un peso de referencia, con sus discos por lado.';
  if (weight !== null) {
    const base = `${rows.length} porcentajes de ${formatKg(weight)} kg, con la barra de ${formatKg(bar.weight)} kg.`;
    summary =
      inexact === 0
        ? `${base} Todos se arman exactos.`
        : `${base} ${inexact === 1 ? '1 no se arma exacto' : `${inexact} no se arman exactos`} con tu inventario.`;
  }

  return (
    <>
      <PageHeader
        title="Strength"
        summary={summary}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SavedStamp visible={saved}>Guardado</SavedStamp>
            <Button
              icon={<Pencil size={16} aria-hidden />}
              aria-expanded={editing}
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Listo' : 'Editar porcentajes'}
            </Button>
            <Button variant="primary" onClick={save} disabled={weight === null}>
              Guardar
            </Button>
          </div>
        }
      />
      <Panel className="grid gap-5 md:grid-cols-2" aria-label="Datos">
        <Field
          label="Peso de referencia"
          size="large"
          suffix="kg"
          placeholder="100"
          value={reference}
          onChange={(value) => updateDraft('strength', { reference: value })}
          error={reference !== '' && !check.ok ? check.message : null}
        />
        <BarSelector
          bars={settings.bars}
          value={bar.weight}
          onChange={(value) => updateDraft('strength', { barWeight: value })}
        />
      </Panel>

      {editing && (
        <Panel className="mt-[14px]">
          <PercentListEditor
            label="Porcentajes de la tabla"
            values={settings.strengthPercentages}
            onChange={(values) =>
              updateSettings((current) => ({ ...current, strengthPercentages: values }))
            }
          />
          <button
            type="button"
            className="mt-3 min-h-11 text-body font-medium underline-offset-4 hover:underline"
            onClick={() =>
              updateSettings((current) => ({
                ...current,
                strengthPercentages: [...DEFAULT_STRENGTH_PERCENTAGES],
              }))
            }
          >
            Volver a los porcentajes originales
          </button>
        </Panel>
      )}

      <section className="mt-6" aria-label="Tabla de porcentajes">
        {weight === null ? (
          <p className="rounded-inner px-4 py-6 text-body text-muted outline-1 -outline-offset-1 outline-control outline-dashed">
            Ingresá un peso de referencia para armar la tabla.
          </p>
        ) : (
          <StrengthTable rows={rows} stock={stock} />
        )}
      </section>
    </>
  );
}
