import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { flavorOption, openFlavorPicker, pickFlavor } from './helpers';

function setup() {
  const user = userEvent.setup();
  render(<App />);
  return user;
}

const menuList = () => screen.getByRole('list', { name: /Sabores/ });

describe('busca no cardápio', () => {
  it('busca por nome sem acentos', async () => {
    const user = setup();
    await user.type(screen.getByLabelText('Buscar por nome ou ingrediente'), 'brocolis');
    const names = within(menuList()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(names).toEqual(expect.arrayContaining(['Brócolis', 'Brócolis com Bacon', 'Brócolis Especial', 'Moda da Casa']));
    expect(names).not.toContain('Calabresa');
  });

  it('busca por ingrediente, sem diferenciar maiúsculas e acentos', async () => {
    const user = setup();
    await user.type(screen.getByLabelText('Buscar por nome ou ingrediente'), 'MUCARELA, RUCULA');
    const names = within(menuList()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(names).toEqual(['Rúcula com Tomate Seco']);
    await user.clear(screen.getByLabelText('Buscar por nome ou ingrediente'));
    await user.type(screen.getByLabelText('Buscar por nome ou ingrediente'), 'xyz');
    expect(screen.getByText(/Nenhum sabor encontrado/)).toBeInTheDocument();
  });

  it('filtra doces e sugere outra categoria', async () => {
    const user = setup();
    await user.type(screen.getByLabelText('Buscar por nome ou ingrediente'), 'coco');
    await user.click(screen.getByRole('button', { name: /Ver 1 resultado em Doces/ }));
    expect(screen.getByRole('button', { name: 'Doces' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(menuList()).getByRole('heading', { name: 'Prestígio' })).toBeInTheDocument();
  });

  it('mostra 48 salgadas e 3 doces, sem tamanhos', async () => {
    const user = setup();
    expect(within(menuList()).getAllByRole('listitem')).toHaveLength(48);
    await user.click(screen.getByRole('button', { name: 'Doces' }));
    expect(within(menuList()).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByText(/pequena|média|grande/i)).not.toBeInTheDocument();
  });
});

describe('personalizador', () => {
  it('meio a meio cobra o sabor mais caro e soma adicional', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Montar pizza Calabresa' }));
    const dialog = screen.getByRole('dialog', { name: 'Monte sua pizza' });
    expect(within(dialog).getByTestId('builder-total')).toHaveTextContent('R$ 63,00');
    await user.click(within(dialog).getByRole('radio', { name: /Meio a meio/ }));
    await pickFlavor(user, dialog, '2ª metade', 'Atum');
    expect(within(dialog).getByTestId('builder-total')).toHaveTextContent('R$ 70,00');
    await user.click(within(dialog).getByRole('checkbox', { name: /Bacon/ }));
    expect(within(dialog).getByTestId('builder-total')).toHaveTextContent('R$ 77,00');
    await user.click(within(dialog).getByRole('button', { name: /Aumentar quantidade/ }));
    expect(within(dialog).getByTestId('builder-total')).toHaveTextContent('R$ 154,00');
  });

  it('não permite o mesmo sabor nas duas metades', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Montar pizza Calabresa' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: /Meio a meio/ }));
    await openFlavorPicker(user, dialog, '2ª metade');
    expect(within(dialog).getByRole('button', { name: /^Calabresa, R\$ 63,00, já escolhido na outra metade/ })).toBeDisabled();
    expect(flavorOption(dialog, 'Atum')).toBeEnabled();
    await user.keyboard('{Escape}');
    expect(within(dialog).getByRole('button', { name: 'Adicionar ao carrinho' })).toBeDisabled();
  });

  it('remove adicionais ao escolher sabor doce e avisa', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Montar pizza Calabresa' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('checkbox', { name: /Bacon/ }));
    await user.click(within(dialog).getByRole('checkbox', { name: /Borda recheada/ }));
    expect(within(dialog).getByTestId('builder-total')).toHaveTextContent('R$ 85,00');
    await user.click(within(dialog).getByRole('radio', { name: /Meio a meio/ }));
    await pickFlavor(user, dialog, '2ª metade', 'Chocolate');
    expect(within(dialog).getByText(/Removemos adicionais e borda/)).toBeInTheDocument();
    expect(within(dialog).getAllByText('Adicionais indisponíveis para pizzas doces no momento.').length).toBeGreaterThan(0);
    expect(within(dialog).getByRole('checkbox', { name: /Bacon/ })).toBeDisabled();
    expect(within(dialog).getByRole('checkbox', { name: /Bacon/ })).not.toBeChecked();
    expect(within(dialog).getByTestId('builder-total')).toHaveTextContent('R$ 63,00');
  });

  it('fecha com Esc', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Montar pizza Atum' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
