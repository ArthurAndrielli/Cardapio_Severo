/** Valor monetário em centavos inteiros. Nunca usar float para dinheiro. */
export type Cents = number;

/** Categorias do cardápio. Novas categorias (ex.: bebidas) podem ser adicionadas aqui. */
export type FlavorCategory = 'salgada' | 'doce';

export interface Flavor {
  /** Identificador único: S01…S49 (salgadas), D01…D03 (doces). */
  id: string;
  /** Número original exibido no cardápio (ex.: "01"). */
  code: string;
  name: string;
  category: FlavorCategory;
  priceCents: Cents;
  ingredients: string;
}

export interface Addon {
  id: string;
  name: string;
  priceCents: Cents;
}

export interface Border {
  id: string;
  /** Nome completo exibido no personalizador. */
  name: string;
  /** Nome curto usado no carrinho e na mensagem (ex.: "Catupiry"). */
  shortName: string;
  priceCents: Cents;
}

export type PizzaMode = 'inteira' | 'meio';

export interface PizzaConfig {
  mode: PizzaMode;
  /** 1 sabor (inteira) ou 2 sabores diferentes (meio a meio). */
  flavorIds: string[];
  borderId: string | null;
  /** Adicionais da pizza inteira, sem repetição. */
  addonIds: string[];
  note: string;
}

export interface CartItem extends PizzaConfig {
  id: string;
  quantity: number;
}

export type DeliveryMode = 'entrega' | 'retirada';

export type PaymentMethod = 'pix' | 'dinheiro' | 'credito' | 'debito';

export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  reference: string;
}

export interface CheckoutData {
  name: string;
  phone: string;
  deliveryMode: DeliveryMode | null;
  address: Address;
  notes: string;
  paymentMethod: PaymentMethod | null;
  /** Só relevante para dinheiro. null = ainda não respondeu. */
  needsChange: boolean | null;
  /** Valor informado em "Troco para quanto?". */
  changeForCents: Cents | null;
}

export interface Order {
  items: CartItem[];
  checkout: CheckoutData;
}

export interface FeatureFlags {
  allowAddonsOnSweet: boolean;
  allowBorderOnSweet: boolean;
}
