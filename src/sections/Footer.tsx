import { Bike, Car, Clock, MapPin, MessageCircle } from 'lucide-react';
import { business, fullAddress, googleMapsUrl } from '../config/business';
import { whatsappContactUrl } from '../lib/whatsapp';

/** reserveBottom: espaço extra para a barra fixa do carrinho não cobrir o fim da página. */
export function Footer({ reserveBottom = false }: { reserveBottom?: boolean }) {
  return (
    <footer id="contato" aria-labelledby="contato-title" className="scroll-mt-16 border-t border-carvao-700 bg-carvao-900">
      <div className="safe-x mx-auto grid max-w-6xl gap-8 py-12 md:grid-cols-3">
        <div>
          <h2 id="contato-title" className="font-display text-4xl tracking-wide">
            SEVERO <span className="text-severo-yellow">PIZZAS</span>
          </h2>
          <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-zinc-400">Delivery</p>
        </div>
        <address className="space-y-3 not-italic text-zinc-300">
          <p className="flex gap-2">
            <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-severo-red" />
            <span className="break-words">{fullAddress}</span>
          </p>
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-severo-yellow underline underline-offset-4 hover:text-white">
            Ver no Google Maps<span className="sr-only"> (abre em nova aba)</span>
          </a>
          <p className="flex items-center gap-2">
            <MessageCircle aria-hidden="true" className="h-5 w-5 shrink-0 text-severo-red" />
            <a href={whatsappContactUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center hover:text-severo-yellow">
              WhatsApp: {business.whatsappDisplay}<span className="sr-only"> (abre em nova aba)</span>
            </a>
          </p>
        </address>
        <div className="space-y-3 text-zinc-300">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Modalidades</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2"><Bike aria-hidden="true" className="h-5 w-5 text-severo-yellow" /> Delivery</li>
            <li className="flex items-center gap-2"><Car aria-hidden="true" className="h-5 w-5 text-severo-yellow" /> Drive-thru</li>
          </ul>
          <p className="flex items-center gap-2"><Clock aria-hidden="true" className="h-5 w-5 text-severo-yellow" /> {business.openingHoursText}</p>
        </div>
      </div>
      <p className={`border-t border-carvao-700 px-4 pt-4 text-center text-sm text-zinc-400 ${reserveBottom ? 'pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-4' : 'pb-[calc(1rem+env(safe-area-inset-bottom))]'}`}>
        © {new Date().getFullYear()} {business.name}. Pedidos sujeitos à confirmação pelo WhatsApp.
      </p>
    </footer>
  );
}
