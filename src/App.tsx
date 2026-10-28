import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CartBar } from './components/CartBar';
import { business } from './config/business';
import type { CartItem, CheckoutData, Flavor, PizzaConfig } from './models';
import { CartProvider, useCart } from './store/CartContext';
import { CartDrawer } from './sections/CartDrawer';
import { Checkout } from './sections/Checkout';
import { Footer } from './sections/Footer';
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import { Menu } from './sections/Menu';
import { PizzaBuilder, type BuilderInitial } from './sections/PizzaBuilder';

/** Dados do cliente ficam só em memória (nunca no LocalStorage). */
const emptyCheckout = (): CheckoutData => ({
  name: '',
  phone: '',
  deliveryMode: null,
  address: { street: '', number: '', neighborhood: '', city: business.defaultCity, reference: '' },
  notes: '',
  paymentMethod: null,
  needsChange: null,
  changeForCents: null,
});

interface BuilderState {
  key: number;
  initial: BuilderInitial;
  /** Reabrir o carrinho ao fechar (edição iniciada pelo carrinho). */
  returnToCart: boolean;
}

function Shell() {
  const { addItem, replaceItem, itemCount, subtotal } = useCart();
  const [builder, setBuilder] = useState<BuilderState | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutData>(emptyCheckout);
  const [status, setStatus] = useState<{ text: string; id: number } | null>(null);

  // O aviso some sozinho; o leitor de tela já o anunciou pela região viva.
  useEffect(() => {
    if (!status) return;
    const t = window.setTimeout(() => setStatus(null), 2600);
    return () => window.clearTimeout(t);
  }, [status]);

  const overlayOpen = cartOpen || checkoutOpen || builder !== null;
  const showCartBar = itemCount > 0 && !overlayOpen;

  function openBuilder(flavor: Flavor) {
    setBuilder({
      key: Date.now(),
      initial: { config: { mode: 'inteira', flavorIds: [flavor.id], borderId: null, addonIds: [], note: '' }, quantity: 1 },
      returnToCart: false,
    });
  }

  function editItem(item: CartItem) {
    setCartOpen(false);
    const { id, quantity, ...config } = item;
    setBuilder({ key: Date.now(), initial: { config, quantity, editingId: id }, returnToCart: true });
  }

  function closeBuilder() {
    if (builder?.returnToCart) setCartOpen(true);
    setBuilder(null);
  }

  function submitBuilder(config: PizzaConfig, quantity: number, editingId?: string) {
    if (editingId) replaceItem(editingId, config, quantity);
    else addItem(config, quantity);
    setStatus({ text: editingId ? 'Pizza atualizada no carrinho.' : 'Pizza adicionada ao carrinho.', id: Date.now() });
    closeBuilder();
  }

  return (
    <>
      <a
        href="#cardapio"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-severo-yellow focus:px-4 focus:py-2 focus:font-bold focus:text-carvao-950"
      >
        Pular para o cardápio
      </a>
      <Header onOpenCart={() => setCartOpen(true)} />
      <main>
        <Hero />
        <Menu onBuild={openBuilder} />
      </main>
      <Footer reserveBottom={itemCount > 0} />

      {builder && <PizzaBuilder key={builder.key} open initial={builder.initial} onClose={closeBuilder} onSubmit={submitBuilder} />}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onEdit={editItem}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />
      {checkoutOpen && <Checkout open onClose={() => setCheckoutOpen(false)} data={checkout} onChange={setCheckout} />}

      {showCartBar && <CartBar itemCount={itemCount} subtotal={subtotal} onOpen={() => setCartOpen(true)} />}

      {/* Aviso posicionado acima da barra do carrinho, sem cobrir botões principais. */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 lg:bottom-6 ${
          showCartBar ? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))]' : 'bottom-[calc(1rem+env(safe-area-inset-bottom))]'
        }`}
      >
        {status && (
          <p
            key={status.id}
            className="flex items-center gap-2 rounded-full border border-carvao-600 bg-carvao-800 px-4 py-2.5 text-base font-semibold shadow-xl motion-safe:animate-pop-in"
          >
            <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-severo-yellow" />
            {status.text}
          </p>
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Shell />
    </CartProvider>
  );
}
