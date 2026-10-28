# CLAUDE.md — Severo Pizzas Delivery

Cardápio digital (página única) da pizzaria **Severo Pizzas Delivery**, com montagem de pizza
inteira ou meio a meio, carrinho persistente, checkout e envio do pedido pelo WhatsApp.
Sem backend, sem login, sem cobrança online.

Leia também: `docs/especificacao.md` (requisitos e critérios de aceite) e `docs/pendencias.md`.

## Comandos

| Ação | Comando |
|---|---|
| Instalar | `npm install` |
| Desenvolvimento | `npm run dev` |
| Testes | `npm run test` |
| Checagem de tipos | `npm run typecheck` |
| Build de produção | `npm run build` (gera `dist/`) |
| Pré-visualizar build | `npm run preview` |
| Deploy | push na branch `main` → GitHub Actions (`.github/workflows/deploy.yml`) publica no GitHub Pages |

## Stack

React 18 + TypeScript strict + Vite 5 + Tailwind CSS 3 + lucide-react. Testes: Vitest + Testing Library + jsdom.

## Arquitetura

- `src/config/business.ts` — dados da pizzaria, WhatsApp, taxa de entrega, pagamentos, flags.
- `src/data/menu.ts`, `src/data/addons.ts` — cardápio, adicionais e borda.
- `src/models/` — tipos.
- `src/lib/` — `money`, `pricing`, `whatsapp`, `validation`, `storage`, `search`.
- `src/store/` — carrinho (Context + useReducer).
- `src/components/`, `src/sections/` — UI.

## Regras invioláveis

- **Dinheiro sempre em centavos inteiros.** Nunca float. Formatação via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Preços, taxa, pagamentos, telefone e flags só em `config/` e `data/`.
- Não inventar produtos, preços, chave Pix, horários ou área de entrega.
- Página única, sem React Router.

## Regras comerciais

1. **Tamanho único.** Nunca mostrar pequena/média/grande.
2. **Inteira:** `unitário = sabor + borda + Σ adicionais`.
3. **Meio a meio:** exatamente 2 sabores diferentes; qualquer combinação (salgada/doce).
   **Cobra o sabor mais caro:** `base = max(s1, s2)`; `unitário = base + borda + Σ adicionais`.
   Nunca média, divisão ou soma dos sabores.
   Exemplos: Calabresa 6300 + Atum 7000 = 7000 · Calabresa + Chocolate 5500 = 6300 ·
   Chocolate + Prestígio = 5500 · Calabresa + Atum + Bacon 700 = 7700.
4. **Adicionais e borda:** valem para a pizza inteira (nunca por metade), cada um no máximo 1x,
   cobrados 1x por pizza antes de multiplicar pela quantidade. Borda catupiry (R$ 15,00) em seção própria.
5. **Doces (política provisória, flags `allowAddonsOnSweet=false`, `allowBorderOnSweet=false`):**
   adicionais/borda só em salgada inteira ou salgada+salgada. Em doce inteira, doce+doce ou
   salgada+doce: desabilitados com "Adicionais indisponíveis para pizzas doces no momento."
   Ao cair numa combinação bloqueada, remover os já marcados e avisar.
6. **Quantidade:** 1 a 20 por item. `subtotalItem = unitário × qtd`.
7. **Entrega:** taxa fixa **500** por pedido (uma vez, independe de qtd/valor/bairro). Retirada: sem taxa.
   Não validar área. Mostrar "A disponibilidade de entrega para o seu endereço será confirmada pelo WhatsApp."
   Ex.: 6300 + 5500 = 11800 → entrega 12300.
8. **Pagamento:** exatamente Pix, Dinheiro, Cartão de crédito, Cartão de débito (radio group, obrigatório).
   Pix sem chave/QR. Cartões: nunca pedir dados, sem parcelamento.
   Dinheiro: "Vai precisar de troco?"; valor **> total** (igual → mensagem específica); troco = valor − total.
   Revalidar troco quando o total mudar.
9. **Checkout:** nome (≥2), telefone (10/11 dígitos, DDD válido, máscara), modalidade; se entrega:
   rua, número, bairro, cidade (padrão "Santa Cruz da Conceição"), referência opcional.
   Foco no primeiro campo inválido. LocalStorage guarda **só o carrinho** (`severo-cart-v1`).
10. **Carrinho:** itens com id único; preços sempre recalculados do cardápio atual;
    dados inválidos/ids inexistentes descartados. Após enviar, perguntar se limpa (nunca automático).
11. **WhatsApp:** 5519993972286, `https://wa.me/5519993972286?text=` + `encodeURIComponent`, nova aba.
    Modelo exato em `docs/especificacao.md`. Após abrir: "Seu pedido foi preparado no WhatsApp.
    Envie a mensagem para a pizzaria confirmar." Nunca dizer recebido/confirmado/pago.
12. **Pizzaria:** Rua Paschoal Ganeo, 1211, Centro, Santa Cruz da Conceição — SP · (19) 99397-2286 ·
    Delivery e Drive-thru · Horário: "Consulte o horário pelo WhatsApp".
13. **Cardápio:** 48 salgadas (S01–S49, **sem 39**), 3 doces (D01–D03), 14 adicionais, 1 borda.
    Textos copiados exatamente da especificação original (sem padronizar).
    Sem bebidas, combos ou promoções.

## Convenções de mobile (não regredir)

- Alvos de toque ≥ 44×44px; texto do corpo e inputs ≥ 16px (evita zoom do iPhone).
- Diálogos usam `components/Dialog.tsx`: tela cheia no celular (e em telas com altura ≤ 500px),
  altura pela viewport visual (teclado não cobre o rodapé), áreas seguras (`.safe-x`, `.pb-safe`),
  trava de rolagem do fundo (`lockScroll`) e botão "voltar" do Android (`useBackClose`, em `lib/overlay.ts`).
- Sub-telas dentro de um diálogo (ex.: lista de sabores) também registram `useBackClose`.
- Até 640px o cabeçalho mostra só logo, hambúrguer e carrinho. Abaixo de 1024px aparece a barra fixa
  "Ver carrinho" quando há itens e nenhuma sobreposição aberta.
- Animações sempre com `motion-safe:`; efeitos de toque com `transform` só em `prefers-reduced-motion: no-preference`.
