import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { flavors, menuCategories } from '../data/menu';
import { filterFlavors } from '../lib/search';
import { formatBRL } from '../lib/money';
import type { Flavor, FlavorCategory } from '../models';

export function Menu({ onBuild }: { onBuild: (flavor: Flavor) => void }) {
  const [category, setCategory] = useState<FlavorCategory>('salgada');
  const [query, setQuery] = useState('');

  const results = useMemo(() => filterFlavors(flavors, query, category), [query, category]);
  const elsewhere = useMemo(
    () => (query.trim() ? menuCategories.filter((c) => c.id !== category).map((c) => ({ ...c, count: filterFlavors(flavors, query, c.id).length })).filter((c) => c.count > 0) : []),
    [query, category],
  );
  const currentLabel = menuCategories.find((c) => c.id === category)?.label ?? '';

  return (
    <section id="cardapio" aria-labelledby="menu-title" className="scroll-mt-16 pb-14 pt-10 sm:pt-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold uppercase tracking-widest text-severo-red">Tamanho único</p>
          <h2 id="menu-title" className="font-display text-5xl tracking-wide sm:text-6xl">
            Cardápio
          </h2>
          <p className="text-base text-zinc-400">Todas as pizzas podem ser inteiras ou meio a meio. No meio a meio, vale o preço do sabor mais caro.</p>
        </div>

        {/* Filtros e busca ficam fixos logo abaixo do cabeçalho ao rolar o cardápio. */}
        <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-30 -mx-4 mt-6 border-b border-carvao-700/60 bg-carvao-950/95 px-4 py-3 backdrop-blur [@media(max-height:500px)]:py-1.5" data-testid="menu-filters">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2" role="group" aria-label="Filtrar categoria">
              {menuCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(c.id)}
                  className={`min-h-11 flex-1 rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition sm:flex-none ${
                    category === c.id
                      ? 'bg-severo-yellow text-carvao-950'
                      : 'border border-carvao-600 text-zinc-300 hover:border-severo-yellow hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="relative sm:w-80">
              <label htmlFor="menu-search" className="sr-only">
                Buscar por nome ou ingrediente
              </label>
              <Search aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-zinc-500" />
              <input
                id="menu-search"
                type="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome ou ingrediente"
                autoComplete="off"
                onKeyDown={(e) => {
                  // "Buscar" no teclado do celular: fecha o teclado para mostrar os resultados.
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
                className="field min-h-11 w-full rounded-full pl-9 pr-12"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Limpar busca"
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-full text-zinc-400 hover:text-white"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {results.length} {results.length === 1 ? 'sabor encontrado' : 'sabores encontrados'} em {currentLabel}
        </p>

        {results.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-carvao-600 p-8 text-center text-zinc-400">
            <p>Nenhum sabor encontrado em {currentLabel} para “{query}”.</p>
            {elsewhere.map((c) => (
              <button key={c.id} type="button" onClick={() => setCategory(c.id)} className="mt-3 min-h-11 font-semibold text-severo-yellow underline underline-offset-4">
                Ver {c.count} {c.count === 1 ? 'resultado' : 'resultados'} em {c.label}
              </button>
            ))}
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label={`Sabores ${currentLabel}`}>
            {results.map((f) => (
              <li key={f.id}>
                <FlavorCard flavor={f} onBuild={onBuild} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function FlavorCard({ flavor, onBuild }: { flavor: Flavor; onBuild: (f: Flavor) => void }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-carvao-700 bg-carvao-900 p-5 transition hover:border-severo-yellow/60 hover:bg-carvao-800">
      <div className="flex items-start gap-3">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-2xl ${
            flavor.category === 'doce' ? 'bg-severo-red/15 text-red-300' : 'bg-severo-yellow/10 text-severo-yellow'
          }`}
          aria-label={`Número ${flavor.code}`}
        >
          {flavor.code}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-bold leading-tight text-white [overflow-wrap:anywhere]">{flavor.name}</h3>
          <p className="mt-1 break-words text-base leading-snug text-zinc-400 sm:text-[0.95rem]">{flavor.ingredients}</p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <p className="whitespace-nowrap font-display text-3xl tracking-wide text-severo-yellow">{formatBRL(flavor.priceCents)}</p>
        <button
          type="button"
          onClick={() => onBuild(flavor)}
          aria-label={`Montar pizza ${flavor.name}`}
          className="min-h-11 shrink-0 rounded-full bg-severo-red px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-severo-red-dark"
        >
          Montar pizza
        </button>
      </div>
    </article>
  );
}
