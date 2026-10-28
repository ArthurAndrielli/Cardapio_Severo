import { Bike, Car, Clock, Info } from 'lucide-react';
import { business, messages } from '../config/business';
import { images } from '../config/images';
import { assetUrl } from '../lib/describe';

export function Hero() {
  return (
    <section id="inicio" aria-labelledby="hero-title" className="relative scroll-mt-16 overflow-hidden pt-[calc(4rem+env(safe-area-inset-top))]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,50,43,.28),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(255,201,40,.12),transparent_50%)]" />
      <div className="safe-x relative mx-auto grid max-w-6xl items-center gap-8 py-10 sm:py-12 md:grid-cols-[1.1fr_1fr] md:py-20 landscape:max-md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-severo-red/50 bg-severo-red/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-300">
            {business.address.city} — {business.address.state}
          </p>
          <h1 id="hero-title" className="break-words font-display text-[3.4rem] leading-[0.9] tracking-wide min-[400px]:text-6xl sm:text-7xl lg:text-8xl">
            Bateu aquela fome?{' '}
            <span className="block text-severo-yellow">Peça sua Severo!</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-zinc-300">
            Monte sua pizza inteira ou meio a meio, escolha os adicionais e envie o pedido direto pelo WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#cardapio"
              className="inline-flex items-center rounded-full bg-severo-yellow px-7 py-3.5 text-lg font-extrabold uppercase tracking-wide text-carvao-950 shadow-[0_8px_30px_rgba(255,201,40,.25)] transition hover:-translate-y-0.5 hover:bg-severo-yellow-dark motion-reduce:hover:translate-y-0"
            >
              Ver cardápio
            </a>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-base text-zinc-300">
              <li className="flex items-center gap-1.5"><Bike aria-hidden="true" className="h-4 w-4 text-severo-yellow" /> Delivery</li>
              <li className="flex items-center gap-1.5"><Car aria-hidden="true" className="h-4 w-4 text-severo-yellow" /> Drive-thru</li>
              <li className="flex items-center gap-1.5"><Clock aria-hidden="true" className="h-4 w-4 text-severo-yellow" /> {business.openingHoursText}</li>
            </ul>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[22rem] md:max-w-md">
          <div aria-hidden="true" className="absolute inset-6 rounded-full bg-severo-red/30 blur-3xl" />
          <img
            src={assetUrl(images.hero)}
            alt="Pizza com muçarela e calabresa"
            width={400}
            height={400}
            loading="eager"
            {...{ fetchpriority: 'high' }}
            decoding="async"
            className="relative w-full drop-shadow-[0_20px_40px_rgba(0,0,0,.6)] motion-safe:animate-[spin_120s_linear_infinite]"
          />
        </div>
      </div>
      <div className="border-y border-severo-red/30 bg-severo-red/10">
        <p className="safe-x mx-auto flex max-w-6xl items-center gap-2 py-2.5 text-base text-red-100">
          <Info aria-hidden="true" className="h-4 w-4 shrink-0 text-severo-red" />
          {messages.orderNotice}
        </p>
      </div>
    </section>
  );
}
