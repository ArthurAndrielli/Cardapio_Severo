import { describe, expect, it } from 'vitest';
import { CART_STORAGE_KEY } from '../config/business';
import { loadCart, saveCart } from '../lib/storage';
import { buildOrderMessage, buildWhatsAppUrl } from '../lib/whatsapp';
import type { CartItem, CheckoutData } from '../models';

const items: CartItem[] = [
  { id: '1', mode: 'inteira', flavorIds: ['S08'], borderId: 'borda-catupiry', addonIds: ['add-bacon', 'add-ovo'], note: 'Bem assada', quantity: 2 },
  { id: '2', mode: 'meio', flavorIds: ['S08', 'D01'], borderId: null, addonIds: [], note: '', quantity: 1 },
];

const checkout = (p: Partial<CheckoutData> = {}): CheckoutData => ({
  name: 'Maria Silva',
  phone: '(19) 99999-8888',
  deliveryMode: 'entrega',
  address: { street: 'Rua A', number: '10', neighborhood: 'Centro', city: 'Santa Cruz da Conceição', reference: 'Perto da praça' },
  notes: 'Tocar a campainha',
  paymentMethod: 'dinheiro',
  needsChange: true,
  changeForCents: 30000,
  ...p,
});

describe('mensagem do WhatsApp', () => {
  // item 1: 6300 + 1500 + 700 + 200 = 8700 × 2 = 17400; item 2: 6300. Subtotal 23700, total 24200.
  it('segue o modelo completo na entrega com troco', () => {
    const msg = buildOrderMessage({ items, checkout: checkout() });
    expect(msg).toBe(
      [
        '🍕 *NOVO PEDIDO — SEVERO PIZZAS*',
        '',
        '*Cliente:* Maria Silva',
        '*Contato:* (19) 99999-8888',
        '',
        '*PEDIDO*',
        '',
        '2x Pizza Calabresa',
        'Borda: Catupiry',
        'Adicionais: Bacon, Ovo',
        'Obs.: Bem assada',
        '*Valor:* R$ 87,00 (× 2 = R$ 174,00)',
        '',
        '1x Pizza Meio a Meio',
        '½ Calabresa',
        '½ Chocolate',
        '*Valor:* R$ 63,00',
        '',
        '*Subtotal:* R$ 237,00',
        '*Entrega:* R$ 5,00',
        '*TOTAL: R$ 242,00*',
        '',
        '*Modalidade:* Entrega',
        '*Endereço:* Rua A, 10 — Centro, Santa Cruz da Conceição',
        '*Referência:* Perto da praça',
        '',
        '*Pagamento:* Dinheiro',
        '*Troco para:* R$ 300,00',
        '*Troco estimado:* R$ 58,00',
        '',
        '*Observações:* Tocar a campainha',
        '',
        '_Pedido sujeito a confirmação pela pizzaria._',
      ].join('\n'),
    );
  });

  it('retirada: sem taxa, sem endereço', () => {
    const msg = buildOrderMessage({ items, checkout: checkout({ deliveryMode: 'retirada', paymentMethod: 'pix', notes: '' }) });
    expect(msg).not.toContain('*Entrega:*');
    expect(msg).not.toContain('*Endereço:*');
    expect(msg).toContain('*TOTAL: R$ 237,00*');
    expect(msg).toContain('*Modalidade:* Retirada no local');
    expect(msg).toContain('*Pagamento:* Pix');
    expect(msg).not.toContain('Troco');
    expect(msg).not.toContain('*Observações:*');
    expect(msg).not.toMatch(/\n\n\n/);
  });

  it('dinheiro sem troco e cartões', () => {
    expect(buildOrderMessage({ items, checkout: checkout({ needsChange: false, changeForCents: null }) })).toContain('*Troco:* Não precisa');
    expect(buildOrderMessage({ items, checkout: checkout({ paymentMethod: 'credito' }) })).toContain('*Pagamento:* Cartão de crédito');
    expect(buildOrderMessage({ items, checkout: checkout({ paymentMethod: 'debito' }) })).toContain('*Pagamento:* Cartão de débito');
  });

  it('referência omitida quando vazia', () => {
    const c = checkout();
    const msg = buildOrderMessage({ items, checkout: { ...c, address: { ...c.address, reference: '' } } });
    expect(msg).not.toContain('Referência');
  });

  it('URL com número correto e texto codificado', () => {
    const msg = buildOrderMessage({ items, checkout: checkout() });
    const url = buildWhatsAppUrl(msg);
    expect(url.startsWith('https://wa.me/5519993972286?text=')).toBe(true);
    expect(url).toBe('https://wa.me/5519993972286?text=' + encodeURIComponent(msg));
    expect(decodeURIComponent(url.split('?text=')[1]!)).toBe(msg);
    expect(url).not.toContain(' ');
  });
});

describe('storage do carrinho', () => {
  it('salva e recarrega', () => {
    expect(saveCart(items)).toBe(true);
    expect(loadCart()).toEqual(items);
  });

  it('não salva preços', () => {
    saveCart(items);
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).not.toMatch(/price/i);
  });

  it('descarta JSON corrompido sem lançar erro', () => {
    window.localStorage.setItem(CART_STORAGE_KEY, '{nao é json');
    expect(loadCart()).toEqual([]);
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it('descarta versão diferente', () => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 99, items }));
    expect(loadCart()).toEqual([]);
  });

  it('descarta itens com ids inexistentes ou inválidos e mantém os válidos', () => {
    const bad = [
      { ...items[0], id: 'a', flavorIds: ['S39'] },
      { ...items[0], id: 'b', addonIds: ['add-inexistente'] },
      { ...items[0], id: 'c', quantity: 50 },
      { ...items[1], id: 'd', flavorIds: ['S08', 'S08'] },
      { ...items[1], id: 'e', addonIds: ['add-bacon'] }, // bloqueado (doce) pelas flags
      'lixo',
      null,
      items[1],
    ];
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, items: bad }));
    expect(loadCart()).toEqual([items[1]]);
  });

  it('nunca quebra se o storage lançar erro', () => {
    const broken = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('cheio');
      },
      removeItem: () => {
        throw new Error('bloqueado');
      },
    } as unknown as Storage;
    expect(loadCart(broken)).toEqual([]);
    expect(saveCart(items, broken)).toBe(false);
  });
});
