import { CART_SCHEMA_VERSION, CART_STORAGE_KEY } from '../config/business';
import type { CartItem, PizzaMode } from '../models';
import { isValidQuantity, validatePizza } from './pricing';

/**
 * Persistência do carrinho. Guarda apenas a personalização dos itens — nunca preços
 * (sempre recalculados do cardápio atual) nem dados pessoais do cliente.
 */
interface StoredCart {
  version: number;
  items: unknown[];
}

function getStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/** Converte um item desconhecido em CartItem válido, ou null se inválido / com ids inexistentes. */
export function sanitizeCartItem(raw: unknown): CartItem | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || r.id === '') return null;
  if (r.mode !== 'inteira' && r.mode !== 'meio') return null;
  if (!isStringArray(r.flavorIds) || !isStringArray(r.addonIds)) return null;
  if (r.borderId !== null && typeof r.borderId !== 'string') return null;
  if (typeof r.quantity !== 'number' || !isValidQuantity(r.quantity)) return null;
  const item: CartItem = {
    id: r.id,
    mode: r.mode as PizzaMode,
    flavorIds: [...r.flavorIds],
    borderId: r.borderId as string | null,
    addonIds: [...r.addonIds],
    note: typeof r.note === 'string' ? r.note.slice(0, 200) : '',
    quantity: r.quantity,
  };
  return validatePizza(item).ok ? item : null;
}

export function loadCart(storage: Storage | null = getStorage()): CartItem[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<StoredCart>;
    if (!parsed || parsed.version !== CART_SCHEMA_VERSION || !Array.isArray(parsed.items)) {
      storage.removeItem(CART_STORAGE_KEY);
      return [];
    }
    const seen = new Set<string>();
    const items: CartItem[] = [];
    for (const rawItem of parsed.items) {
      const item = sanitizeCartItem(rawItem);
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        items.push(item);
      }
    }
    return items;
  } catch {
    try {
      storage.removeItem(CART_STORAGE_KEY);
    } catch {
      /* armazenamento indisponível */
    }
    return [];
  }
}

export function saveCart(items: CartItem[], storage: Storage | null = getStorage()): boolean {
  if (!storage) return false;
  try {
    const payload: StoredCart = { version: CART_SCHEMA_VERSION, items };
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    /* contexto inseguro */
  }
  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
