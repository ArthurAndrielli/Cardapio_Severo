import { DELIVERY_FEE_CENTS, MAX_QUANTITY, MIN_QUANTITY, featureFlags } from '../config/business';
import { addonsById, bordersById } from '../data/addons';
import { flavorsById } from '../data/menu';
import type { CartItem, Cents, DeliveryMode, FeatureFlags, Flavor, PizzaConfig } from '../models';
import { multiplyCents, sumCents } from './money';

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PricingError';
  }
}

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function getFlavor(id: string): Flavor | undefined {
  return flavorsById.get(id);
}

/** true se algum sabor da pizza é doce (doce inteira, doce + doce ou salgada + doce). */
export function isSweetPizza(cfg: Pick<PizzaConfig, 'flavorIds'>): boolean {
  return cfg.flavorIds.some((id) => getFlavor(id)?.category === 'doce');
}

export function canUseAddons(cfg: Pick<PizzaConfig, 'flavorIds'>, flags: FeatureFlags = featureFlags): boolean {
  return !isSweetPizza(cfg) || flags.allowAddonsOnSweet;
}

export function canUseBorder(cfg: Pick<PizzaConfig, 'flavorIds'>, flags: FeatureFlags = featureFlags): boolean {
  return !isSweetPizza(cfg) || flags.allowBorderOnSweet;
}

export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= MIN_QUANTITY && quantity <= MAX_QUANTITY;
}

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return MIN_QUANTITY;
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.trunc(quantity)));
}

export function validatePizza(cfg: PizzaConfig, flags: FeatureFlags = featureFlags): ValidationResult {
  const expected = cfg.mode === 'inteira' ? 1 : cfg.mode === 'meio' ? 2 : -1;
  if (expected === -1) return { ok: false, error: 'Tipo de pizza inválido.' };
  if (cfg.flavorIds.length !== expected) {
    return {
      ok: false,
      error: cfg.mode === 'inteira' ? 'Escolha um sabor.' : 'Escolha dois sabores para a pizza meio a meio.',
    };
  }
  if (cfg.flavorIds.some((id) => !getFlavor(id))) return { ok: false, error: 'Sabor inexistente.' };
  if (cfg.mode === 'meio' && cfg.flavorIds[0] === cfg.flavorIds[1]) {
    return { ok: false, error: 'Escolha dois sabores diferentes para a pizza meio a meio.' };
  }
  if (cfg.borderId !== null) {
    if (!bordersById.has(cfg.borderId)) return { ok: false, error: 'Borda inexistente.' };
    if (!canUseBorder(cfg, flags)) return { ok: false, error: 'Borda indisponível para pizzas doces.' };
  }
  if (new Set(cfg.addonIds).size !== cfg.addonIds.length) {
    return { ok: false, error: 'Cada adicional pode ser escolhido apenas uma vez.' };
  }
  if (cfg.addonIds.some((id) => !addonsById.has(id))) return { ok: false, error: 'Adicional inexistente.' };
  if (cfg.addonIds.length > 0 && !canUseAddons(cfg, flags)) {
    return { ok: false, error: 'Adicionais indisponíveis para pizzas doces.' };
  }
  return { ok: true };
}

function assertValid(cfg: PizzaConfig, flags: FeatureFlags): void {
  const result = validatePizza(cfg, flags);
  if (!result.ok) throw new PricingError(result.error);
}

/** Inteira: preço do sabor. Meio a meio: REGRA OFICIAL — cobra o sabor mais caro. */
export function calculateBasePrice(cfg: PizzaConfig, flags: FeatureFlags = featureFlags): Cents {
  assertValid(cfg, flags);
  const prices = cfg.flavorIds.map((id) => getFlavor(id)!.priceCents);
  return Math.max(...prices);
}

export function calculateBorderPrice(cfg: Pick<PizzaConfig, 'borderId'>): Cents {
  return cfg.borderId ? (bordersById.get(cfg.borderId)?.priceCents ?? 0) : 0;
}

export function calculateAddonsPrice(cfg: Pick<PizzaConfig, 'addonIds'>): Cents {
  return sumCents(cfg.addonIds.map((id) => addonsById.get(id)?.priceCents ?? 0));
}

/** Preço de uma pizza: base + borda + soma dos adicionais (cada um cobrado uma vez). */
export function calculateUnitPrice(cfg: PizzaConfig, flags: FeatureFlags = featureFlags): Cents {
  return calculateBasePrice(cfg, flags) + calculateBorderPrice(cfg) + calculateAddonsPrice(cfg);
}

export function calculateItemSubtotal(item: CartItem, flags: FeatureFlags = featureFlags): Cents {
  if (!isValidQuantity(item.quantity)) {
    throw new PricingError(`A quantidade deve estar entre ${MIN_QUANTITY} e ${MAX_QUANTITY}.`);
  }
  return multiplyCents(calculateUnitPrice(item, flags), item.quantity);
}

export function calculateSubtotal(items: CartItem[], flags: FeatureFlags = featureFlags): Cents {
  return sumCents(items.map((item) => calculateItemSubtotal(item, flags)));
}

/** REGRA OFICIAL: taxa fixa, cobrada uma única vez por pedido de entrega. */
export function getDeliveryFee(mode: DeliveryMode | null): Cents {
  return mode === 'entrega' ? DELIVERY_FEE_CENTS : 0;
}

export function calculateTotal(subtotal: Cents, mode: DeliveryMode | null): Cents {
  return subtotal + getDeliveryFee(mode);
}

/** Troco = valor informado − total. Não altera o total. */
export function calculateChange(paidCents: Cents, totalCents: Cents): Cents {
  return paidCents - totalCents;
}

/** Remove adicionais/borda que a combinação atual de sabores não permite. */
export function stripBlockedExtras(cfg: PizzaConfig, flags: FeatureFlags = featureFlags): PizzaConfig {
  return {
    ...cfg,
    addonIds: canUseAddons(cfg, flags) ? cfg.addonIds : [],
    borderId: canUseBorder(cfg, flags) ? cfg.borderId : null,
  };
}
