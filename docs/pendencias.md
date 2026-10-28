# Pendências comerciais

Itens que dependem de confirmação da pizzaria. **Nada aqui foi inventado no site.**

| # | Pendência | Situação atual no site | Onde alterar |
|---|---|---|---|
| 1 | Dias e horários de funcionamento | Exibe "Consulte o horário pelo WhatsApp" | `src/config/business.ts` → `openingHoursText` |
| 2 | Área atendida pelo delivery | Não valida endereço; aviso de confirmação pelo WhatsApp | `src/config/business.ts` |
| 3 | Adicionais e borda em pizzas doces e meio a meio com doce | Bloqueados por flag | `allowAddonsOnSweet`, `allowBorderOnSweet` em `src/config/business.ts` |
| 4 | Chave Pix e procedimento de pagamento | Mensagem genérica, sem chave nem QR Code | `src/config/business.ts` → `paymentMethods` |
| 5 | Maquininha e parcelamento | Só registra crédito/débito; sem parcelamento | — |
| 6 | Logo e fotos originais | Placeholders SVG próprios (`public/images/logo.svg`, `public/images/hero-pizza.svg`) | Substituir os arquivos em `public/images/` |
| 7 | Descrição exata do sabor Lombinho (S17) | Exibe "Molho, muçarela, lombo e canadense." | `src/data/menu.ts` |
| 8 | "Retirada" e "Drive-thru" são a mesma modalidade? | Opção "Retirada no local"; rodapé anuncia Delivery e Drive-thru | `deliveryModeLabels` em `src/config/business.ts` |
| 9 | A pizzaria vende bebidas? | Nenhuma bebida cadastrada; estrutura aceita novas categorias | `src/data/menu.ts` / `src/models` |
