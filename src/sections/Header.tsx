import { Menu as MenuIcon, ShoppingBag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { images } from '../config/images';
import { assetUrl } from '../lib/describe';
import { useCart } from '../store/CartContext';

const links = [
  { href: '#inicio', label: 'Início' },
  { href: '#cardapio', label: 'Cardápio' },
  { href: '#contato', label: 'Contato' },
];

export function Header({ onOpenCart }: { onOpenCart: () => void }) {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Menu do celular: fecha com Esc (devolvendo o foco ao botão) e ao tocar fora.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [menuOpen]);

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-40 border-b border-carvao-700/80 bg-carvao-950/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="safe-x mx-auto flex h-16 max-w-6xl items-center justify-between gap-2">
        <a href="#inicio" className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg" aria-label="Severo Pizzas Delivery — início">
          <img src={assetUrl(images.logo)} alt="" className="h-10 w-10" width={40} height={40} />
          <span className="font-display text-2xl leading-none tracking-wide">
            SEVERO <span className="text-severo-yellow">PIZZAS</span>
          </span>
        </a>

        <nav aria-label="Navegação principal" className="hidden sm:block">
          <ul className="flex items-center gap-2 text-sm font-semibold">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="inline-flex min-h-11 items-center rounded-md px-3 text-zinc-300 transition hover:text-severo-yellow">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="menu-celular"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            className="grid h-11 w-11 place-items-center rounded-full text-zinc-200 transition hover:bg-carvao-800 sm:hidden"
          >
            {menuOpen ? <X aria-hidden="true" className="h-6 w-6" /> : <MenuIcon aria-hidden="true" className="h-6 w-6" />}
          </button>
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Abrir carrinho, ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
            className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-severo-yellow text-carvao-950 transition hover:bg-severo-yellow-dark"
          >
            <ShoppingBag aria-hidden="true" className="h-5 w-5" />
            {itemCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-severo-red px-1 text-xs font-bold text-white ring-2 ring-carvao-950"
              >
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="menu-celular" aria-label="Menu" className="safe-x border-t border-carvao-700 bg-carvao-950 pb-3 motion-safe:animate-fade-in sm:hidden">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-12 items-center border-b border-carvao-800 text-lg font-semibold text-zinc-100 active:text-severo-yellow"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
