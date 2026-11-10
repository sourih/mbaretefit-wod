import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { createMemoryAdapter } from '../services/storage/adapter';
import { STORAGE_KEYS } from '../services/storage/repositories';

const open = (route: string, adapter = createMemoryAdapter()) => {
  window.location.hash = route;
  render(<App adapter={adapter} />);
  return { user: userEvent.setup(), adapter };
};

/** El texto de una celda de "Barra · Discos · Por lado". */
const stat = (label: string): string => {
  const term = screen.getAllByText(label).find((node) => node.tagName === 'DT');
  return term?.nextElementSibling?.textContent ?? '';
};

describe('RM Calculator', () => {
  it('calcula el ejemplo del brief: 75 % de 100 kg con barra de 20', async () => {
    const { user } = open('rm');
    await user.type(screen.getByLabelText('RM de referencia'), '100');

    expect(screen.getByText('Combinación exacta')).toBeInTheDocument();
    expect(stat('Barra')).toBe('20kg');
    expect(stat('Discos')).toBe('55kg');
    expect(stat('Por lado')).toBe('27,5kg');
    expect(
      screen.getByRole('img', { name: 'Barra de 20 kg, por lado: 25 + 2,5' }),
    ).toBeInTheDocument();
  });

  it('recalcula al cambiar de barra y de porcentaje', async () => {
    const { user } = open('rm');
    await user.type(screen.getByLabelText('RM de referencia'), '100');
    await user.click(screen.getByRole('radio', { name: '15 kg' }));
    expect(stat('Por lado')).toBe('30kg');

    await user.click(screen.getByRole('radio', { name: '90 %' }));
    expect(stat('Discos')).toBe('75kg');
    expect(stat('Por lado')).toBe('37,5kg');
  });

  it('acepta un porcentaje personalizado', async () => {
    const { user } = open('rm');
    await user.type(screen.getByLabelText('RM de referencia'), '100');
    await user.click(screen.getByRole('radio', { name: 'Otro' }));
    const custom = screen.getByLabelText('Porcentaje personalizado');
    await user.clear(custom);
    await user.type(custom, '72,5');
    // 72,5 kg → 26,25 por lado: no se arma con discos de 0,5.
    expect(screen.getByText('Sin combinación exacta')).toBeInTheDocument();
    expect(screen.getByText('Más cercana por debajo')).toBeInTheDocument();
    expect(screen.getByText('Más cercana por encima')).toBeInTheDocument();
    expect(screen.queryByText('Combinación exacta')).not.toBeInTheDocument();
  });

  it('avisa cuando la carga queda por debajo de la barra', async () => {
    const { user } = open('rm');
    await user.type(screen.getByLabelText('RM de referencia'), '30');
    await user.click(screen.getByRole('radio', { name: '50 %' }));
    expect(screen.getAllByText('Menor que la barra').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Guardar en el historial' })).toBeDisabled();
  });

  it('rechaza entradas que no son un peso', async () => {
    const { user } = open('rm');
    await user.type(screen.getByLabelText('RM de referencia'), '-5');
    expect(screen.getByText(/Usá solo números/)).toBeInTheDocument();
  });

  it('muestra las alternativas exactas y permite elegir una', async () => {
    const { user } = open('rm');
    await user.type(screen.getByLabelText('RM de referencia'), '100');
    await user.click(screen.getByRole('radio', { name: '100 %' }));
    await user.click(screen.getByRole('button', { name: /alternativas exactas/ }));
    const options = screen.getAllByRole('button', { pressed: false });
    await user.click(options[0]!);
    expect(screen.getByRole('img', { name: 'Barra de 20 kg, por lado: 2 × 20' })).toBeInTheDocument();
  });

  it('guarda en el historial y persiste', async () => {
    const { user, adapter } = open('rm');
    await user.type(screen.getByLabelText('RM de referencia'), '100');
    await user.click(screen.getByRole('button', { name: 'Guardar en el historial' }));
    const stored = JSON.parse(adapter.read(STORAGE_KEYS.history) ?? '[]') as unknown[];
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ type: 'rm', percent: 750, target: 75_000_000, bar: 20_000_000 });
  });
});

