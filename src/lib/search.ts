import type { Flavor, FlavorCategory } from '../models';

/** Minúsculas e sem acentos: "Brócolis" → "brocolis". */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Filtra por categoria (opcional) e por nome ou ingrediente, ignorando acentos e maiúsculas. */
export function filterFlavors(list: Flavor[], query: string, category?: FlavorCategory | null): Flavor[] {
  const q = normalizeText(query);
  return list.filter((f) => {
    if (category && f.category !== category) return false;
    if (!q) return true;
    return normalizeText(f.name).includes(q) || normalizeText(f.ingredients).includes(q) || f.code === q;
  });
}
