import { render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import App from '../App';
import { CART_STORAGE_KEY } from '../config/business';
import { pickFlavor } from './helpers';

let openSpy: MockInstance<typeof window.open>;

beforeEach(() => {
  openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
});
afterEach(() => {
  openSpy.mockRestore();
});

const dialog = (name: string | RegExp) => screen.getByRole('dialog', { name });

async function addPizza(user: UserEvent, flavorName: string, second?: string) {
  await user.click(screen.getByRole('button', { name: `Montar pizza ${flavorName}` }));
  const d = dialog('Monte sua pizza');
  if (second) {
    await user.click(within(d).getByRole('radio', { name: /Meio a meio/ }));
    await pickFlavor(user, d, '2ª metade', second);
  }
  await user.click(within(d).getByRole('button', { name: 'Adicionar ao carrinho' }));
}

async function openCheckout(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: /Abrir carrinho/ }));
  await user.click(within(dialog('Seu carrinho')).getByRole('button', { name: 'Finalizar pedido' }));
  return dialog('Finalizar pedido');
}

async function fillCustomer(user: UserEvent, d: HTMLElement) {
  await user.type(within(d).getByLabelText(/Nome/), 'Maria Silva');
  await user.type(within(d).getByLabelText(/Telefone/), '19999998888');
}

