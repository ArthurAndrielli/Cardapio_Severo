import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { CartItem, Cents, PizzaConfig } from '../models';
import { calculateSubtotal, clampQuantity } from '../lib/pricing';
import { createId, loadCart, saveCart } from '../lib/storage';

type Action =
  | { type: 'add'; config: PizzaConfig; quantity: number; id: string }
  | { type: 'replace'; id: string; config: PizzaConfig; quantity: number }
  | { type: 'setQuantity'; id: string; quantity: number }
  | { type: 'remove'; id: string }
  | { type: 'restore'; item: CartItem; index: number }
  | { type: 'clear' };

function toItem(id: string, config: PizzaConfig, quantity: number): CartItem {
  return {
    id,
    mode: config.mode,
    flavorIds: [...config.flavorIds],
    borderId: config.borderId,
    addonIds: [...config.addonIds],
    note: config.note.trim(),
    quantity: clampQuantity(quantity),
  };
}

export function cartReducer(state: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case 'add':
      return [...state, toItem(action.id, action.config, action.quantity)];
    case 'replace':
      return state.map((item) => (item.id === action.id ? toItem(item.id, action.config, action.quantity) : item));
    case 'setQuantity':
      return state.map((item) => (item.id === action.id ? { ...item, quantity: clampQuantity(action.quantity) } : item));
    case 'remove':
      return state.filter((item) => item.id !== action.id);
    case 'restore': {
      if (state.some((i) => i.id === action.item.id)) return state;
      const next = [...state];
      next.splice(Math.min(action.index, next.length), 0, action.item);
      return next;
    }
    case 'clear':
      return [];
  }
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: Cents;
  addItem: (config: PizzaConfig, quantity: number) => string;
  replaceItem: (id: string, config: PizzaConfig, quantity: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => { item: CartItem; index: number } | null;
  restoreItem: (item: CartItem, index: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, () => loadCart());

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((config: PizzaConfig, quantity: number) => {
    const id = createId();
    dispatch({ type: 'add', config, quantity, id });
    return id;
  }, []);

  const removeItem = useCallback(
    (id: string) => {
      const index = items.findIndex((i) => i.id === id);
      const item = items[index];
      dispatch({ type: 'remove', id });
      return item ? { item, index } : null;
    },
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: calculateSubtotal(items),
      addItem,
      replaceItem: (id, config, quantity) => dispatch({ type: 'replace', id, config, quantity }),
      setQuantity: (id, quantity) => dispatch({ type: 'setQuantity', id, quantity }),
      removeItem,
      restoreItem: (item, index) => dispatch({ type: 'restore', item, index }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [items, addItem, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de <CartProvider>.');
  return ctx;
}
