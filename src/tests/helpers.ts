import { within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Abre a lista de sabores de uma metade ("Sabor", "1ª metade", "2ª metade") no personalizador. */
export async function openFlavorPicker(user: UserEvent, dialog: HTMLElement, slot: string) {
  await user.click(within(dialog).getByRole('button', { name: new RegExp(`^${escapeRe(slot)}:`) }));
}

/** Escolhe um sabor pelo nome exato na lista com busca do personalizador. */
export async function pickFlavor(user: UserEvent, dialog: HTMLElement, slot: string, flavorName: string) {
  await openFlavorPicker(user, dialog, slot);
  await user.click(flavorOption(dialog, flavorName));
}

export function flavorOption(dialog: HTMLElement, flavorName: string) {
  return within(dialog).getByRole('button', { name: new RegExp(`^${escapeRe(flavorName)}, R\\$`) });
}
