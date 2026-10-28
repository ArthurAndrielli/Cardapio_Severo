# Severo Pizzas Delivery — Cardápio digital

Site de página única com o cardápio da **Severo Pizzas Delivery** (Santa Cruz da Conceição — SP).
O cliente monta a pizza (inteira ou meio a meio), coloca no carrinho, escolhe entrega ou retirada e a forma
de pagamento, e o pedido é enviado **pelo WhatsApp** da pizzaria. Não há backend, login nem pagamento online.

## Funcionalidades

- Cardápio completo: 48 pizzas salgadas e 3 doces, tamanho único.
- Filtros **Salgadas / Doces** e busca por nome ou ingrediente (ignora acentos e maiúsculas).
- Personalizador: inteira ou **meio a meio** (qualquer combinação, inclusive doce + salgada), borda, adicionais,
  observação, quantidade (1 a 20) e preço calculado na hora.
- Meio a meio cobra **o sabor mais caro**.
- Adicionais e borda bloqueados em pizzas com sabor doce (configurável por flag).
- Carrinho em gaveta lateral, salvo no navegador: editar, alterar quantidade, remover com "desfazer".
- Checkout com validação: nome, telefone com máscara, entrega (taxa fixa de R$ 5,00) ou retirada, endereço,
  Pix / Dinheiro (com troco validado) / Cartão de crédito / Cartão de débito.
- Mensagem do pedido formatada e aberta no WhatsApp em nova aba.
- Responsivo (a partir de 360px), acessível (teclado, leitores de tela, foco visível, `prefers-reduced-motion`).
- Experiência de app no celular: menu hambúrguer, barra fixa "Ver carrinho", filtros fixos, lista de sabores
  com busca, diálogos em tela cheia, botão "voltar" do Android fecha o que estiver aberto, áreas seguras do
  iPhone, teclados e preenchimento automático corretos em cada campo.

## Tecnologias

React 18 · TypeScript (strict) · Vite 5 · Tailwind CSS 3 · lucide-react · Vitest + Testing Library + jsdom.

## Como instalar e rodar

Pré-requisito: [Node.js](https://nodejs.org/) 20 ou mais recente.

```bash
npm install       # instala as dependências
npm run dev       # abre em http://localhost:5173
```

## Como testar

```bash
npm run test       # todos os testes (unitários e de interface)
npm run typecheck  # checagem de tipos
npm run build      # build de produção em dist/
npm run preview    # serve o build localmente
```

## Estrutura de pastas

```
public/images/          logo e imagens (placeholders em SVG)
src/
  config/business.ts    dados da pizzaria, WhatsApp, taxa, pagamentos, flags
  config/images.ts      nomes dos arquivos de imagem
  data/menu.ts          sabores salgados e doces
  data/addons.ts        adicionais e borda
  models/               tipos (Flavor, Addon, CartItem, CheckoutData...)
  lib/money.ts          formatação e operações em centavos
  lib/pricing.ts        regras de preço (inteira, meio a meio, taxa, troco)
  lib/validation.ts     validação do checkout, telefone e troco
  lib/whatsapp.ts       mensagem e link do WhatsApp
  lib/storage.ts        carrinho no LocalStorage (com versão e descarte seguro)
  lib/search.ts         busca sem acentos
  store/CartContext.tsx estado do carrinho (Context + useReducer)
  components/           Dialog (modal/gaveta acessível), QuantityStepper
  sections/             Header, Hero, Menu, PizzaBuilder, CartDrawer, Checkout, Footer
  tests/                testes
docs/                   especificação e pendências
```

## Onde alterar

Todos os valores em dinheiro estão em **centavos** (ex.: R$ 63,00 = `6300`).

| O quê | Arquivo |
|---|---|
| Preços, nomes e ingredientes das pizzas | `src/data/menu.ts` |
| Adicionais e borda | `src/data/addons.ts` |
| Taxa de entrega (`DELIVERY_FEE_CENTS`) | `src/config/business.ts` |
| Telefone/WhatsApp, endereço, horário | `src/config/business.ts` (`business`) |
| Formas de pagamento e textos | `src/config/business.ts` (`paymentMethods`) |
| Rótulos "Entrega" / "Retirada no local" | `src/config/business.ts` (`deliveryModeLabels`) |
| Liberar adicionais/borda em pizzas doces | `src/config/business.ts` → `featureFlags.allowAddonsOnSweet` / `allowBorderOnSweet` = `true` |

Depois de alterar preços, rode `npm run test`: o teste `src/tests/menu.test.ts` confere os preços oficiais e
precisa ser atualizado junto.

## Como trocar o logo e as fotos

As imagens atuais são **placeholders** em SVG:

- `public/images/logo.svg` — logo (cabeçalho e ícone da aba)
- `public/images/hero-pizza.svg` — imagem da pizza no topo

Para trocar, basta substituir o arquivo mantendo o mesmo nome. Se o novo arquivo tiver outra extensão
(ex.: `logo.png`, `hero-pizza.jpg`), coloque-o em `public/images/` e altere o nome em `src/config/images.ts`
(e em `index.html`, linha do `<link rel="icon">`, para o logo).

## Publicar no GitHub Pages (passo a passo)

1. Crie uma conta em [github.com](https://github.com) e um **repositório novo** (ex.: `severo-pizzas`).
2. Na pasta do projeto, rode no terminal (troque `SEU-USUARIO`):
   ```bash
   git init
   git add .
   git commit -m "Cardápio Severo Pizzas"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/severo-pizzas.git
   git push -u origin main
   ```
3. No GitHub, abra o repositório → **Settings** → **Pages** → em **Source**, escolha **GitHub Actions**.
4. Pronto. A cada `git push` na branch `main`, o workflow `.github/workflows/deploy.yml` roda os testes,
   faz o build e publica. Acompanhe na aba **Actions**.
5. O endereço fica em `https://SEU-USUARIO.github.io/severo-pizzas/`.

O projeto usa `base: './'` no `vite.config.ts`, então funciona em qualquer subpasta sem configuração extra.
Se os testes falharem, o site não é publicado (a versão anterior continua no ar).

### Alternativa: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting     # diretório público: dist · single-page app: Sim · GitHub deploy: opcional
npm run build
firebase deploy
```

## Pendências comerciais

Detalhes em [`docs/pendencias.md`](docs/pendencias.md). Nada disso foi inventado no site:

- Dias e horários de funcionamento (site mostra "Consulte o horário pelo WhatsApp").
- Área atendida pelo delivery (não há validação de endereço).
- Política de adicionais e borda em pizzas doces (hoje bloqueados, via flag).
- Chave Pix e procedimento de pagamento.
- Maquininha e parcelamento.
- Logo e fotos originais (hoje placeholders SVG).
- Descrição exata do sabor Lombinho.
- Se "Retirada" e "Drive-thru" são a mesma modalidade.
- Se a pizzaria vende bebidas.

## Documentação do projeto

- [`CLAUDE.md`](CLAUDE.md) — resumo, comandos e regras comerciais.
- [`docs/especificacao.md`](docs/especificacao.md) — requisitos, modelos de dados, contratos e critérios de aceite.
