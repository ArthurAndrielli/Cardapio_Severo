import { useEffect, useRef } from 'react';

/*
 * Botão "voltar" (Android/navegador) fechando sobreposições.
 *
 * Enquanto houver ao menos uma sobreposição aberta, mantemos UMA entrada extra no histórico.
 * O "voltar" consome essa entrada (popstate) e fecha só a sobreposição do topo; se ainda restar
 * alguma aberta (ex.: seletor de sabor dentro do personalizador), a entrada é recriada.
 * Ao fechar pelo X/Esc, a entrada extra é removida com history.back() e o popstate resultante é ignorado.
 */
type Entry = { onBack: () => void };

const stack: Entry[] = [];
let hasEntry = false;
let ignorePop = false;
let listening = false;

function sync() {
  window.setTimeout(() => {
    if (stack.length > 0 && !hasEntry) {
      window.history.pushState({ severoOverlay: true }, '');
      hasEntry = true;
    } else if (stack.length === 0 && hasEntry) {
      hasEntry = false;
      ignorePop = true;
      window.history.back();
    }
  }, 0);
}

function onPopState() {
  if (ignorePop) {
    ignorePop = false;
    return;
  }
  if (!hasEntry) return;
  hasEntry = false;
  stack.pop()?.onBack();
  sync();
}

export function registerBack(onBack: () => void): () => void {
  if (!listening) {
    window.addEventListener('popstate', onPopState);
    listening = true;
  }
  const entry: Entry = { onBack };
  stack.push(entry);
  sync();
  return () => {
    const i = stack.indexOf(entry);
    if (i === -1) return; // já fechada pelo "voltar"
    stack.splice(i, 1);
    sync();
  };
}

/** Enquanto `active`, o botão "voltar" chama `onBack` em vez de sair da página. */
export function useBackClose(active: boolean, onBack: () => void) {
  const ref = useRef(onBack);
  ref.current = onBack;
  useEffect(() => {
    if (!active) return;
    return registerBack(() => ref.current());
  }, [active]);
}

/*
 * Trava de rolagem do fundo. `overflow: hidden` no body não basta no iOS Safari, então
 * fixamos o body na posição atual e restauramos a rolagem ao destravar. Contador para
 * sobreposições que se trocam no mesmo instante (carrinho → personalizador).
 */
let locks = 0;
let savedY = 0;

export function lockScroll(): () => void {
  if (locks === 0) {
    savedY = window.scrollY;
    const s = document.body.style;
    s.position = 'fixed';
    s.top = `-${savedY}px`;
    s.left = '0';
    s.right = '0';
    s.overflow = 'hidden';
  }
  locks++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks--;
    if (locks === 0) {
      const s = document.body.style;
      s.position = s.top = s.left = s.right = s.overflow = '';
      window.scrollTo({ top: savedY, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  };
}

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Rola suavemente (ou instantaneamente, com movimento reduzido) até o elemento. */
export function scrollToElement(el: Element, block: ScrollLogicalPosition = 'center') {
  el.scrollIntoView?.({ block, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
