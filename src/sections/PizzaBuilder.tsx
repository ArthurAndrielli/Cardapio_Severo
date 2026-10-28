import { AlertTriangle, ChevronRight, Info } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Dialog } from '../components/Dialog';
import { FlavorPicker } from '../components/FlavorPicker';
import { QuantityStepper } from '../components/QuantityStepper';
import { messages } from '../config/business';
import { addons, borders } from '../data/addons';
import { formatBRL } from '../lib/money';
import { useBackClose } from '../lib/overlay';
import {
  calculateAddonsPrice,
  calculateBasePrice,
  calculateBorderPrice,
  calculateUnitPrice,
  canUseAddons,
  canUseBorder,
  clampQuantity,
  getFlavor,
  validatePizza,
} from '../lib/pricing';
import type { Flavor, PizzaConfig, PizzaMode } from '../models';

export interface BuilderInitial {
  config: PizzaConfig;
  quantity: number;
  /** Presente quando editando um item do carrinho. */
  editingId?: string;
}

interface Props {
  open: boolean;
  initial: BuilderInitial;
  onClose: () => void;
  onSubmit: (config: PizzaConfig, quantity: number, editingId?: string) => void;
}

/** Monta o PizzaConfig a partir do estado do formulário. */
function toConfig(mode: PizzaMode, f1: string, f2: string, borderId: string | null, addonIds: string[], note: string): PizzaConfig {
  const flavorIds = (mode === 'inteira' ? [f1] : [f1, f2]).filter(Boolean);
  return { mode, flavorIds, borderId, addonIds, note };
}

