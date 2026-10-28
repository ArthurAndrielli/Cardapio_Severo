import { ShoppingBag } from 'lucide-react';
import { formatBRL } from '../lib/money';
import type { Cents } from '../models';

interface Props {
  itemCount: number;
  subtotal: Cents;
  onOpen: () => void;
}

/** Barra fixa no rodapé (celular e tablet) com atalho para o carrinho. */
export function CartBar({ itemCount, subtotal, onOpen }: Props) {
  const label = `Ver carrinho · ${itemCount} ${itemCount === 1 ? 'item' : 'itens'} · ${formatBRL(subtotal)}`;
  return (
    <div className="safe-x pb-safe fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-carvao-950 via-carvao-950/95 to-transparent pt-4 motion-safe:animate-fade-in lg:hidden [@media(max-height:500px)]:pt-2">
      <button
        type="button"
        onClick={onOpen}
        aria-label={label}
        data-testid="cart-bar"
        className="mx-auto flex min-h-14 w-full max-w-xl [@media(max-height:500px)]:min-h-12 items-center justify-between gap-3 rounded-full bg-severo-yellow px-5 font-extrabold text-carvao-950 shadow-[0_8px_30px_rgba(0,0,0,.6)]"
      >
        <span className="flex items-center gap-2 uppercase tracking-wide">
          <ShoppingBag aria-hidden="true" className="h-5 w-5" />
          Ver carrinho
        </span>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="grid h-7 min-w-7 place-items-center rounded-full bg-carvao-950 px-2 text-sm text-severo-yellow">{itemCount}</span>
          <span className="text-lg">{formatBRL(subtotal)}</span>
        </span>
      </button>
    </div>
  );
}
