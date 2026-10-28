import { Minus, Plus } from 'lucide-react';
import { MAX_QUANTITY, MIN_QUANTITY } from '../config/business';

interface Props {
  value: number;
  onChange: (value: number) => void;
  /** Nome do item, para os rótulos acessíveis dos botões. */
  label: string;
  size?: 'sm' | 'md';
}

export function QuantityStepper({ value, onChange, label, size = 'md' }: Props) {
  const btn =
    'grid place-items-center rounded-full border border-carvao-600 text-white transition hover:border-severo-yellow hover:text-severo-yellow disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-carvao-600 disabled:hover:text-white ' +
    (size === 'sm' ? 'h-11 w-11' : 'h-12 w-12');
  return (
    <div className="flex items-center gap-2" role="group" aria-label={`Quantidade de ${label}`}>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= MIN_QUANTITY}
        aria-label={`Diminuir quantidade de ${label}`}
      >
        <Minus aria-hidden="true" className="h-4 w-4" />
      </button>
      <output className="min-w-[2ch] text-center text-lg font-bold tabular-nums" aria-live="polite" aria-label={`Quantidade: ${value}`}>
        {value}
      </output>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QUANTITY}
        aria-label={`Aumentar quantidade de ${label}`}
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
