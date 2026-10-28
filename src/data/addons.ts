import type { Addon, Border } from '../models';

/** Borda — seção própria no personalizador, separada dos adicionais. */
export const borders: Border[] = [
  { id: 'borda-catupiry', name: 'Borda recheada com catupiry', shortName: 'Catupiry', priceCents: 1500 },
];

/** Adicionais: cada um no máximo uma vez por pizza, valendo para a pizza inteira. */
export const addons: Addon[] = [
  { id: 'add-mussarela', name: 'Mussarela', priceCents: 600 },
  { id: 'add-bacon', name: 'Bacon', priceCents: 700 },
  { id: 'add-ovo', name: 'Ovo', priceCents: 200 },
  { id: 'add-catupiry', name: 'Catupiry', priceCents: 600 },
  { id: 'add-palmito', name: 'Palmito', priceCents: 600 },
  { id: 'add-milho', name: 'Milho', priceCents: 200 },
  { id: 'add-champignon', name: 'Champignon', priceCents: 600 },
  { id: 'add-brocolis', name: 'Brócolis', priceCents: 300 },
  { id: 'add-frango', name: 'Frango', priceCents: 600 },
  { id: 'add-calabresa', name: 'Calabresa', priceCents: 500 },
  { id: 'add-provolone', name: 'Provolone', priceCents: 500 },
  { id: 'add-parmesao', name: 'Parmesão', priceCents: 500 },
  { id: 'add-gorgonzola', name: 'Gorgonzola', priceCents: 600 },
  { id: 'add-atum', name: 'Atum', priceCents: 1000 },
];

export const addonsById = new Map(addons.map((a) => [a.id, a]));
export const bordersById = new Map(borders.map((b) => [b.id, b]));
