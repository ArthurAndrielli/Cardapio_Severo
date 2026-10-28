import { describe, expect, it } from 'vitest';
import type { CheckoutData } from '../models';
import { formatBRL, maskBRLInput, parseBRLInput } from '../lib/money';
import { firstInvalidField, maskPhone, validateChange, validateCheckout, validatePhone } from '../lib/validation';
import { filterFlavors, normalizeText } from '../lib/search';
import { flavors } from '../data/menu';

describe('formatação monetária', () => {
  it('formata em pt-BR', () => {
    expect(formatBRL(12300)).toBe('R$ 123,00');
    expect(formatBRL(500)).toBe('R$ 5,00');
    expect(formatBRL(0)).toBe('R$ 0,00');
    expect(formatBRL(123456)).toBe('R$ 1.234,56');
  });
  it('rejeita valores não inteiros', () => {
    expect(() => formatBRL(1.5)).toThrow(TypeError);
  });
  it('converte texto em centavos', () => {
    expect(parseBRLInput('R$ 150,00')).toBe(15000);
    expect(parseBRLInput('1.234,5')).toBe(123450);
    expect(parseBRLInput('50')).toBe(5000);
    expect(parseBRLInput('-10,00')).toBe(-1000);
    expect(parseBRLInput('')).toBeNull();
    expect(parseBRLInput('abc')).toBeNull();
  });
  it('máscara de moeda', () => {
    expect(maskBRLInput('5')).toBe('0,05');
    expect(maskBRLInput('15000')).toBe('150,00');
    expect(maskBRLInput('R$ 1.500,00x')).toBe('1.500,00');
    expect(maskBRLInput('')).toBe('');
  });
});

describe('validação do troco', () => {
  const total = 12300;
  it('aceita valor maior que o total', () => {
    expect(validateChange(15000, total)).toBeNull();
  });
  it('rejeita igual com mensagem específica', () => {
    expect(validateChange(12300, total)).toBe("Esse valor é igual ao total. Selecione 'Não preciso de troco'.");
  });
  it('rejeita menor, zero, negativo e vazio', () => {
    expect(validateChange(10000, total)).toMatch(/maior que o total/);
    expect(validateChange(0, total)).toMatch(/maior que zero/);
    expect(validateChange(-500, total)).toMatch(/maior que zero/);
    expect(validateChange(null, total)).toMatch(/Informe/);
  });
});

describe('telefone', () => {
  it('aceita celular e fixo com DDD válido', () => {
    expect(validatePhone('(19) 99397-2286')).toBeNull();
    expect(validatePhone('19993972286')).toBeNull();
    expect(validatePhone('(19) 3333-4444')).toBeNull();
  });
  it('rejeita inválidos', () => {
    expect(validatePhone('')).not.toBeNull();
    expect(validatePhone('1999397')).not.toBeNull();
    expect(validatePhone('(20) 99397-2286')).toMatch(/DDD/);
    expect(validatePhone('(00) 99397-2286')).toMatch(/DDD/);
    expect(validatePhone('(19) 89397-2286')).not.toBeNull();
    expect(validatePhone('(19) 9999-4444')).not.toBeNull();
  });
  it('máscara', () => {
    expect(maskPhone('19993972286')).toBe('(19) 99397-2286');
    expect(maskPhone('1933334444')).toBe('(19) 3333-4444');
    expect(maskPhone('199')).toBe('(19) 9');
  });
});

const base = (p: Partial<CheckoutData> = {}): CheckoutData => ({
  name: 'Ana',
  phone: '(19) 99397-2286',
  deliveryMode: 'retirada',
  address: { street: '', number: '', neighborhood: '', city: 'Santa Cruz da Conceição', reference: '' },
  notes: '',
  paymentMethod: 'pix',
  needsChange: null,
  changeForCents: null,
  ...p,
});

describe('validação do checkout', () => {
  it('retirada válida não exige endereço', () => {
    expect(validateCheckout(base(), 6300)).toEqual({});
  });
  it('entrega exige rua, número, bairro e cidade', () => {
    const errors = validateCheckout(base({ deliveryMode: 'entrega', address: { street: '', number: '', neighborhood: '', city: '', reference: '' } }), 6300);
    expect(Object.keys(errors).sort()).toEqual(['city', 'neighborhood', 'number', 'street']);
  });
  it('exige nome, telefone, modalidade e pagamento', () => {
    const errors = validateCheckout(base({ name: 'A', phone: '', deliveryMode: null, paymentMethod: null }), 6300);
    expect(Object.keys(errors).sort()).toEqual(['deliveryMode', 'name', 'paymentMethod', 'phone']);
    expect(firstInvalidField(errors)).toBe('name');
  });
  it('dinheiro exige resposta sobre troco e valor válido', () => {
    expect(validateCheckout(base({ paymentMethod: 'dinheiro' }), 6300)).toHaveProperty('needsChange');
    expect(validateCheckout(base({ paymentMethod: 'dinheiro', needsChange: false }), 6300)).toEqual({});
    expect(validateCheckout(base({ paymentMethod: 'dinheiro', needsChange: true, changeForCents: 6300 }), 6300)).toHaveProperty('changeFor');
    expect(validateCheckout(base({ paymentMethod: 'dinheiro', needsChange: true, changeForCents: 10000 }), 6300)).toEqual({});
  });
  it('revalida troco quando o total muda', () => {
    const data = base({ paymentMethod: 'dinheiro', needsChange: true, changeForCents: 6500 });
    expect(validateCheckout(data, 6300)).toEqual({});
    expect(validateCheckout(data, 6800)).toHaveProperty('changeFor');
  });
});

describe('busca', () => {
  it('ignora acentos e maiúsculas', () => {
    expect(normalizeText('Brócolis')).toBe('brocolis');
    expect(filterFlavors(flavors, 'BROCOLIS').map((f) => f.id)).toContain('S06');
    expect(filterFlavors(flavors, 'prestigio').map((f) => f.id)).toEqual(['D03']);
  });
  it('busca por ingrediente', () => {
    const ids = filterFlavors(flavors, 'gorgonzola').map((f) => f.id);
    expect(ids).toEqual(['S29']);
    expect(filterFlavors(flavors, 'coco').map((f) => f.id)).toEqual(['D03']);
  });
  it('filtra por categoria', () => {
    expect(filterFlavors(flavors, '', 'doce')).toHaveLength(3);
    expect(filterFlavors(flavors, 'chocolate', 'salgada')).toHaveLength(0);
  });
});
