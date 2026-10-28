import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import { flavorOption, openFlavorPicker, pickFlavor } from './helpers';

function setup() {
  const user = userEvent.setup();
  render(<App />);
  return user;
}

async function addCalabresa(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: 'Montar pizza Calabresa' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Adicionar ao carrinho' }));
}

/** Espera a entrada extra no histórico ser criada e simula o botão "voltar". */
async function pressBack() {
  await act(() => new Promise((r) => setTimeout(r, 5)));
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await act(() => new Promise((r) => setTimeout(r, 5)));
}

describe('menu do celular', () => {
  it('abre pelo botão hambúrguer e fecha ao tocar num link', async () => {
    const user = setup();
    const toggle = screen.getByRole('button', { name: 'Abrir menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true');
    const menu = screen.getByRole('navigation', { name: 'Menu' });
    await user.click(within(menu).getByRole('link', { name: 'Cardápio' }));
    expect(screen.queryByRole('navigation', { name: 'Menu' })).not.toBeInTheDocument();
  });

  it('fecha com Esc e devolve o foco ao botão', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(screen.getByRole('navigation', { name: 'Menu' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('navigation', { name: 'Menu' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveFocus();
  });
});

describe('barra fixa do carrinho', () => {
  it('só aparece com itens e mostra quantidade e subtotal', async () => {
    const user = setup();
    expect(screen.queryByTestId('cart-bar')).not.toBeInTheDocument();
    await addCalabresa(user);
    expect(screen.getByRole('button', { name: 'Ver carrinho · 1 item · R$ 63,00' })).toBeInTheDocument();
    await addCalabresa(user);
    expect(screen.getByRole('button', { name: 'Ver carrinho · 2 itens · R$ 126,00' })).toBeInTheDocument();
  });

  it('some com personalizador, carrinho ou checkout abertos e abre o carrinho', async () => {
    const user = setup();
    await addCalabresa(user);
    await user.click(screen.getByRole('button', { name: 'Montar pizza Atum' }));
    expect(screen.queryByTestId('cart-bar')).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(screen.getByTestId('cart-bar'));
    expect(screen.getByRole('dialog', { name: 'Seu carrinho' })).toBeInTheDocument();
    expect(screen.queryByTestId('cart-bar')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }));
    expect(screen.getByRole('dialog', { name: 'Finalizar pedido' })).toBeInTheDocument();
    expect(screen.queryByTestId('cart-bar')).not.toBeInTheDocument();
  });

  it('mostra um aviso visível ao adicionar', async () => {
    const user = setup();
    await addCalabresa(user);
    expect(screen.getByText('Pizza adicionada ao carrinho.')).toBeVisible();
  });
});

describe('botão voltar do celular', () => {
  it('fecha o personalizador em vez de sair do site', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Montar pizza Calabresa' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await pressBack();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('fecha primeiro a lista de sabores e depois o personalizador', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Montar pizza Calabresa' }));
    const dialog = screen.getByRole('dialog');
    await openFlavorPicker(user, dialog, 'Sabor');
    expect(screen.getByRole('dialog', { name: 'Escolha: Sabor' })).toBeInTheDocument();
    await pressBack();
    expect(screen.getByRole('dialog', { name: 'Monte sua pizza' })).toBeInTheDocument();
    await pressBack();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('fecha a gaveta do carrinho', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /Abrir carrinho/ }));
    await pressBack();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cria uma entrada no histórico ao abrir e a remove ao fechar pelo X', async () => {
    const push = vi.spyOn(window.history, 'pushState');
    const back = vi.spyOn(window.history, 'back');
    const user = setup();
    await user.click(screen.getByRole('button', { name: /Abrir carrinho/ }));
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(back).toHaveBeenCalledTimes(1));
    push.mockRestore();
    back.mockRestore();
  });
});

describe('rolagem do fundo', () => {
  it('trava enquanto um diálogo está aberto e restaura ao fechar', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /Abrir carrinho/ }));
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(document.body.style.position).toBe('');
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('continua travada ao trocar do carrinho para o personalizador (editar)', async () => {
    const user = setup();
    await addCalabresa(user);
    await user.click(screen.getByRole('button', { name: /Abrir carrinho/ }));
    await user.click(screen.getByRole('button', { name: 'Editar Pizza Calabresa' }));
    expect(screen.getByRole('dialog', { name: 'Editar pizza' })).toBeInTheDocument();
    expect(document.body.style.position).toBe('fixed');
  });
});

