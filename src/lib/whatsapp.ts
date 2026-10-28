import { business, deliveryModeLabels, paymentLabels } from '../config/business';
import { addonsById, bordersById } from '../data/addons';
import type { CartItem, Order } from '../models';
import { formatBRL } from './money';
import {
  calculateChange,
  calculateItemSubtotal,
  calculateSubtotal,
  calculateTotal,
  calculateUnitPrice,
  getDeliveryFee,
  getFlavor,
} from './pricing';

function flavorName(id: string): string {
  return getFlavor(id)?.name ?? id;
}

export function describeItemLines(item: CartItem): string[] {
  const lines: string[] = [];
  if (item.mode === 'inteira') {
    lines.push(`${item.quantity}x Pizza ${flavorName(item.flavorIds[0] ?? '')}`);
  } else {
    lines.push(`${item.quantity}x Pizza Meio a Meio`);
    item.flavorIds.forEach((id) => lines.push(`½ ${flavorName(id)}`));
  }
  const border = item.borderId ? bordersById.get(item.borderId) : undefined;
  if (border) lines.push(`Borda: ${border.shortName}`);
  if (item.addonIds.length > 0) {
    lines.push(`Adicionais: ${item.addonIds.map((id) => addonsById.get(id)?.name ?? id).join(', ')}`);
  }
  if (item.note.trim()) lines.push(`Obs.: ${item.note.trim()}`);

  const unit = calculateUnitPrice(item);
  const value =
    item.quantity > 1
      ? `${formatBRL(unit)} (× ${item.quantity} = ${formatBRL(calculateItemSubtotal(item))})`
      : formatBRL(unit);
  lines.push(`*Valor:* ${value}`);
  return lines;
}

/** Monta a mensagem do pedido exatamente no modelo combinado, omitindo linhas que não se aplicam. */
export function buildOrderMessage(order: Order): string {
  const { items, checkout: c } = order;
  const subtotal = calculateSubtotal(items);
  const total = calculateTotal(subtotal, c.deliveryMode);
  const isDelivery = c.deliveryMode === 'entrega';

  const sections: string[][] = [];
  sections.push(['🍕 *NOVO PEDIDO — SEVERO PIZZAS*']);
  sections.push([`*Cliente:* ${c.name.trim()}`, `*Contato:* ${c.phone.trim()}`]);
  sections.push(['*PEDIDO*']);
  items.forEach((item) => sections.push(describeItemLines(item)));

  const totals = [`*Subtotal:* ${formatBRL(subtotal)}`];
  if (isDelivery) totals.push(`*Entrega:* ${formatBRL(getDeliveryFee(c.deliveryMode))}`);
  totals.push(`*TOTAL: ${formatBRL(total)}*`);
  sections.push(totals);

  if (c.deliveryMode) {
    const mode = [`*Modalidade:* ${deliveryModeLabels[c.deliveryMode]}`];
    if (isDelivery) {
      const a = c.address;
      mode.push(`*Endereço:* ${a.street.trim()}, ${a.number.trim()} — ${a.neighborhood.trim()}, ${a.city.trim()}`);
      if (a.reference.trim()) mode.push(`*Referência:* ${a.reference.trim()}`);
    }
    sections.push(mode);
  }

  if (c.paymentMethod) {
    const pay = [`*Pagamento:* ${paymentLabels[c.paymentMethod]}`];
    if (c.paymentMethod === 'dinheiro') {
      if (c.needsChange && c.changeForCents !== null) {
        pay.push(`*Troco para:* ${formatBRL(c.changeForCents)}`);
        pay.push(`*Troco estimado:* ${formatBRL(calculateChange(c.changeForCents, total))}`);
      } else if (c.needsChange === false) {
        pay.push('*Troco:* Não precisa');
      }
    }
    sections.push(pay);
  }

  if (c.notes.trim()) sections.push([`*Observações:* ${c.notes.trim()}`]);
  sections.push(['_Pedido sujeito a confirmação pela pizzaria._']);

  return sections.map((lines) => lines.join('\n')).join('\n\n');
}

export function buildWhatsAppUrl(message: string, phone: string = business.whatsappNumber): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/** Link simples para contato (sem pedido). */
export const whatsappContactUrl = `https://wa.me/${business.whatsappNumber}`;