describe('fluxo completo', () => {
  it('monta meio a meio, edita, altera quantidade, remove, faz checkout e gera o link', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Meio a meio Calabresa + Atum (vale o mais caro: 70,00)
    await addPizza(user, 'Calabresa', 'Atum');
    expect(screen.getByRole('button', { name: 'Abrir carrinho, 1 item' })).toBeInTheDocument();
    // Pizza inteira de Chocolate
    await user.click(screen.getByRole('button', { name: 'Doces' }));
    await addPizza(user, 'Chocolate');

    await user.click(screen.getByRole('button', { name: /Abrir carrinho, 2 itens/ }));
    let cart = dialog('Seu carrinho');
    expect(within(cart).getByText('½ Calabresa')).toBeInTheDocument();
    expect(within(cart).getByText('½ Atum')).toBeInTheDocument();
    expect(within(cart).getByTestId('cart-subtotal')).toHaveTextContent('R$ 125,00');

    // Editar: adiciona Bacon ao meio a meio
    await user.click(within(cart).getByRole('button', { name: 'Editar Pizza Meio a Meio' }));
    const edit = dialog('Editar pizza');
    expect(within(edit).getByRole('button', { name: /^2ª metade: Atum, R\$ 70,00/ })).toBeInTheDocument();
    await user.click(within(edit).getByRole('checkbox', { name: /Bacon/ }));
    await user.click(within(edit).getByRole('button', { name: 'Salvar alterações' }));
    cart = dialog('Seu carrinho');
    expect(within(cart).getByText('Adicionais: Bacon')).toBeInTheDocument();
    expect(within(cart).getByTestId('cart-subtotal')).toHaveTextContent('R$ 132,00');

    // Quantidade
    await user.click(within(cart).getByRole('button', { name: 'Aumentar quantidade de Pizza Meio a Meio' }));
    expect(within(cart).getByTestId('cart-subtotal')).toHaveTextContent('R$ 209,00');
    await user.click(within(cart).getByRole('button', { name: 'Diminuir quantidade de Pizza Meio a Meio' }));
    expect(within(cart).getByTestId('cart-subtotal')).toHaveTextContent('R$ 132,00');

    // Remover com desfazer
    await user.click(within(cart).getByRole('button', { name: 'Remover Pizza Chocolate' }));
    expect(within(cart).getByTestId('cart-subtotal')).toHaveTextContent('R$ 77,00');
    await user.click(within(cart).getByRole('button', { name: /Desfazer/ }));
    expect(within(cart).getByTestId('cart-subtotal')).toHaveTextContent('R$ 132,00');
    await user.click(within(cart).getByRole('button', { name: 'Remover Pizza Chocolate' }));
    expect(within(cart).getByTestId('cart-subtotal')).toHaveTextContent('R$ 77,00');

    // Carrinho persistido
    expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)!).items).toHaveLength(1);

    // Checkout
    await user.click(within(cart).getByRole('button', { name: 'Finalizar pedido' }));
    const co = dialog('Finalizar pedido');
    await fillCustomer(user, co);
    await user.click(within(co).getByRole('radio', { name: /Retirada no local/ }));

    // Sem forma de pagamento: bloqueia e foca o grupo
    await user.click(screen.getByRole('button', { name: 'Enviar pedido pelo WhatsApp' }));
    expect(openSpy).not.toHaveBeenCalled();
    expect(within(co).getByText('Escolha a forma de pagamento.')).toBeInTheDocument();
    expect(within(co).getByRole('radio', { name: 'Pix' })).toHaveFocus();

    // As quatro formas de pagamento
    const group = within(co).getByRole('radiogroup', { name: 'Forma de pagamento' });
    const options = within(group).getAllByRole('radio');
    expect(options.map((o) => o.closest('label')?.textContent)).toEqual(['Pix', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito']);

    await user.click(within(group).getByRole('radio', { name: 'Cartão de crédito' }));
    expect(within(co).getByTestId('payment-info')).toHaveTextContent(/cartão de crédito/);
    await user.click(within(group).getByRole('radio', { name: 'Cartão de débito' }));
    expect(within(co).getByTestId('payment-info')).toHaveTextContent(/cartão de débito/);
    expect(within(co).queryByLabelText(/CVV|validade|número do cartão/i)).not.toBeInTheDocument();

    await user.click(within(group).getByRole('radio', { name: 'Dinheiro' }));
    await user.click(within(co).getByRole('radio', { name: 'Sim, preciso de troco' }));
    const changeInput = within(co).getByLabelText('Troco para quanto?');
    await user.type(changeInput, '7700');
    await user.click(screen.getByRole('button', { name: 'Enviar pedido pelo WhatsApp' }));
    expect(within(co).getByText("Esse valor é igual ao total. Selecione 'Não preciso de troco'.")).toBeInTheDocument();
    expect(changeInput).toHaveFocus();
    expect(openSpy).not.toHaveBeenCalled();
    await user.clear(changeInput);
    await user.type(changeInput, '10000');
    expect(changeInput).toHaveValue('100,00');
    expect(within(co).getByTestId('checkout-summary')).toHaveTextContent('Troco estimadoR$ 23,00');

    await user.click(within(group).getByRole('radio', { name: 'Pix' }));
    expect(within(co).getByTestId('payment-info')).toHaveTextContent(
      'Pagamento via Pix. Os dados para pagamento serão enviados pela pizzaria.',
    );

    await user.click(screen.getByRole('button', { name: 'Enviar pedido pelo WhatsApp' }));
    expect(openSpy).toHaveBeenCalledTimes(1);
    const url = String(openSpy.mock.calls[0]![0]);
    expect(url.startsWith('https://wa.me/5519993972286?text=')).toBe(true);
    const msg = decodeURIComponent(url.split('?text=')[1]!);
    expect(msg).toContain('1x Pizza Meio a Meio\n½ Calabresa\n½ Atum\nAdicionais: Bacon\n*Valor:* R$ 77,00');
    expect(msg).toContain('*Modalidade:* Retirada no local');
    expect(msg).toContain('*Pagamento:* Pix');
    expect(msg).not.toContain('*Entrega:*');
    expect(openSpy.mock.calls[0]![1]).toBe('_blank');

    // Após envio: aviso e pergunta sobre limpar (não limpa automaticamente)
    const sent = dialog('Pedido preparado');
    expect(within(sent).getByText('Seu pedido foi preparado no WhatsApp. Envie a mensagem para a pizzaria confirmar.')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)!).items).toHaveLength(1);
    await user.click(within(sent).getByRole('button', { name: 'Sim, limpar carrinho' }));
    expect(screen.getByRole('button', { name: 'Abrir carrinho, 0 itens' })).toBeInTheDocument();
  });

  it('alternar entrega/retirada atualiza o total e revalida o troco', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addPizza(user, 'Calabresa');
    await user.click(screen.getByRole('button', { name: 'Doces' }));
    await addPizza(user, 'Chocolate');
    const co = await openCheckout(user);

    expect(within(co).getByTestId('checkout-total')).toHaveTextContent('R$ 118,00');
    await user.click(within(co).getByRole('radio', { name: /^Entrega/ }));
    expect(within(co).getByTestId('checkout-total')).toHaveTextContent('R$ 123,00');
    expect(within(co).getByTestId('checkout-summary')).toHaveTextContent('EntregaR$ 5,00');
    expect(within(co).getByText('A disponibilidade de entrega para o seu endereço será confirmada pelo WhatsApp.')).toBeInTheDocument();
    expect(within(co).getByLabelText(/Cidade/)).toHaveValue('Santa Cruz da Conceição');

    await user.click(within(co).getByRole('radio', { name: /Retirada no local/ }));
    expect(within(co).getByTestId('checkout-total')).toHaveTextContent('R$ 118,00');
    expect(within(co).getByTestId('checkout-summary')).not.toHaveTextContent('Entrega');
    expect(within(co).queryByLabelText(/Rua/)).not.toBeInTheDocument();

    // Troco válido na retirada (120 > 118) fica inválido ao trocar para entrega (120 < 123)
    await user.click(within(co).getByRole('radio', { name: 'Dinheiro' }));
    await user.click(within(co).getByRole('radio', { name: 'Sim, preciso de troco' }));
    const input = within(co).getByLabelText('Troco para quanto?');
    await user.type(input, '12000');
    await user.tab();
    expect(within(co).queryByText(/maior que o total do pedido/)).not.toBeInTheDocument();
    await user.click(within(co).getByRole('radio', { name: /^Entrega/ }));
    expect(within(co).getByText('O valor deve ser maior que o total do pedido (R$ 123,00).')).toBeInTheDocument();
  });

  it('entrega exige endereço e foca o primeiro campo inválido', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addPizza(user, 'Atum');
    const co = await openCheckout(user);
    await user.click(screen.getByRole('button', { name: 'Enviar pedido pelo WhatsApp' }));
    expect(within(co).getByLabelText(/Nome/)).toHaveFocus();
    await fillCustomer(user, co);
    await user.click(within(co).getByRole('radio', { name: /^Entrega/ }));
    await user.click(within(co).getByRole('radio', { name: 'Cartão de débito' }));
    await user.click(screen.getByRole('button', { name: 'Enviar pedido pelo WhatsApp' }));
    expect(within(co).getByLabelText(/Rua/)).toHaveFocus();
    expect(within(co).getByText('Informe a rua.')).toBeInTheDocument();
    await user.type(within(co).getByLabelText(/Rua/), 'Rua B');
    await user.type(within(co).getByLabelText(/Número/), '22');
    await user.type(within(co).getByLabelText(/Bairro/), 'Centro');
    await user.click(screen.getByRole('button', { name: 'Enviar pedido pelo WhatsApp' }));
    const msg = decodeURIComponent(String(openSpy.mock.calls[0]![0]).split('?text=')[1]!);
    expect(msg).toContain('*Entrega:* R$ 5,00');
    expect(msg).toContain('*TOTAL: R$ 75,00*');
    expect(msg).toContain('*Endereço:* Rua B, 22 — Centro, Santa Cruz da Conceição');
    expect(msg).toContain('*Pagamento:* Cartão de débito');
    // Dados pessoais nunca vão para o LocalStorage
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).not.toContain('Maria');
  });

  it('carrinho é recarregado do LocalStorage com preços recalculados', async () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ version: 1, items: [{ id: 'x1', mode: 'inteira', flavorIds: ['S11'], borderId: null, addonIds: [], note: '', quantity: 2, priceCents: 1 }] }),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Abrir carrinho, 2 itens' }));
    expect(within(dialog('Seu carrinho')).getByTestId('cart-subtotal')).toHaveTextContent('R$ 170,00');
  });
});

describe('acessibilidade básica', () => {
  it('botões de ícone têm nome acessível e campos têm label', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('button', { name: /Abrir carrinho/ })).toBeInTheDocument();
    await addPizza(user, 'Bacon');
    const co = await openCheckout(user);
    for (const button of within(co).getAllByRole('button')) expect(button).toHaveAccessibleName();
    for (const input of co.querySelectorAll('input, textarea, select')) expect(input).toHaveAccessibleName();
    expect(within(co).getByRole('radiogroup', { name: 'Forma de pagamento' })).toBeInTheDocument();
    expect(co).toHaveAttribute('aria-modal', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('o foco fica preso dentro do diálogo', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Abrir carrinho/ }));
    const cart = dialog('Seu carrinho');
    for (let i = 0; i < 5; i++) {
      await user.tab();
      expect(cart.contains(document.activeElement)).toBe(true);
    }
  });
});
