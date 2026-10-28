import type { Cents, DeliveryMode, FeatureFlags, PaymentMethod } from '../models';

/**
 * Configuração central da pizzaria.
 * Altere aqui telefone, taxa, rótulos, formas de pagamento e flags — sem mexer nos componentes.
 */
export const business = {
  name: 'Severo Pizzas Delivery',
  shortName: 'SEVERO PIZZAS',
  whatsappNumber: '5519993972286',
  whatsappDisplay: '(19) 99397-2286',
  address: {
    street: 'Rua Paschoal Ganeo',
    number: '1211',
    neighborhood: 'Centro',
    city: 'Santa Cruz da Conceição',
    state: 'SP',
  },
  /** Modalidades anunciadas pela pizzaria. */
  advertisedModes: ['Delivery', 'Drive-thru'],
  /** PENDENTE: horário não informado (ver docs/pendencias.md). */
  openingHoursText: 'Consulte o horário pelo WhatsApp',
  defaultCity: 'Santa Cruz da Conceição',
} as const;

export const fullAddress = `${business.address.street}, ${business.address.number}, ${business.address.neighborhood}, ${business.address.city} — ${business.address.state}`;

export const googleMapsUrl =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent(
    `${business.address.street}, ${business.address.number} - ${business.address.neighborhood}, ${business.address.city} - ${business.address.state}`,
  );

/** REGRA OFICIAL: taxa fixa por pedido de entrega. */
export const DELIVERY_FEE_CENTS: Cents = 500;

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 20;

export const deliveryModeLabels: Record<DeliveryMode, string> = {
  entrega: 'Entrega',
  retirada: 'Retirada no local',
};

export interface PaymentOption {
  id: PaymentMethod;
  label: string;
  description: string;
}

/** Exatamente quatro formas de pagamento, na ordem de exibição. */
export const paymentMethods: PaymentOption[] = [
  { id: 'pix', label: 'Pix', description: 'Pagamento via Pix. Os dados para pagamento serão enviados pela pizzaria.' },
  { id: 'dinheiro', label: 'Dinheiro', description: 'Pagamento em dinheiro. Informe abaixo se vai precisar de troco.' },
  {
    id: 'credito',
    label: 'Cartão de crédito',
    description: 'Forma de pagamento registrada: cartão de crédito. Nenhum dado do cartão é pedido aqui; o pagamento é combinado com a pizzaria.',
  },
  {
    id: 'debito',
    label: 'Cartão de débito',
    description: 'Forma de pagamento registrada: cartão de débito. Nenhum dado do cartão é pedido aqui; o pagamento é combinado com a pizzaria.',
  },
];

export const paymentLabels: Record<PaymentMethod, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  credito: 'Cartão de crédito',
  debito: 'Cartão de débito',
};

/**
 * PENDENTE (docs/pendencias.md): política de adicionais/borda em pizzas doces.
 * false = bloqueado em pizza doce inteira, doce + doce e salgada + doce.
 */
export const featureFlags: FeatureFlags = {
  allowAddonsOnSweet: false,
  allowBorderOnSweet: false,
};

export const messages = {
  sweetAddonsBlocked: 'Adicionais indisponíveis para pizzas doces no momento.',
  deliveryAreaNotice: 'A disponibilidade de entrega para o seu endereço será confirmada pelo WhatsApp.',
  orderNotice: 'Pedidos sujeitos ao horário de funcionamento e à confirmação pelo WhatsApp.',
  afterSend: 'Seu pedido foi preparado no WhatsApp. Envie a mensagem para a pizzaria confirmar.',
} as const;

export const CART_STORAGE_KEY = 'severo-cart-v1';
export const CART_SCHEMA_VERSION = 1;
