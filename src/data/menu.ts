import type { Flavor, FlavorCategory } from '../models';

// Nomes, preços e ingredientes copiados EXATAMENTE do cardápio oficial (sem padronizar).
// Não existe o código 39.
type Row = [code: string, name: string, priceCents: number, ingredients: string];

const savoryRows: Row[] = [
  ['01', 'Americana', 6400, 'Molho, muçarela, presunto, tomate e azeitona.'],
  ['02', 'Atum', 7000, 'Molho, muçarela, atum e cebola.'],
  ['03', 'Atum Especial', 7200, 'Molho, muçarela, catupiry, atum e cebola.'],
  ['04', 'Bacon', 6400, 'Molho, muçarela e bacon.'],
  ['05', 'Bacon Especial', 6600, 'Molho, muçarela, bacon e catupiry.'],
  ['06', 'Brócolis', 6400, 'Molho, brócolis refogado e muçarela.'],
  ['07', 'Brócolis com Bacon', 6700, 'Molho, brócolis, bacon e muçarela.'],
  ['08', 'Calabresa', 6300, 'Molho, muçarela, calabresa e cebola.'],
  ['09', 'Calabresa com Catupiry', 6500, 'Molho, muçarela, calabresa, catupiry e cebola.'],
  ['10', 'Catupiry', 6200, 'Molho, muçarela e catupiry.'],
  ['11', 'Filé Mignon ao Catupiry', 8500, 'Molho, filé mignon e catupiry.'],
  ['12', 'Filé Mignon ao Cheddar', 8500, 'Molho, filé mignon e cheddar.'],
  ['13', 'Francesa', 6400, 'Molho, bacon, champignon e muçarela.'],
  ['14', 'Frango com Catupiry', 6700, 'Molho, muçarela, frango e catupiry.'],
  ['15', 'Frango com Cheddar', 6700, 'Molho, muçarela, frango e cheddar.'],
  ['16', 'Italiana', 6800, 'Molho, muçarela, palmito e tomate seco.'],
  // PENDENTE: descrição do Lombinho a conferir (docs/pendencias.md).
  ['17', 'Lombinho', 6400, 'Molho, muçarela, lombo e canadense.'],
  ['18', 'Marguerita', 6400, 'Molho, muçarela, tomate e manjericão.'],
  ['19', 'Milho Verde', 6200, 'Molho, muçarela e milho verde.'],
  ['20', 'Moda da Casa', 7000, 'Palmito, bacon, brócolis, alho frito, muçarela e catupiry.'],
  ['21', 'Mussarela', 6100, 'Molho, muçarela e tomate.'],
  ['22', 'Palmito', 6700, 'Molho, muçarela e palmito.'],
  ['23', 'Palmito com Catupiry', 6900, 'Molho, muçarela, palmito e catupiry.'],
  ['24', 'Portuguesa', 7000, 'Molho, muçarela, presunto, ovos, calabresa, cebola, milho e ervilha.'],
  ['25', 'Quatro Queijos', 6800, 'Molho, muçarela, provolone, catupiry e parmesão.'],
  ['26', 'Rúcula com Tomate Seco', 6700, 'Molho, muçarela, rúcula e tomate seco.'],
  ['27', 'Siciliana', 7000, 'Molho, muçarela, bacon, milho verde e champignon.'],
  ['28', 'Toscana', 7000, 'Molho, calabresa, palmito, muçarela, alho frito, manjericão e catupiry.'],
  ['29', 'Cinco Queijos', 7000, 'Molho, muçarela, provolone, parmesão, catupiry e gorgonzola.'],
  ['30', 'Salame', 6700, 'Molho, muçarela e salame tipo italiano.'],
  ['31', 'Vegetariana', 6000, 'Molho, muçarela, palmito, champignon, ervilha, milho e tomate.'],
  ['32', 'Palmito com Bacon', 7000, 'Molho, palmito, muçarela e bacon.'],
  ['33', 'Brasileira', 6700, 'Molho, muçarela, milho, ervilha e palmito.'],
  ['34', 'Camponesa', 7000, 'Molho, muçarela, bacon, tomate, milho e ovo.'],
  ['35', 'Frango Caipira', 6000, 'Molho, muçarela, frango, milho e batata palha.'],
  ['36', 'Frango com Calabresa', 7000, 'Molho, frango, catupiry, calabresa e muçarela.'],
  ['37', 'Pizzaiolo', 7000, 'Molho, muçarela, presunto, ovo, palmito, bacon e catupiry.'],
  ['38', 'Hot Dog', 6700, 'Molho, salsicha picada, ketchup, mostarda, milho, ervilha, muçarela e batata palha.'],
  ['40', 'Napolitana', 6700, 'Molho, muçarela, tomate e parmesão.'],
  ['41', 'Paulista', 6000, 'Muçarela, presunto, palmito, bacon e tomate.'],
  ['42', 'Brócolis Especial', 7000, 'Brócolis, palmito, champignon, tomate e parmesão.'],
  ['43', 'Calabresa Especial', 7000, 'Muçarela, calabresa, bacon, milho e catupiry.'],
  ['44', 'Bacon com Ovo', 6600, 'Muçarela, bacon e ovos.'],
  ['45', 'Japonesa', 6600, 'Muçarela, peito de peru e champignon.'],
  ['46', 'Romanesca', 6800, 'Presunto, muçarela e champignon.'],
  ['47', 'Universitária', 7200, 'Muçarela, presunto, frango, palmito, milho, ovos e cebola.'],
  ['48', 'Supreme', 7100, 'Muçarela, frango, lombo e catupiry.'],
  ['49', 'Atum com Palmito', 7500, 'Muçarela, atum, cebola, catupiry, alho frito, manjericão e palmito.'],
];

const sweetRows: Row[] = [
  ['01', 'Chocolate', 5500, 'Chocolate.'],
  ['02', 'Chocolate com Banana', 5500, 'Chocolate e banana.'],
  ['03', 'Prestígio', 5500, 'Chocolate e coco.'],
];

function toFlavors(rows: Row[], category: FlavorCategory, prefix: string): Flavor[] {
  return rows.map(([code, name, priceCents, ingredients]) => ({
    id: `${prefix}${code}`,
    code,
    name,
    category,
    priceCents,
    ingredients,
  }));
}

export const savoryFlavors = toFlavors(savoryRows, 'salgada', 'S');
export const sweetFlavors = toFlavors(sweetRows, 'doce', 'D');

export const flavors: Flavor[] = [...savoryFlavors, ...sweetFlavors];
export const flavorsById = new Map(flavors.map((f) => [f.id, f]));

/** Categorias exibidas como filtros. Para nova categoria, adicione aqui e em FlavorCategory. */
export const menuCategories: { id: FlavorCategory; label: string }[] = [
  { id: 'salgada', label: 'Salgadas' },
  { id: 'doce', label: 'Doces' },
];
