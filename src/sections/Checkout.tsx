import { Banknote, CheckCircle2, CreditCard, ExternalLink, Info, QrCode, Wallet, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Dialog } from '../components/Dialog';
import { DELIVERY_FEE_CENTS, deliveryModeLabels, messages, paymentLabels, paymentMethods } from '../config/business';
import { itemDetails, itemTitle } from '../lib/describe';
import { formatBRL, maskBRLInput, parseBRLInput } from '../lib/money';
import { calculateChange, calculateItemSubtotal, calculateTotal, getDeliveryFee } from '../lib/pricing';
import { firstInvalidField, maskPhone, validateCheckout, type CheckoutField } from '../lib/validation';
import { scrollToElement } from '../lib/overlay';
import { buildOrderMessage, buildWhatsAppUrl } from '../lib/whatsapp';
import type { Address, CheckoutData, DeliveryMode, PaymentMethod } from '../models';
import { useCart } from '../store/CartContext';

const paymentIcons: Record<PaymentMethod, LucideIcon> = {
  pix: QrCode,
  dinheiro: Banknote,
  credito: CreditCard,
  debito: Wallet,
};

/** id do elemento que recebe foco quando o campo é inválido. */
const fieldFocusId: Record<CheckoutField, string> = {
  name: 'co-name',
  phone: 'co-phone',
  deliveryMode: 'co-mode-entrega',
  street: 'co-street',
  number: 'co-number',
  neighborhood: 'co-neighborhood',
  city: 'co-city',
  paymentMethod: 'co-pay-pix',
  needsChange: 'co-change-no',
  changeFor: 'co-change-for',
};

interface Props {
  open: boolean;
  onClose: () => void;
  data: CheckoutData;
  onChange: (data: CheckoutData) => void;
}

