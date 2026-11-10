import type { Bar, Mg } from '../../types';
import { formatKg } from '../../utils/weight';
import { SegmentedControl } from '../ui/SegmentedControl';

interface Props {
  bars: Bar[];
  value: Mg;
  onChange(weight: Mg): void;
}

export function BarSelector({ bars, value, onChange }: Props) {
  return (
    <div>
      <p className="mb-2 text-body font-medium" id="barra-label">
        Barra
      </p>
      <SegmentedControl
        label="Barra"
        value={value}
        onChange={onChange}
        options={bars.map((bar) => ({ value: bar.weight, label: `${formatKg(bar.weight)} kg` }))}
      />
    </div>
  );
}
