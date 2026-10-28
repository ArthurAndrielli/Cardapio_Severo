# Especificação — Severo Pizzas Delivery

## 1. Objetivo

Site estático (SPA de página única) com cardápio interativo e envio do pedido pelo WhatsApp.
Sem backend, login ou pagamento online. Publicável no GitHub Pages.

## 2. Requisitos funcionais

| ID | Requisito |
|---|---|
| RF01 | Cabeçalho fixo com logo, links Início/Cardápio/Contato e botão do carrinho com contador. |
| RF02 | Hero com "Bateu aquela fome? Peça sua Severo!", imagem e botão "Ver cardápio". |
| RF03 | Faixa: "Pedidos sujeitos ao horário de funcionamento e à confirmação pelo WhatsApp." |
| RF04 | Cardápio com filtros Salgadas/Doces e busca por nome/ingrediente (ignora acentos e caixa). |
| RF05 | Cards com número, nome, ingredientes, preço e botão "Montar pizza". |
| RF06 | Personalizador (modal): inteira/meio a meio, sabores, borda, adicionais, observação, quantidade, preço ao vivo. |
| RF07 | Carrinho em gaveta lateral: itens, +/−, editar, remover (com desfazer), subtotal, "Finalizar pedido". |
| RF08 | Carrinho persistido no LocalStorage (`severo-cart-v1`), preços recalculados ao carregar. |
| RF09 | Checkout: dados do cliente, modalidade, endereço, pagamento, troco, resumo, "Enviar pedido pelo WhatsApp". |
| RF10 | Mensagem do WhatsApp no modelo da seção 8 e abertura em nova aba. |
| RF11 | Após envio: aviso de preparo e pergunta se deseja limpar o carrinho. |
| RF12 | Rodapé com endereço, Google Maps, WhatsApp, modalidades e horário ("Consulte o horário pelo WhatsApp"). |

## 3. Regras comerciais

Ver `CLAUDE.md` (seção "Regras comerciais"). Resumo de fórmulas:

```
inteira:      unit = preco(sabor) + borda + Σ adicionais
meio a meio:  unit = max(preco(s1), preco(s2)) + borda + Σ adicionais   (s1 ≠ s2)
item:         subtotalItem = unit × qtd     (1 ≤ qtd ≤ 20)
pedido:       subtotal = Σ subtotalItem
              total = subtotal + (entrega ? 500 : 0)
troco:        valido sse valor > total;  troco = valor − total
```

Adicionais/borda permitidos se a pizza não contém sabor doce, ou se as flags
`allowAddonsOnSweet` / `allowBorderOnSweet` estiverem `true`.

## 4. Modelos de dados (TypeScript)

```ts
type Cents = number;                       // inteiro
type FlavorCategory = 'salgada' | 'doce';  // extensível
interface Flavor { id: string; code: string; name: string; category: FlavorCategory; priceCents: Cents; ingredients: string; }
interface Addon  { id: string; name: string; priceCents: Cents; }
interface Border { id: string; name: string; shortName: string; priceCents: Cents; }

type PizzaMode = 'inteira' | 'meio';
interface PizzaConfig {
  mode: PizzaMode;
  flavorIds: string[];      // 1 (inteira) ou 2 (meio)
  borderId: string | null;
  addonIds: string[];       // sem repetição
  note: string;
}
interface CartItem extends PizzaConfig { id: string; quantity: number; }

type DeliveryMode = 'entrega' | 'retirada';
type PaymentMethod = 'pix' | 'dinheiro' | 'credito' | 'debito';
interface Address { street; number; neighborhood; city; reference }
interface CheckoutData {
  name; phone; deliveryMode: DeliveryMode | null; address: Address; notes;
  paymentMethod: PaymentMethod | null; needsChange: boolean | null; changeForCents: Cents | null;
}
```

## 5. Contratos das funções de cálculo (`src/lib/pricing.ts`)