describe('Strength', () => {
  it('arma la tabla y la recalcula al cambiar la barra', async () => {
    const { user } = open('strength');
    await user.type(screen.getByLabelText('Peso de referencia'), '100');
    const rows = screen.getAllByRole('listitem').filter((row) => /^\d+ %/.test(row.textContent ?? ''));
    expect(rows).toHaveLength(11);
    expect(rows[5]!.textContent).toContain('75 %');
    expect(rows[5]!.textContent).toContain('27,5');

    await user.click(screen.getByRole('radio', { name: '15 kg' }));
    const updated = screen.getAllByRole('listitem').filter((row) => /^75 %/.test(row.textContent ?? ''));
    expect(updated[0]!.textContent).toContain('30');
  });

  it('permite agregar y quitar porcentajes', async () => {
    const { user } = open('strength');
    await user.type(screen.getByLabelText('Peso de referencia'), '100');
    await user.click(screen.getByRole('button', { name: 'Editar porcentajes' }));
    await user.type(screen.getByLabelText(/Nuevo porcentaje/), '45');
    await user.click(screen.getByRole('button', { name: 'Agregar porcentaje' }));
    expect(screen.getAllByText('45 %').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Quitar 40 %' }));
    expect(screen.queryByText('40 %')).not.toBeInTheDocument();
  });
});

describe('Plate Calculator', () => {
  it('suma los discos de ambos lados y respeta el inventario', async () => {
    const { user } = open('discos');
    const add25 = screen.getByRole('button', { name: 'Agregar: discos de 25 kg por lado' });
    await user.click(add25);
    expect(stat('Discos')).toBe('50kg');
    expect(stat('Por lado')).toBe('25kg');
    await user.click(add25);
    expect(stat('Discos')).toBe('100kg');
    // Hay 2 pares de 25 kg: no se puede agregar un tercero.
    expect(add25).toBeDisabled();
  });
});

describe('Configuración e historial', () => {
  it('guarda el inventario y lo aplica a los cálculos', async () => {
    const { user, adapter } = open('ajustes');
    const remove = screen.getByRole('button', { name: 'Quitar: unidades de 2,5 kg' });
    await user.click(remove);
    await user.click(remove);
    const saved = JSON.parse(adapter.read(STORAGE_KEYS.settings) ?? '{}') as {
      inventory: Array<{ weight: number; quantity: number }>;
    };
    expect(saved.inventory.find((item) => item.weight === 2_500_000)?.quantity).toBe(0);
  });

  it('restaura los valores predeterminados con confirmación', async () => {
    const { user, adapter } = open('ajustes');
    await user.click(screen.getByRole('button', { name: 'Agregar: unidades de 25 kg' }));
    expect(adapter.read(STORAGE_KEYS.settings)).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Restaurar inventario y ajustes' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Restaurar' }));
    expect(adapter.read(STORAGE_KEYS.settings)).toBeNull();
  });

  it('lista, filtra y elimina registros del historial', async () => {
    const adapter = createMemoryAdapter({
      [STORAGE_KEYS.history]: JSON.stringify([
        { id: 'a', date: '2026-11-10T12:00:00.000Z', type: 'rm', reference: 100_000_000, percent: 750, target: 75_000_000, bar: 20_000_000 },
        { id: 'b', date: '2026-11-09T12:00:00.000Z', type: 'discos', reference: null, percent: null, target: 60_000_000, bar: 20_000_000 },
      ]),
    });
    const { user } = open('historial', adapter);
    expect(screen.getByText('75 % de 100 kg')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Discos/ }));
    expect(screen.queryByText('75 % de 100 kg')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Eliminar: Barra armada a mano/ }));
    expect(screen.getByText('No hay barras de Plate Calculator guardadas.')).toBeInTheDocument();
  });
});
