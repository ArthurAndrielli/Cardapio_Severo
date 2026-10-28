import { describe, expect, it } from 'vitest';
import type { CartItem, FeatureFlags, PizzaConfig } from '../models';
import {
  PricingError,
  calculateChange,
  calculateItemSubtotal,
  calculateSubtotal,
  calculateTotal,
  calculateUnitPrice,
  canUseAddons,
  canUseBorder,
  clampQuantity,
  getDeliveryFee,
  isValidQuantity,
  stripBlockedExtras,
  validatePizza,
} from '../lib/pricing';

const CALABRESA = 'S08';
const ATUM = 'S02';
const CHOCOLATE = 'D01';
const PRESTIGIO = 'D03';
const BACON = 'add-bacon';
const OVO = 'add-ovo';
const BORDA = 'borda-catupiry';

const pizza = (p: Partial<PizzaConfig>): PizzaConfig => ({ mode: 'inteira', flavorIds: [], borderId: null, addonIds: [], note: '', ...p });
const item = (p: Partial<CartItem>): CartItem => ({ ...pizza(p), id: 'x', quantity: 1, ...p });
const meio = (a: string, b: string, extra: Partial<PizzaConfig> = {}) => pizza({ mode: 'meio', flavorIds: [a, b], ...extra });

const OPEN: FeatureFlags = { allowAddonsOnSweet: true, allowBorderOnSweet: true };

describe('pizza inteira', () => {
  it('sem adicionais', () => {
    expect(calculateUnitPrice(pizza({ flavorIds: [CALABRESA] }))).toBe(6300);
  });
  it('com borda e adicionais', () => {
    expect(calculateUnitPrice(pizza({ flavorIds: [CALABRESA], borderId: BORDA, addonIds: [BACON, OVO] }))).toBe(
      6300 + 1500 + 700 + 200,
    );
  });
  it('rejeita mais de um sabor', () => {
    expect(validatePizza(pizza({ flavorIds: [CALABRESA, ATUM] })).ok).toBe(false);
  });
});

describe('meio a meio — cobra o sabor mais caro', () => {
  it('Calabresa + Atum = 7000 (salgada + salgada)', () => {
    expect(calculateUnitPrice(meio(CALABRESA, ATUM))).toBe(7000);
    expect(calculateUnitPrice(meio(ATUM, CALABRESA))).toBe(7000);
  });
  it('Calabresa + Chocolate = 6300 (salgada + doce)', () => {
    expect(calculateUnitPrice(meio(CALABRESA, CHOCOLATE))).toBe(6300);
  });
  it('Chocolate + Prestígio = 5500 (doce + doce)', () => {
    expect(calculateUnitPrice(meio(CHOCOLATE, PRESTIGIO))).toBe(5500);
  });
  it('Calabresa + Atum + Bacon = 7700', () => {
    expect(calculateUnitPrice(meio(CALABRESA, ATUM, { addonIds: [BACON] }))).toBe(7700);
  });
  it('nunca faz média nem soma', () => {
    const v = calculateUnitPrice(meio(CALABRESA, ATUM));
    expect(v).not.toBe((6300 + 7000) / 2);
    expect(v).not.toBe(6300 + 7000);
  });
  it('rejeita dois sabores iguais', () => {
    const cfg = meio(CALABRESA, CALABRESA);
    expect(validatePizza(cfg)).toEqual({ ok: false, error: expect.stringContaining('diferentes') });
    expect(() => calculateUnitPrice(cfg)).toThrow(PricingError);
  });
  it('rejeita apenas um sabor ou sabor inexistente', () => {
    expect(validatePizza(pizza({ mode: 'meio', flavorIds: [CALABRESA] })).ok).toBe(false);
    expect(validatePizza(meio(CALABRESA, 'S39')).ok).toBe(false);
  });
  it('rejeita adicional repetido ou inexistente', () => {
    expect(validatePizza(pizza({ flavorIds: [CALABRESA], addonIds: [BACON, BACON] })).ok).toBe(false);
    expect(validatePizza(pizza({ flavorIds: [CALABRESA], addonIds: ['add-xyz'] })).ok).toBe(false);
  });
});

