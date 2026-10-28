import { Pencil, ShoppingBag, Trash2, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Dialog } from '../components/Dialog';
import { QuantityStepper } from '../components/QuantityStepper';
import { itemDetails, itemTitle } from '../lib/describe';
import { formatBRL } from '../lib/money';
import { calculateItemSubtotal, calculateUnitPrice } from '../lib/pricing';
import type { CartItem } from '../models';
import { useCart } from '../store/CartContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onEdit: (item: CartItem) => void;
  onCheckout: () => void;
}

export function CartDrawer({ open, onClose, onEdit, onCheckout }: Props) {
  const { items, subtotal, setQuantity, removeItem, restoreItem } = useCart();
  const [removed, setRemoved] = useState<{ item: CartItem; index: number } | null>(null);
  const undoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!removed) return;
    const t = window.setTimeout(() => setRemoved(null), 8000);
    return () => window.clearTimeout(t);
  }, [removed]);

  useEffect(() => {
    if (!open) setRemoved(null);
  }, [open]);

  function remove(id: string) {
    setRemoved(removeItem(id));
    // O botão clicado deixa de existir; o foco vai para "Desfazer" para não se perder.
    window.requestAnimationFrame(() => undoRef.current?.focus());
  }

  function undo() {
    if (!removed) return;
    restoreItem(removed.item, removed.index);
    setRemoved(null);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Seu carrinho"
      variant="drawer"
      footer={
        items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-zinc-300">Subtotal</span>
              <span className="font-display text-3xl tracking-wide text-severo-yellow" data-testid="cart-subtotal">
                {formatBRL(subtotal)}
              </span>
            </div>
            <p className="text-sm text-zinc-400">Taxa de entrega, se houver, é calculada no próximo passo.</p>
            <button type="button" className="btn-primary w-full" onClick={onCheckout}>
              Finalizar pedido
            </button>
          </div>
        )
      }
    >
      <div role="status" aria-live="polite">
        {removed && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-carvao-600 bg-carvao-800 py-1 pl-4 pr-1 text-base">
            <span>{itemTitle(removed.item)} removida.</span>
            <button ref={undoRef} type="button" onClick={undo} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 font-bold text-severo-yellow hover:underline">
              <Undo2 aria-hidden="true" className="h-4 w-4" /> Desfazer
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center text-zinc-400">
          <ShoppingBag aria-hidden="true" className="h-12 w-12 text-carvao-600" />
          <p>Seu carrinho está vazio.</p>
          <a href="#cardapio" onClick={onClose} className="btn-ghost">
            Ver cardápio
          </a>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Itens do carrinho">
          {items.map((item) => {
            const title = itemTitle(item);
            return (
              <li key={item.id} className="rounded-2xl border border-carvao-700 bg-carvao-800/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold leading-tight">{title}</h3>
                    <ul className="mt-1 space-y-0.5 text-base text-zinc-400">
                      {itemDetails(item).map((line) => (
                        <li key={line} className="break-words">
                          {line}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-base text-zinc-400">{formatBRL(calculateUnitPrice(item))} cada</p>
                  </div>
                  <p className="whitespace-nowrap text-lg font-bold text-severo-yellow">{formatBRL(calculateItemSubtotal(item))}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-3">
                  <QuantityStepper value={item.quantity} onChange={(q) => setQuantity(item.id, q)} label={title} size="sm" />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      aria-label={`Editar ${title}`}
                      className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 font-semibold text-zinc-200 hover:bg-carvao-700"
                    >
                      <Pencil aria-hidden="true" className="h-4 w-4" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`Remover ${title}`}
                      className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 font-semibold text-red-300 hover:bg-severo-red/15"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" /> Remover
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
