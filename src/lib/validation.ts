import type { Cents, CheckoutData } from '../models';
import { formatBRL } from './money';

const VALID_DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46,
  47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85,
  86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export function onlyDigits(text: string): string {
  return text.replace(/\D/g, '');
}

/** Máscara: (19) 99999-9999 (celular) ou (19) 3333-3333 (fixo). */
export function maskPhone(raw: string): string {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const split = d.length === 11 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

export function validateName(name: string): string | null {
  return name.trim().length >= 2 ? null : 'Informe seu nome (mínimo 2 caracteres).';
}

export function validatePhone(phone: string): string | null {
  const d = onlyDigits(phone);
  if (d.length === 0) return 'Informe seu telefone com DDD.';
  if (d.length !== 10 && d.length !== 11) return 'Telefone inválido. Use DDD + número, ex.: (19) 99999-9999.';
  if (!VALID_DDDS.has(Number(d.slice(0, 2)))) return 'DDD inválido.';
  const first = d.charAt(2);
  if (d.length === 11 && first !== '9') return 'Celular inválido: deve começar com 9 após o DDD.';
  if (d.length === 10 && !/[2-5]/.test(first)) return 'Telefone fixo inválido.';
  return null;
}

export function validateRequired(value: string, message: string): string | null {
  return value.trim() === '' ? message : null;
}

/** O valor para troco deve ser MAIOR que o total. */
export function validateChange(changeForCents: Cents | null, totalCents: Cents): string | null {
  if (changeForCents === null || !Number.isFinite(changeForCents)) return 'Informe para quanto precisa de troco.';
  if (changeForCents <= 0) return 'Informe um valor maior que zero.';
  if (changeForCents === totalCents) return "Esse valor é igual ao total. Selecione 'Não preciso de troco'.";
  if (changeForCents < totalCents) return `O valor deve ser maior que o total do pedido (${formatBRL(totalCents)}).`;
  return null;
}

export type CheckoutField =
  | 'name'
  | 'phone'
  | 'deliveryMode'
  | 'street'
  | 'number'
  | 'neighborhood'
  | 'city'
  | 'paymentMethod'
  | 'needsChange'
  | 'changeFor';

/** Ordem em que os campos aparecem na tela (usada para focar o primeiro inválido). */
export const CHECKOUT_FIELD_ORDER: CheckoutField[] = [
  'name',
  'phone',
  'deliveryMode',
  'street',
  'number',
  'neighborhood',
  'city',
  'paymentMethod',
  'needsChange',
  'changeFor',
];

export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

export function validateCheckout(data: CheckoutData, totalCents: Cents): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const set = (field: CheckoutField, message: string | null) => {
    if (message) errors[field] = message;
  };

  set('name', validateName(data.name));
  set('phone', validatePhone(data.phone));
  if (!data.deliveryMode) set('deliveryMode', 'Escolha entrega ou retirada.');

  if (data.deliveryMode === 'entrega') {
    set('street', validateRequired(data.address.street, 'Informe a rua.'));
    set('number', validateRequired(data.address.number, 'Informe o número.'));
    set('neighborhood', validateRequired(data.address.neighborhood, 'Informe o bairro.'));
    set('city', validateRequired(data.address.city, 'Informe a cidade.'));
  }

  if (!data.paymentMethod) set('paymentMethod', 'Escolha a forma de pagamento.');
  if (data.paymentMethod === 'dinheiro') {
    if (data.needsChange === null) set('needsChange', 'Informe se vai precisar de troco.');
    if (data.needsChange === true) set('changeFor', validateChange(data.changeForCents, totalCents));
  }
  return errors;
}

export function firstInvalidField(errors: CheckoutErrors): CheckoutField | undefined {
  return CHECKOUT_FIELD_ORDER.find((f) => errors[f]);
}