| Função | Entrada | Saída / erro |
|---|---|---|
| `getFlavor(id)` | id | `Flavor` ou `undefined` |
| `validatePizza(cfg)` | `PizzaConfig` | `{ ok: true } \| { ok: false, error }` — rejeita qtd de sabores errada, sabores iguais no meio a meio, ids inexistentes, adicional repetido, adicional/borda bloqueados pelas flags |
| `isSweetPizza(cfg)` | config | `true` se algum sabor é doce |
| `canUseAddons(cfg, flags?)` / `canUseBorder(cfg, flags?)` | config | boolean |
| `calculateBasePrice(cfg)` | config | preço do sabor (inteira) ou `max` (meio); lança `PricingError` se inválida |
| `calculateUnitPrice(cfg, flags?)` | config | base + borda + Σ adicionais; lança se inválida |
| `calculateItemSubtotal(item)` | `CartItem` | unit × qtd; lança se qtd fora de 1–20 |
| `calculateSubtotal(items)` | `CartItem[]` | Σ subtotais |
| `getDeliveryFee(mode)` | `DeliveryMode \| null` | 500 se entrega, senão 0 |
| `calculateTotal(subtotal, mode)` | | subtotal + taxa |
| `calculateChange(paid, total)` | | `paid − total` |

`src/lib/money.ts`: `formatBRL(cents)`, `parseBRLInput(texto) → cents | null`, `maskBRLInput(texto)`.

`src/lib/validation.ts`: `validateName`, `validatePhone`, `maskPhone`, `validateChange(cents|null, total)`,
`validateCheckout(data, total) → Record<campo, mensagem>` (endereço só na entrega).

`src/lib/whatsapp.ts`: `buildOrderMessage(order) → string`, `buildWhatsAppUrl(msg) → string`.

`src/lib/storage.ts`: `saveCart(items)`, `loadCart() → CartItem[]` (descarta inválidos, nunca lança).

## 6. Mensagem do WhatsApp

```
🍕 *NOVO PEDIDO — SEVERO PIZZAS*

*Cliente:* {nome}
*Contato:* {telefone}

*PEDIDO*

{qtd}x Pizza {Sabor}                ← inteira
{qtd}x Pizza Meio a Meio            ← meio a meio
½ {Sabor 1}
½ {Sabor 2}
Borda: Catupiry
Adicionais: Bacon, Ovo
Obs.: {obs item}
*Valor:* {unit} (× {qtd} = {subtotal item})   ← parêntese só se qtd > 1

*Subtotal:* {subtotal}
*Entrega:* R$ 5,00                  ← só entrega
*TOTAL: {total}*

*Modalidade:* Entrega | Retirada no local
*Endereço:* {rua}, {número} — {bairro}, {cidade}
*Referência:* {referência}

*Pagamento:* Pix | Dinheiro | Cartão de crédito | Cartão de débito
*Troco para:* {valor}
*Troco estimado:* {troco}
(ou "*Troco:* Não precisa")

*Observações:* {obs pedido}

_Pedido sujeito a confirmação pela pizzaria._
```
Linhas vazias/não aplicáveis são omitidas. URL: `https://wa.me/5519993972286?text=` + `encodeURIComponent`.

## 7. Critérios de aceite

1. Cardápio com 48 salgadas (sem código 39), 3 doces, 14 adicionais, 1 borda, ids únicos, preços exatos.
2. Os 4 exemplos de meio a meio resultam em 7000, 6300, 5500, 7700.
3. Meio a meio com sabores iguais é rejeitado.
4. Adicionais bloqueados em pizza com doce com flags padrão; liberados se a flag for `true`.
5. Quantidade limitada a 1–20; subtotal = unit × qtd.
6. 11800 com entrega → 12300; retirada → 11800; taxa uma só vez.
7. Troco rejeita vazio, 0, negativo, menor e igual (mensagem específica para igual).
8. `formatBRL(12300) === "R$ 123,00"` (com espaço não separável normalizado na comparação).
9. Telefone: 10 ou 11 dígitos com DDD válido; endereço exigido só na entrega.
10. Mensagem do WhatsApp contém todas as partes aplicáveis; URL com número e texto codificado.
11. Storage descarta JSON corrompido, versão errada e ids inexistentes.
12. Fluxo completo de UI testado (montar, carrinho, editar, quantidade, remover, checkout, 4 pagamentos, link).
13. Alternar entrega/retirada atualiza total na tela.
14. Busca sem acentos encontra por nome e ingrediente.
15. Acessibilidade: labels, nomes acessíveis em botões de ícone, radiogroup de pagamento,
    foco preso em modal/gaveta, Esc fecha, `prefers-reduced-motion` respeitado.
16. `npm run test` e `npm run build` sem erros.
