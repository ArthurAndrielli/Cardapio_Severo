import type { Cents } from '../models';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function isCents(value: unknown): value is Cents {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

export function assertCents(value: number, label = 'valor'): Cents {
  if (!isCents(value)) throw new TypeError(`${label} deve ser um inteiro em centavos (recebido: ${value}).`);
  return value;
}

/** Formata centavos em reais: 12300 → "R$ 123,00" (espaço comum no lugar do espaço não separável). */
export function formatBRL(cents: Cents): string {
  assertCents(cents);
  return brl.format(cents / 100).replace(/ /g, ' ');
}

export function sumCents(values: Cents[]): Cents {
  return values.reduce((acc, v) => acc + assertCents(v), 0);
}

export function multiplyCents(cents: Cents, factor: number): Cents {
  assertCents(cents);
  if (!Number.isInteger(factor)) throw new TypeError('O multiplicador deve ser inteiro.');
  return cents * factor;
}

/**
 * Converte texto digitado em reais para centavos.
 * Aceita "R$ 1.234,56", "1234,56", "50" (reais inteiros), "-10".
 * Retorna null para texto vazio ou inválido.
 */
export function parseBRLInput(text: string): Cents | null {
  const trimmed = text.replace(/R\$/g, '').replace(/\s/g, '');
  if (trimmed === '') return null;
  const negative = trimmed.startsWith('-');
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  if (!/^[\d.]*(,\d{0,2})?$/.test(unsigned) || !/\d/.test(unsigned)) return null;
  const [intPart = '', decPart = ''] = unsigned.split(',');
  const reais = Number(intPart.replace(/\./g, '') || '0');
  const centavos = Number(decPart.padEnd(2, '0'));
  const cents = reais * 100 + centavos;
  if (!Number.isSafeInteger(cents)) return null;
  return negative ? -cents : cents;
}

/**
 * Máscara de moeda para campos de texto: os dígitos digitados são lidos como centavos.
 * "5" → "0,05", "5000" → "50,00". Texto sem dígitos → "".
 */
export function maskBRLInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
  if (digits === '') return '';
  return formatBRL(Number(digits)).replace('R$ ', '');
}
