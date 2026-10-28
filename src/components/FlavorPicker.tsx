import { ArrowLeft, Check, Search } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { flavors, menuCategories } from '../data/menu';
import { formatBRL } from '../lib/money';
import { filterFlavors } from '../lib/search';

interface Props {
  /** Ex.: "Sabor", "1ª metade". */
  slotLabel: string;
  selectedId: string;
  /** Sabor já escolhido na outra metade (fica indisponível). */
  excludeId?: string;
  onPick: (id: string) => void;
  onBack: () => void;
}

/** Lista de sabores com busca, pensada para toque: substitui o select nativo longo. */
export function FlavorPicker({ slotLabel, selectedId, excludeId, onPick, onBack }: Props) {
  const uid = useId();
  const [query, setQuery] = useState('');
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const back = backRef.current;
    back?.focus({ preventScroll: true });
    const body = back?.closest('[data-dialog-body]');
    if (body) body.scrollTop = 0;
  }, []);

  const groups = useMemo(
    () => menuCategories.map((c) => ({ ...c, items: filterFlavors(flavors, query, c.id) })).filter((g) => g.items.length > 0),
    [query],
  );

  return (
    <div>
      <div className="sticky -top-4 z-10 -mx-4 -mt-4 space-y-3 border-b border-carvao-700 bg-carvao-900 px-4 py-3 sm:-mx-6 sm:px-6">
        <button
          ref={backRef}
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center gap-2 rounded-full pr-3 font-semibold text-zinc-200 hover:text-white"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" /> Voltar
        </button>
        <div className="relative">
          <label htmlFor={`${uid}-q`} className="sr-only">
            Buscar sabor para {slotLabel}
          </label>
          <Search aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-zinc-500" />
          <input
            id={`${uid}-q`}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            placeholder="Buscar por nome ou ingrediente"
            className="field min-h-11 w-full rounded-full pl-9"
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="py-10 text-center text-zinc-400" role="status">
          Nenhum sabor encontrado para “{query}”.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.id} aria-labelledby={`${uid}-${g.id}`} className="mt-4">
            <h3 id={`${uid}-${g.id}`} className="label">
              {g.label}
            </h3>
            <ul className="space-y-2" aria-label={`Sabores ${g.label}`}>
              {g.items.map((f) => {
                const selected = f.id === selectedId;
                const blocked = f.id === excludeId;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => onPick(f.id)}
                      disabled={blocked}
                      aria-current={selected || undefined}
                      aria-label={`${f.name}, ${formatBRL(f.priceCents)}${blocked ? ', já escolhido na outra metade' : ''}`}
                      aria-describedby={`${uid}-${f.id}-ing`}
                      className={`flex min-h-14 w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        selected ? 'border-severo-yellow bg-severo-yellow/10' : 'border-carvao-700 bg-carvao-800/60 hover:border-carvao-600'
                      }`}
                    >
                      <span className="w-7 shrink-0 pt-0.5 font-display text-xl text-severo-yellow">{f.code}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words font-bold leading-tight">{f.name}</span>
                        <span id={`${uid}-${f.id}-ing`} className="mt-0.5 block break-words text-sm leading-snug text-zinc-400">
                          {blocked ? 'Já escolhido na outra metade' : f.ingredients}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap font-bold text-severo-yellow">
                        {formatBRL(f.priceCents)}
                        {selected && <Check aria-hidden="true" className="h-5 w-5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