export function Checkout({ open, onClose, data, onChange }: Props) {
  const { items, subtotal, clear } = useCart();
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<CheckoutField, boolean>>>({});
  const [sentUrl, setSentUrl] = useState<string | null>(null);

  const total = calculateTotal(subtotal, data.deliveryMode);
  const errors = validateCheckout(data, total);
  const errorFor = (f: CheckoutField) => (submitted || touched[f] ? errors[f] : undefined);
  const touch = (f: CheckoutField) => () => setTouched((t) => ({ ...t, [f]: true }));

  const set = (patch: Partial<CheckoutData>) => onChange({ ...data, ...patch });
  const setAddress = (patch: Partial<Address>) => onChange({ ...data, address: { ...data.address, ...patch } });

  function selectPayment(method: PaymentMethod) {
    set(method === 'dinheiro' ? { paymentMethod: method } : { paymentMethod: method, needsChange: null, changeForCents: null });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (items.length === 0) return;
    const first = firstInvalidField(errors);
    if (first) {
      const el = document.getElementById(fieldFocusId[first]);
      if (el) {
        el.focus({ preventScroll: true });
        // Rádios ficam visualmente ocultos: rola até o cartão visível que os contém.
        scrollToElement(el.closest('fieldset, [role=radiogroup], div') ?? el);
      }
      return;
    }
    const url = buildWhatsAppUrl(buildOrderMessage({ items, checkout: data }));
    window.open(url, '_blank', 'noopener,noreferrer');
    setSentUrl(url);
  }

  function finish(clearCart: boolean) {
    if (clearCart) clear();
    setSentUrl(null);
    setSubmitted(false);
    setTouched({});
    onClose();
  }

  if (sentUrl) {
    return (
      <Dialog key="sent" open={open} onClose={() => finish(false)} title="Pedido preparado">
        <div className="space-y-6 py-4 text-center">
          <CheckCircle2 aria-hidden="true" className="mx-auto h-14 w-14 text-severo-yellow" />
          <p role="status" className="text-lg font-semibold">
            {messages.afterSend}
          </p>
          <a href={sentUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            <ExternalLink aria-hidden="true" className="h-4 w-4" /> Abrir o WhatsApp novamente
          </a>
          <div className="rounded-2xl border border-carvao-700 bg-carvao-800/60 p-5">
            <p className="font-semibold">Deseja limpar o carrinho?</p>
            <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
              <button type="button" className="btn-primary" onClick={() => finish(true)}>
                Sim, limpar carrinho
              </button>
              <button type="button" className="btn-ghost" onClick={() => finish(false)} data-autofocus>
                Não, manter carrinho
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    );
  }

  const fee = getDeliveryFee(data.deliveryMode);
  const change =
    data.paymentMethod === 'dinheiro' && data.needsChange && data.changeForCents !== null && !errors.changeFor
      ? calculateChange(data.changeForCents, total)
      : null;

  return (
    <Dialog
      key="form"
      open={open}
      onClose={onClose}
      title="Finalizar pedido"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite">
            <span className="block text-sm uppercase tracking-wider text-zinc-400">Total</span>
            <span className="font-display text-3xl tracking-wide text-severo-yellow" data-testid="checkout-total-footer">
              {formatBRL(total)}
            </span>
          </p>
          <button type="submit" form="checkout-form" className="btn-primary" disabled={items.length === 0}>
            Enviar pedido pelo WhatsApp
          </button>
        </div>
      }
    >
      <form id="checkout-form" onSubmit={submit} noValidate className="space-y-7">
        {submitted && Object.keys(errors).length > 0 && (
          <p role="alert" className="rounded-xl border border-severo-red/50 bg-severo-red/10 p-3 text-base text-red-200">
            Confira os campos destacados antes de enviar.
          </p>
        )}

        <Section title="Seus dados">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="co-name" label="Nome" value={data.name} onChange={(v) => set({ name: v })} onBlur={touch('name')} error={errorFor('name')} autoComplete="name" required />
            <TextField
              id="co-phone"
              label="Telefone (WhatsApp)"
              value={data.phone}
              onChange={(v) => set({ phone: maskPhone(v) })}
              onBlur={touch('phone')}
              error={errorFor('phone')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(19) 99999-9999"
              required
            />
          </div>
        </Section>

        <Section title="Entrega ou retirada">
          <fieldset aria-describedby={errorFor('deliveryMode') ? 'co-mode-error' : undefined}>
            <legend className="sr-only">Modalidade</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(deliveryModeLabels) as DeliveryMode[]).map((mode) => (
                <label key={mode} className="choice-card">
                  <input
                    id={`co-mode-${mode}`}
                    type="radio"
                    name="co-mode"
                    value={mode}
                    checked={data.deliveryMode === mode}
                    onChange={() => set({ deliveryMode: mode })}
                    className="sr-only"
                  />
                  <span className="font-bold">{deliveryModeLabels[mode]}</span>
                  <span className="text-sm text-zinc-400">{mode === 'entrega' ? `Taxa ${formatBRL(DELIVERY_FEE_CENTS)}` : 'Sem taxa'}</span>
                </label>
              ))}
            </div>
            {errorFor('deliveryMode') && (
              <p id="co-mode-error" className="field-error">
                {errorFor('deliveryMode')}
              </p>
            )}
          </fieldset>

          {data.deliveryMode === 'entrega' && (
            <div className="mt-4 space-y-4">
              <p className="flex items-start gap-2 rounded-xl bg-carvao-800 p-3 text-base text-zinc-300">
                <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-severo-yellow" />
                {messages.deliveryAreaNotice}
              </p>
              <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                <TextField id="co-street" label="Rua" value={data.address.street} onChange={(v) => setAddress({ street: v })} onBlur={touch('street')} error={errorFor('street')} autoComplete="address-line1" required />
                <TextField id="co-number" label="Número" value={data.address.number} onChange={(v) => setAddress({ number: v })} onBlur={touch('number')} error={errorFor('number')} inputMode="numeric" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField id="co-neighborhood" label="Bairro" value={data.address.neighborhood} onChange={(v) => setAddress({ neighborhood: v })} onBlur={touch('neighborhood')} error={errorFor('neighborhood')} autoComplete="address-level3" required />
                <TextField id="co-city" label="Cidade" value={data.address.city} onChange={(v) => setAddress({ city: v })} onBlur={touch('city')} error={errorFor('city')} autoComplete="address-level2" required />
              </div>
              <TextField id="co-reference" label="Referência (opcional)" value={data.address.reference} onChange={(v) => setAddress({ reference: v })} placeholder="Ex.: próximo à praça" />
            </div>
          )}
        </Section>

        <Section title="Forma de pagamento">
          <div
            role="radiogroup"
            aria-label="Forma de pagamento"
            aria-required="true"
            aria-describedby={errorFor('paymentMethod') ? 'co-pay-error' : undefined}
            className="grid grid-cols-2 gap-2"
          >
            {paymentMethods.map((p) => {
              const Icon = paymentIcons[p.id];
              return (
                <label key={p.id} className="choice-card min-h-[4.5rem] justify-center">
                  <input
                    id={`co-pay-${p.id}`}
                    type="radio"
                    name="co-pay"
                    value={p.id}
                    checked={data.paymentMethod === p.id}
                    onChange={() => selectPayment(p.id)}
                    className="sr-only"
                  />
                  <Icon aria-hidden="true" className="h-6 w-6 text-severo-yellow" />
                  <span className="font-bold leading-tight">{p.label}</span>
                  {data.paymentMethod === p.id && (
                    <CheckCircle2 aria-hidden="true" className="absolute right-2 top-2 h-5 w-5 text-severo-yellow" />
                  )}
                </label>
              );
            })}
          </div>
          {errorFor('paymentMethod') && (
            <p id="co-pay-error" className="field-error">
              {errorFor('paymentMethod')}
            </p>
          )}

          {data.paymentMethod && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-carvao-800 p-3 text-base text-zinc-300" data-testid="payment-info">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-severo-yellow" />
              {paymentMethods.find((p) => p.id === data.paymentMethod)?.description}
            </p>
          )}

          {data.paymentMethod === 'dinheiro' && (
            <div className="mt-4 space-y-4">
              <fieldset aria-describedby={errorFor('needsChange') ? 'co-change-q-error' : undefined}>
                <legend className="label">Vai precisar de troco?</legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="choice-card">
                    <input id="co-change-no" type="radio" name="co-change" checked={data.needsChange === false} onChange={() => set({ needsChange: false, changeForCents: null })} className="sr-only" />
                    <span className="font-semibold">Não preciso de troco</span>
                  </label>
                  <label className="choice-card">
                    <input id="co-change-yes" type="radio" name="co-change" checked={data.needsChange === true} onChange={() => set({ needsChange: true })} className="sr-only" />
                    <span className="font-semibold">Sim, preciso de troco</span>
                  </label>
                </div>
                {errorFor('needsChange') && (
                  <p id="co-change-q-error" className="field-error">
                    {errorFor('needsChange')}
                  </p>
                )}
              </fieldset>

              {data.needsChange && (
                <div>
                  <label htmlFor="co-change-for" className="label">
                    Troco para quanto?
                  </label>
                  <div className="relative">
                    <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      R$
                    </span>
                    <input
                      id="co-change-for"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={data.changeForCents !== null ? maskBRLInput(String(data.changeForCents)) : ''}
                      onChange={(e) => {
                        const masked = maskBRLInput(e.target.value);
                        set({ changeForCents: masked ? parseBRLInput(masked) : null });
                      }}
                      onBlur={touch('changeFor')}
                      placeholder="0,00"
                      aria-invalid={errorFor('changeFor') ? true : undefined}
                      aria-describedby={errorFor('changeFor') ? 'co-change-for-error' : 'co-change-for-hint'}
                      className="field w-full pl-10"
                    />
                  </div>
                  {errorFor('changeFor') ? (
                    <p id="co-change-for-error" className="field-error">
                      {errorFor('changeFor')}
                    </p>
                  ) : (
                    <p id="co-change-for-hint" className="mt-1.5 text-base text-zinc-400">
                      Deve ser maior que o total ({formatBRL(total)}).
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <p className="mt-3 text-sm text-zinc-400">Nenhuma cobrança é feita pelo site. Escolher a forma de pagamento não significa que o pedido foi pago.</p>
        </Section>

        <div>
          <label htmlFor="co-notes" className="label">
            Observações do pedido <span className="font-normal normal-case tracking-normal text-zinc-500">(opcional)</span>
          </label>
          <textarea id="co-notes" value={data.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} maxLength={300} className="field w-full resize-y" />
        </div>

        <Section title="Resumo do pedido">
          <ul className="divide-y divide-carvao-700 rounded-2xl border border-carvao-700 bg-carvao-950/50 px-4">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 py-3 text-base">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {item.quantity}x {itemTitle(item)}
                  </p>
                  {itemDetails(item).map((line) => (
                    <p key={line} className="break-words text-zinc-400">
                      {line}
                    </p>
                  ))}
                </div>
                <p className="whitespace-nowrap font-semibold">{formatBRL(calculateItemSubtotal(item))}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 text-base" data-testid="checkout-summary">
            <SummaryRow label="Subtotal" value={formatBRL(subtotal)} />
            {data.deliveryMode === 'entrega' && <SummaryRow label="Entrega" value={formatBRL(fee)} />}
            <div className="flex justify-between border-t border-carvao-700 pt-2 text-lg font-extrabold text-white">
              <dt>Total</dt>
              <dd data-testid="checkout-total">{formatBRL(total)}</dd>
            </div>
            {data.deliveryMode && <SummaryRow label="Modalidade" value={deliveryModeLabels[data.deliveryMode]} />}
            {data.paymentMethod && <SummaryRow label="Pagamento" value={paymentLabels[data.paymentMethod]} />}
            {data.paymentMethod === 'dinheiro' && data.needsChange === false && <SummaryRow label="Troco" value="Não precisa" />}
            {change !== null && data.changeForCents !== null && (
              <>
                <SummaryRow label="Troco para" value={formatBRL(data.changeForCents)} />
                <SummaryRow label="Troco estimado" value={formatBRL(change)} />
              </>
            )}
          </dl>
        </Section>
      </form>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 font-display text-2xl tracking-wide text-white">{title}</h3>
      {children}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-zinc-300">
      <dt>{label}</dt>
      <dd className="whitespace-nowrap text-right">{value}</dd>
    </div>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  placeholder?: string;
}

function TextField({ id, label, value, onChange, onBlur, error, required, type = 'text', inputMode, autoComplete, placeholder }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required && <span aria-hidden="true" className="text-severo-red"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="field w-full"
      />
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