describe('flags de adicionais e borda em pizzas doces', () => {
  it('bloqueados por padrão em doce inteira, doce + doce e salgada + doce', () => {
    for (const cfg of [pizza({ flavorIds: [CHOCOLATE] }), meio(CHOCOLATE, PRESTIGIO), meio(CALABRESA, CHOCOLATE)]) {
      expect(canUseAddons(cfg)).toBe(false);
      expect(canUseBorder(cfg)).toBe(false);
      expect(validatePizza({ ...cfg, addonIds: [BACON] }).ok).toBe(false);
      expect(validatePizza({ ...cfg, borderId: BORDA }).ok).toBe(false);
    }
  });
  it('liberados em salgada inteira e salgada + salgada', () => {
    expect(canUseAddons(pizza({ flavorIds: [CALABRESA] }))).toBe(true);
    expect(canUseBorder(meio(CALABRESA, ATUM))).toBe(true);
  });
  it('liberados quando a flag muda', () => {
    const cfg = meio(CALABRESA, CHOCOLATE, { addonIds: [BACON], borderId: BORDA });
    expect(canUseAddons(cfg, OPEN)).toBe(true);
    expect(validatePizza(cfg, OPEN).ok).toBe(true);
    expect(calculateUnitPrice(cfg, OPEN)).toBe(6300 + 700 + 1500);
    expect(validatePizza(cfg, { allowAddonsOnSweet: true, allowBorderOnSweet: false }).ok).toBe(false);
  });
  it('stripBlockedExtras remove os extras bloqueados', () => {
    const cfg = stripBlockedExtras(meio(CALABRESA, CHOCOLATE, { addonIds: [BACON], borderId: BORDA }));
    expect(cfg.addonIds).toEqual([]);
    expect(cfg.borderId).toBeNull();
  });
});

describe('quantidade', () => {
  it('subtotal = unitário × quantidade', () => {
    expect(calculateItemSubtotal(item({ flavorIds: [CALABRESA], addonIds: [BACON], quantity: 3 }))).toBe(7000 * 3);
  });
  it('adicionais cobrados uma vez por pizza antes da multiplicação', () => {
    expect(calculateItemSubtotal(item({ mode: 'meio', flavorIds: [CALABRESA, ATUM], addonIds: [BACON], quantity: 2 }))).toBe(15400);
  });
  it('limites 1 e 20', () => {
    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity(20)).toBe(true);
    expect(isValidQuantity(0)).toBe(false);
    expect(isValidQuantity(21)).toBe(false);
    expect(isValidQuantity(1.5)).toBe(false);
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(99)).toBe(20);
    expect(() => calculateItemSubtotal(item({ flavorIds: [CALABRESA], quantity: 21 }))).toThrow(PricingError);
    expect(() => calculateItemSubtotal(item({ flavorIds: [CALABRESA], quantity: 0 }))).toThrow(PricingError);
  });
});

describe('entrega e total', () => {
  const items = [item({ id: 'a', flavorIds: [CALABRESA] }), item({ id: 'b', flavorIds: [CHOCOLATE] })];
  it('subtotal 11800 → entrega 12300, retirada 11800', () => {
    const subtotal = calculateSubtotal(items);
    expect(subtotal).toBe(11800);
    expect(calculateTotal(subtotal, 'entrega')).toBe(12300);
    expect(calculateTotal(subtotal, 'retirada')).toBe(11800);
  });
  it('taxa cobrada uma única vez, independente da quantidade', () => {
    const many = [item({ id: 'a', flavorIds: [CALABRESA], quantity: 10 }), item({ id: 'b', flavorIds: [ATUM], quantity: 5 })];
    const subtotal = calculateSubtotal(many);
    expect(calculateTotal(subtotal, 'entrega') - subtotal).toBe(500);
    expect(getDeliveryFee('entrega')).toBe(500);
    expect(getDeliveryFee('retirada')).toBe(0);
    expect(getDeliveryFee(null)).toBe(0);
  });
});

describe('troco', () => {
  it('troco = valor − total', () => {
    expect(calculateChange(15000, 12300)).toBe(2700);
  });
});
