import { describe, expect, it } from 'vitest';
import { addons, borders } from '../data/addons';
import { flavors, flavorsById, savoryFlavors, sweetFlavors } from '../data/menu';

describe('cardápio', () => {
  it('tem 48 salgadas, sem o código 39', () => {
    expect(savoryFlavors).toHaveLength(48);
    expect(savoryFlavors.find((f) => f.code === '39')).toBeUndefined();
    expect(flavorsById.has('S39')).toBe(false);
    expect(savoryFlavors[0]?.id).toBe('S01');
    expect(savoryFlavors.at(-1)?.id).toBe('S49');
  });

  it('tem 3 doces', () => {
    expect(sweetFlavors.map((f) => f.id)).toEqual(['D01', 'D02', 'D03']);
    expect(sweetFlavors.every((f) => f.priceCents === 5500 && f.category === 'doce')).toBe(true);
  });

  it('tem 14 adicionais e 1 borda', () => {
    expect(addons).toHaveLength(14);
    expect(borders).toHaveLength(1);
    expect(borders[0]?.priceCents).toBe(1500);
  });

  it('IDs são únicos', () => {
    const ids = [...flavors.map((f) => f.id), ...addons.map((a) => a.id), ...borders.map((b) => b.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todos os preços são inteiros em centavos', () => {
    for (const p of [...flavors, ...addons, ...borders]) {
      expect(Number.isInteger(p.priceCents)).toBe(true);
      expect(p.priceCents).toBeGreaterThan(0);
    }
  });

  it('preços exatos de sabores', () => {
    const expected: Record<string, number> = {
      S01: 6400, S02: 7000, S03: 7200, S04: 6400, S05: 6600, S06: 6400, S07: 6700, S08: 6300, S09: 6500,
      S10: 6200, S11: 8500, S12: 8500, S13: 6400, S14: 6700, S15: 6700, S16: 6800, S17: 6400, S18: 6400,
      S19: 6200, S20: 7000, S21: 6100, S22: 6700, S23: 6900, S24: 7000, S25: 6800, S26: 6700, S27: 7000,
      S28: 7000, S29: 7000, S30: 6700, S31: 6000, S32: 7000, S33: 6700, S34: 7000, S35: 6000, S36: 7000,
      S37: 7000, S38: 6700, S40: 6700, S41: 6000, S42: 7000, S43: 7000, S44: 6600, S45: 6600, S46: 6800,
      S47: 7200, S48: 7100, S49: 7500, D01: 5500, D02: 5500, D03: 5500,
    };
    expect(Object.keys(expected)).toHaveLength(51);
    for (const [id, price] of Object.entries(expected)) expect(flavorsById.get(id)?.priceCents, id).toBe(price);
  });

  it('preços exatos de adicionais', () => {
    expect(Object.fromEntries(addons.map((a) => [a.name, a.priceCents]))).toEqual({
      Mussarela: 600, Bacon: 700, Ovo: 200, Catupiry: 600, Palmito: 600, Milho: 200, Champignon: 600,
      Brócolis: 300, Frango: 600, Calabresa: 500, Provolone: 500, Parmesão: 500, Gorgonzola: 600, Atum: 1000,
    });
  });

  it('textos preservados exatamente', () => {
    expect(flavorsById.get('S20')?.ingredients).toBe('Palmito, bacon, brócolis, alho frito, muçarela e catupiry.');
    expect(flavorsById.get('S17')?.ingredients).toBe('Molho, muçarela, lombo e canadense.');
    expect(flavorsById.get('S21')?.name).toBe('Mussarela');
  });
});
