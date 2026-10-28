import { addonsById, bordersById } from '../data/addons';
import type { PizzaConfig } from '../models';
import { getFlavor } from './pricing';

/** Título curto de um item para a interface: "Pizza Calabresa" ou "Pizza Meio a Meio". */
export function itemTitle(cfg: PizzaConfig): string {
  return cfg.mode === 'meio' ? 'Pizza Meio a Meio' : `Pizza ${getFlavor(cfg.flavorIds[0] ?? '')?.name ?? ''}`;
}

/** Linhas de detalhe exibidas no carrinho e no resumo. */
export function itemDetails(cfg: PizzaConfig): string[] {
  const lines: string[] = [];
  if (cfg.mode === 'meio') cfg.flavorIds.forEach((id) => lines.push(`½ ${getFlavor(id)?.name ?? id}`));
  const border = cfg.borderId ? bordersById.get(cfg.borderId) : undefined;
  if (border) lines.push(`Borda: ${border.shortName}`);
  if (cfg.addonIds.length) lines.push(`Adicionais: ${cfg.addonIds.map((id) => addonsById.get(id)?.name ?? id).join(', ')}`);
  if (cfg.note.trim()) lines.push(`Obs.: ${cfg.note.trim()}`);
  return lines;
}

export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}