describe('lista de sabores com busca', () => {
  it('filtra por nome ou ingrediente sem acentos e escolhe com um toque', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Montar pizza Calabresa' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: /Meio a meio/ }));
    await openFlavorPicker(user, dialog, '2ª metade');
    const search = within(dialog).getByRole('searchbox', { name: /Buscar sabor/ });
    expect(search).toHaveAttribute('enterkeyhint', 'search');
    await user.type(search, 'coco');
    const buttons = within(dialog)
      .getAllByRole('button')
      .filter((b) => /, R\$/.test(b.getAttribute('aria-label') ?? ''));
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['Prestígio, R$ 55,00']);
    await user.click(flavorOption(dialog, 'Prestígio'));
    expect(within(dialog).getByRole('button', { name: /^2ª metade: Prestígio/ })).toHaveFocus();
    expect(within(dialog).getByTestId('builder-total')).toHaveTextContent('R$ 63,00');
  });

  it('Esc fecha só a lista, mantendo o personalizador', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Montar pizza Calabresa' }));
    const dialog = screen.getByRole('dialog');
    await openFlavorPicker(user, dialog, 'Sabor');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Monte sua pizza' })).toBeInTheDocument();
    await pickFlavor(user, dialog, 'Sabor', 'Atum');
    expect(within(dialog).getByTestId('builder-total')).toHaveTextContent('R$ 70,00');
  });
});

describe('teclado e preenchimento automático', () => {
  it('usa os tipos e atributos corretos nos campos', async () => {
    const user = setup();
    const search = screen.getByLabelText('Buscar por nome ou ingrediente');
    expect(search).toHaveAttribute('type', 'search');
    expect(search).toHaveAttribute('enterkeyhint', 'search');

    await addCalabresa(user);
    await user.click(screen.getByRole('button', { name: /Abrir carrinho/ }));
    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }));
    const co = screen.getByRole('dialog', { name: 'Finalizar pedido' });

    expect(within(co).getByLabelText(/Nome/)).toHaveAttribute('autocomplete', 'name');
    const phone = within(co).getByLabelText(/Telefone/);
    expect(phone).toHaveAttribute('type', 'tel');
    expect(phone).toHaveAttribute('inputmode', 'tel');
    expect(phone).toHaveAttribute('autocomplete', 'tel');

    await user.click(within(co).getByRole('radio', { name: /^Entrega/ }));
    expect(within(co).getByLabelText(/Rua/)).toHaveAttribute('autocomplete', 'address-line1');
    expect(within(co).getByLabelText(/Número/)).toHaveAttribute('inputmode', 'numeric');
    expect(within(co).getByLabelText(/Bairro/)).toHaveAttribute('autocomplete', 'address-level3');
    expect(within(co).getByLabelText(/Cidade/)).toHaveAttribute('autocomplete', 'address-level2');

    await user.click(within(co).getByRole('radio', { name: 'Dinheiro' }));
    await user.click(within(co).getByRole('radio', { name: 'Sim, preciso de troco' }));
    expect(within(co).getByLabelText('Troco para quanto?')).toHaveAttribute('inputmode', 'decimal');
  });

  it('ao dar erro, rola até o primeiro campo inválido', async () => {
    const user = setup();
    await addCalabresa(user);
    await user.click(screen.getByRole('button', { name: /Abrir carrinho/ }));
    await user.click(screen.getByRole('button', { name: 'Finalizar pedido' }));
    const co = screen.getByRole('dialog', { name: 'Finalizar pedido' });
    vi.mocked(Element.prototype.scrollIntoView).mockClear();
    await user.type(within(co).getByLabelText(/Nome/), 'Ana');
    await user.click(screen.getByRole('button', { name: 'Enviar pedido pelo WhatsApp' }));
    expect(within(co).getByLabelText(/Telefone/)).toHaveFocus();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});

describe('página', () => {
  const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf-8');

  it('tem theme-color escuro, viewport com áreas seguras e fontes com swap', () => {
    expect(html).toMatch(/<meta name="theme-color" content="#0b0b0c"/);
    expect(html).toMatch(/viewport-fit=cover/);
    expect(html).toMatch(/display=swap/);
  });

  it('a imagem do topo tem dimensões definidas e carrega com prioridade', () => {
    setup();
    const hero = screen.getByRole('img', { name: /Pizza com muçarela/ });
    expect(hero).toHaveAttribute('width', '400');
    expect(hero).toHaveAttribute('height', '400');
    expect(hero).toHaveAttribute('loading', 'eager');
  });
});
