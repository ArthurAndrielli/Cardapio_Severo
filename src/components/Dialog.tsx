import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { lockScroll, scrollToElement, useBackClose } from '../lib/overlay';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** 'modal' = centralizado (tela cheia no celular); 'drawer' = gaveta lateral direita (largura total no celular). */
  variant?: 'modal' | 'drawer';
  children: ReactNode;
  footer?: ReactNode;
  /** Seletor do elemento que recebe foco ao abrir (padrão: primeiro focável). */
  initialFocus?: string;
}

/**
 * Altura e deslocamento da área realmente visível. Quando o teclado do celular abre, a viewport
 * visual encolhe; ajustar o diálogo a ela mantém o campo e o rodapé (botão de enviar) visíveis.
 */
function useVisualViewport(active: boolean) {
  const [box, setBox] = useState<{ height: number; top: number } | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => setBox({ height: vv.height, top: vv.offsetTop });
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [active]);
  return box;
}

const isTouch = () => typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

/**
 * Diálogo acessível: foco preso, Esc e botão "voltar" fecham, foco devolvido ao fechar
 * e rolagem do fundo travada.
 */
export function Dialog({ open, onClose, title, variant = 'modal', children, footer, initialFocus }: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const viewport = useVisualViewport(open);

  useBackClose(open, () => onCloseRef.current());

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const target =
      (initialFocus && panel?.querySelector<HTMLElement>(initialFocus)) ||
      panel?.querySelector<HTMLElement>('[data-autofocus]') ||
      panel;
    target?.focus({ preventScroll: true });
    const unlock = lockScroll();
    return () => {
      unlock();
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (n) => !n.hasAttribute('disabled') && n.getAttribute('aria-hidden') !== 'true',
    );
    if (nodes.length === 0) {
      e.preventDefault();
      return;
    }
    const first = nodes[0]!;
    const last = nodes[nodes.length - 1]!;
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /** No celular, mantém o campo em edição centralizado depois que o teclado termina de abrir. */
  function onFocusIn(e: React.FocusEvent) {
    const el = e.target as HTMLElement;
    if (!isTouch() || !el.matches('input:not([type=radio]):not([type=checkbox]), textarea, select')) return;
    window.setTimeout(() => {
      if (document.activeElement === el) scrollToElement(el);
    }, 350);
  }

  const isDrawer = variant === 'drawer';

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-screen supports-[height:100dvh]:h-[100dvh]"
      style={viewport ? { height: viewport.height, top: viewport.top } : undefined}
      onKeyDown={onKeyDown}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm motion-safe:animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onFocus={onFocusIn}
        className={
          isDrawer
            ? 'absolute inset-y-0 right-0 flex w-full flex-col bg-carvao-900 shadow-2xl outline-none motion-safe:animate-slide-in-right sm:max-w-md sm:border-l sm:border-carvao-700'
            : 'dialog-modal absolute inset-0 flex flex-col bg-carvao-900 outline-none motion-safe:animate-pop-in sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[92%] sm:w-[min(44rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-carvao-700 sm:shadow-2xl'
        }
      >
        <div className="safe-x flex shrink-0 items-center justify-between gap-3 border-b border-carvao-700 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6 sm:pt-2">
          <h2 id={titleId} className="min-w-0 break-words font-display text-3xl tracking-wide text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-zinc-300 transition hover:bg-carvao-700 hover:text-white active:bg-carvao-600"
          >
            <X aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>
        <div className="safe-x flex-1 overflow-y-auto overscroll-contain py-4" data-dialog-body>
          {children}
        </div>
        {footer && (
          <div className="safe-x shrink-0 border-t border-carvao-700 bg-carvao-950/60 pt-3 pb-safe">{footer}</div>
        )}
      </div>
    </div>
  );
}