export function PizzaBuilder({ open, initial, onClose, onSubmit }: Props) {
  const uid = useId();
  const [mode, setMode] = useState<PizzaMode>(initial.config.mode);
  const [f1, setF1] = useState(initial.config.flavorIds[0] ?? '');
  const [f2, setF2] = useState(initial.config.flavorIds[1] ?? '');
  const [borderId, setBorderId] = useState<string | null>(initial.config.borderId);
  const [addonIds, setAddonIds] = useState<string[]>(initial.config.addonIds);
  const [note, setNote] = useState(initial.config.note);
  const [quantity, setQuantity] = useState(initial.quantity);
  const [notice, setNotice] = useState('');
  /** Metade cujo sabor está sendo escolhido na lista (0 = 1ª/única, 1 = 2ª), ou null. */
  const [picking, setPicking] = useState<0 | 1 | null>(null);
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function closePicker() {
    const slot = picking;
    setPicking(null);
    window.setTimeout(() => slot !== null && slotRefs.current[slot]?.focus(), 0);
  }
  // "Voltar" do Android fecha primeiro a lista de sabores, depois o personalizador.
  useBackClose(picking !== null, closePicker);

  const config = toConfig(mode, f1, f2, borderId, addonIds, note);
  const addonsAllowed = canUseAddons(config);
  const borderAllowed = canUseBorder(config);
  const validation = validatePizza(config);
  const unit = validation.ok ? calculateUnitPrice(config) : null;

  /** Aplica a nova combinação de sabores e remove extras que deixaram de ser permitidos. */
  function changeFlavors(nextMode: PizzaMode, nextF1: string, nextF2: string) {
    setMode(nextMode);
    setF1(nextF1);
    setF2(nextF2);
    const next = toConfig(nextMode, nextF1, nextF2, borderId, addonIds, note);
    const removed: string[] = [];
    if (!canUseAddons(next) && addonIds.length > 0) {
      setAddonIds([]);
      removed.push('adicionais');
    }
    if (!canUseBorder(next) && borderId !== null) {
      setBorderId(null);
      removed.push('borda');
    }
    setNotice(removed.length ? `Removemos ${removed.join(' e ')}: ${messages.sweetAddonsBlocked}` : '');
  }

  function toggleAddon(id: string) {
    setAddonIds((cur) => (cur.includes(id) ? cur.filter((a) => a !== id) : [...cur, id]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validation.ok) return;
    onSubmit({ ...config, note: note.trim() }, clampQuantity(quantity), initial.editingId);
  }

  const editing = Boolean(initial.editingId);
  const priciest = config.flavorIds
    .map((id) => getFlavor(id))
    .reduce<Flavor | undefined>((best, f) => (f && (!best || f.priceCents > best.priceCents) ? f : best), undefined);
  const formId = `${uid}-form`;
  const sweetBlockedText = !addonsAllowed || !borderAllowed;

  const slotLabels = mode === 'inteira' ? ['Sabor'] : ['1ª metade', '2ª metade'];
  const slotValues = [f1, f2];

  function pick(slot: 0 | 1, id: string) {
    if (slot === 0) changeFlavors(mode, id, f2);
    else changeFlavors(mode, f1, id);
    closePicker();
  }

  const flavorSlot = (slot: 0 | 1) => {
    const flavor = getFlavor(slotValues[slot] ?? '');
    const label = slotLabels[slot] ?? '';
    return (
      <button
        ref={(el) => {
          slotRefs.current[slot] = el;
        }}
        type="button"
        onClick={() => setPicking(slot)}
        aria-label={`${label}: ${flavor ? `${flavor.name}, ${formatBRL(flavor.priceCents)}` : 'nenhum sabor escolhido'}. Escolher sabor`}
        className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-carvao-600 bg-carvao-800 px-3 py-2 text-left transition hover:border-severo-yellow"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</span>
          <span className={`block break-words font-bold ${flavor ? 'text-white' : 'text-severo-yellow'}`}>
            {flavor ? flavor.name : 'Escolher sabor'}
          </span>
        </span>
        {flavor && <span className="whitespace-nowrap font-semibold text-severo-yellow">{formatBRL(flavor.priceCents)}</span>}
        <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-zinc-400" />
      </button>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={picking !== null ? closePicker : onClose}
      title={picking !== null ? `Escolha: ${slotLabels[picking]}` : editing ? 'Editar pizza' : 'Monte sua pizza'}
      initialFocus={`input[name="${uid}-mode"]:checked`}
      footer={
        picking === null && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4 sm:justify-start">
            <QuantityStepper value={quantity} onChange={(q) => setQuantity(clampQuantity(q))} label="esta pizza" />
            <p className="text-right sm:text-left" aria-live="polite">
              <span className="block text-xs uppercase tracking-wider text-zinc-400">Total</span>
              <span className="whitespace-nowrap font-display text-3xl tracking-wide text-severo-yellow" data-testid="builder-total">
                {unit !== null ? formatBRL(unit * quantity) : '—'}
              </span>
            </p>
          </div>
          <button
            type="submit"
            form={formId}
            disabled={!validation.ok}
            className="btn-primary"
            aria-describedby={!validation.ok ? `${uid}-invalid` : undefined}
          >
            {editing ? 'Salvar alterações' : 'Adicionar ao carrinho'}
          </button>
        </div>
        )
      }
    >
      {picking !== null && (
        <FlavorPicker
          slotLabel={slotLabels[picking] ?? ''}
          selectedId={slotValues[picking] ?? ''}
          excludeId={mode === 'meio' ? slotValues[picking === 0 ? 1 : 0] : undefined}
          onPick={(id) => pick(picking, id)}
          onBack={closePicker}
        />
      )}
      <form id={formId} hidden={picking !== null} onSubmit={submit} className="space-y-6" noValidate>
        <fieldset>
          <legend className="label">Tipo de pizza</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['inteira', 'Inteira', '1 sabor'],
                ['meio', 'Meio a meio', '2 sabores · vale o mais caro'],
              ] as const
            ).map(([value, label, hint]) => (
              <label key={value} className="choice-card">
                <input
                  type="radio"
                  name={`${uid}-mode`}
                  value={value}
                  checked={mode === value}
                  onChange={() => changeFlavors(value, f1, value === 'meio' ? f2 : '')}
                  className="sr-only"
                />
                <span className="font-bold">{label}</span>
                <span className="text-sm text-zinc-400">{hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="label">Sabores</legend>
          {mode === 'inteira' ? (
            flavorSlot(0)
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {flavorSlot(0)}
              {flavorSlot(1)}
            </div>
          )}
          {mode === 'meio' && (
            <p className="text-base text-zinc-400">Na pizza meio a meio é cobrado o valor do sabor mais caro.</p>
          )}
        </fieldset>

        {notice && (
          <p role="status" className="flex items-start gap-2 rounded-xl border border-severo-yellow/40 bg-severo-yellow/10 p-3 text-base text-severo-yellow">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {notice}
          </p>
        )}

        <fieldset disabled={!borderAllowed} aria-describedby={!borderAllowed ? `${uid}-sweet` : undefined}>
          <legend className="label">Borda</legend>
          {borders.map((b) => (
            <label key={b.id} className={`check-row ${!borderAllowed ? 'opacity-50' : ''}`}>
              <input
                type="checkbox"
                checked={borderId === b.id}
                onChange={(e) => setBorderId(e.target.checked ? b.id : null)}
                className="check"
              />
              <span className="min-w-0 flex-1 break-words">{b.name}</span>
              <span className="whitespace-nowrap font-semibold text-severo-yellow">+ {formatBRL(b.priceCents)}</span>
            </label>
          ))}
        </fieldset>

        <fieldset disabled={!addonsAllowed} aria-describedby={!addonsAllowed ? `${uid}-sweet` : undefined}>
          <legend className="label">Adicionais <span className="font-normal normal-case tracking-normal text-zinc-500">(valem para a pizza inteira)</span></legend>
          {sweetBlockedText && (
            <p id={`${uid}-sweet`} className="mb-3 rounded-lg bg-carvao-800 px-3 py-2 text-base text-zinc-300">
              {messages.sweetAddonsBlocked}
            </p>
          )}
          <div className={`grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 ${!addonsAllowed ? 'opacity-50' : ''}`}>
            {addons.map((a) => (
              <label key={a.id} className="check-row">
                <input type="checkbox" checked={addonIds.includes(a.id)} onChange={() => toggleAddon(a.id)} className="check" />
                <span className="min-w-0 flex-1 break-words">{a.name}</span>
                <span className="whitespace-nowrap font-semibold text-severo-yellow">+ {formatBRL(a.priceCents)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={`${uid}-note`} className="label">
            Observação <span className="font-normal normal-case tracking-normal text-zinc-500">(opcional)</span>
          </label>
          <textarea
            id={`${uid}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="Ex.: sem cebola, bem assada"
            className="field w-full resize-y"
          />
        </div>

        <div className="rounded-xl border border-carvao-700 bg-carvao-950/50 p-4 text-base">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-zinc-400">Resumo do preço</h3>
          {validation.ok && unit !== null ? (
            <dl className="space-y-1">
              <PriceRow
                label={mode === 'meio' ? `Sabor mais caro (${priciest?.name ?? ''})` : 'Sabor'}
                value={formatBRL(calculateBasePrice(config))}
              />
              {borderId && <PriceRow label="Borda" value={formatBRL(calculateBorderPrice(config))} />}
              {addonIds.length > 0 && <PriceRow label={`Adicionais (${addonIds.length})`} value={formatBRL(calculateAddonsPrice(config))} />}
              <PriceRow label="Valor por pizza" value={formatBRL(unit)} strong />
              {quantity > 1 && <PriceRow label={`× ${quantity}`} value={formatBRL(unit * quantity)} strong />}
            </dl>
          ) : (
            <p id={`${uid}-invalid`} className="flex items-center gap-2 text-zinc-300">
              <Info aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-500" />
              {validation.ok ? '' : validation.error}
            </p>
          )}
        </div>
      </form>
    </Dialog>
  );
}

function PriceRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? 'font-bold text-white' : 'text-zinc-300'}`}>
      <dt>{label}</dt>
      <dd className="whitespace-nowrap">{value}</dd>
    </div>
  );
}
