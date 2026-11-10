import { useElementWidth } from '../../hooks/useElementWidth';
import { expandCombination } from '../../services/calc/plates';
import type { Combination, Mg } from '../../types';
import { describeCombination } from '../../utils/labels';
import { formatKg } from '../../utils/weight';
import { plateLook } from './plateLook';

interface Props {
  bar: Mg;
  /** Discos de UN lado. El dibujo los repite en espejo: la carga siempre es simétrica. */
  combination: Combination;
  /** Versión baja para listas y opciones secundarias. */
  compact?: boolean;
}

interface Sizing {
  disc: number;
  thin: number;
  gap: number;
  discLabel: 'flat' | 'upright' | 'none';
  thinLabel: 'upright' | 'none';
}

const SIZINGS: Sizing[] = [
  { disc: 28, thin: 16, gap: 2, discLabel: 'flat', thinLabel: 'upright' },
  { disc: 16, thin: 10, gap: 2, discLabel: 'upright', thinLabel: 'none' },
  { disc: 9, thin: 6, gap: 1, discLabel: 'none', thinLabel: 'none' },
];

const SHAFT_MIN = 76;
const ENDS = 2 * (8 + 10); // tope + punta de la manga, por lado

/** Elige el tamaño de disco más grande que entra en el ancho disponible. */
function pickSizing(weights: Mg[], available: number): Sizing {
  for (const sizing of SIZINGS) {
    const side = weights.reduce(
      (sum, weight) => sum + (plateLook(weight).thin ? sizing.thin : sizing.disc) + sizing.gap,
      0,
    );
    if (2 * side + SHAFT_MIN + ENDS <= available) return sizing;
  }
  return SIZINGS[SIZINGS.length - 1]!;
}

/**
 * La barra cargada, vista de frente. Dibuja exactamente la combinación que
 * recibe: mismo orden (lo más pesado contra el tope) y mismos discos a ambos lados.
 */
export function Barbell({ bar, combination, compact = false }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>(326);
  const weights = expandCombination(combination);
  const sizing = pickSizing(weights, width);
  const scale = compact ? 0.62 : 1;
  const label = `Barra de ${formatKg(bar)} kg, por lado: ${describeCombination(combination)}`;

  const side = (mirrored: boolean) => (
    <div className={`flex items-center ${mirrored ? 'flex-row-reverse' : ''}`}>
      <div className="h-7 w-2 flex-none rounded-[2px] bg-[#8a8a8a]" style={{ height: 28 * scale }} />
      <div
        className={`relative flex items-center ${mirrored ? 'flex-row-reverse' : ''}`}
        style={{ gap: sizing.gap, paddingInline: sizing.gap }}
      >
        <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 bg-[#5c5c5c]" />
        {weights.map((weight, index) => {
          const look = plateLook(weight);
          const mode = look.thin ? sizing.thinLabel : sizing.discLabel;
          return (
            <div
              key={`${weight}-${index}`}
              className="relative grid flex-none place-items-center overflow-hidden rounded-[4px]"
              style={{
                width: look.thin ? sizing.thin : sizing.disc,
                height: Math.round(look.height * scale),
                background: look.fill,
                color: look.ink,
              }}
            >
              {mode !== 'none' && !compact && (
                <span
                  className="num text-small font-semibold"
                  style={
                    mode === 'upright'
                      ? { writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 11 }
                      : undefined
                  }
                >
                  {formatKg(weight)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div
        className={`h-2.5 flex-none bg-[#5c5c5c] ${mirrored ? 'rounded-l-full' : 'rounded-r-full'}`}
        style={{ width: weights.length === 0 ? 44 : 10 }}
      />
    </div>
  );

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className="relative flex items-center justify-center"
      style={{ height: Math.round(132 * scale) }}
    >
      {side(true)}
      <div className="h-1.5 flex-1 bg-[#8a8a8a]" style={{ minWidth: SHAFT_MIN, maxWidth: 220 }} />
      {side(false)}
      {!compact && (
        <span className="num absolute bottom-0 left-1/2 -translate-x-1/2 text-small whitespace-nowrap text-muted">
          Barra {formatKg(bar)} kg
        </span>
      )}
    </div>
  );
}
