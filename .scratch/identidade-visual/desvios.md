# Desvios — identidade visual

## 2026-10-07 — /polir (Impeccable audit + polish)

Nota da auditoria: 18/20 (acessibilidade 3, desempenho 4, responsivo 3, temas 4, integridade 4). Detector do Impeccable sem achados. Conferido no navegador em 1024px e 375px: sem rolagem lateral, fontes carregando, foco visível pelo teclado (branco na barra azul).

### Corrigidos

- **Opção escolhida de Quadro | Lista invisível no alto contraste do Windows.** O fundo branco some nesse modo e as duas opções ficavam iguais. Agora a escolhida ganha um contorno (`Moldura.css`).
- **Linha acesa da faixa lateral em meio pixel.** O traço ficava a 0,5px da borda e saía borrado. Recuo calculado a partir da largura da faixa; o traço agora encosta na borda (`Moldura.css`).

### Deixados de fora, com motivo

- **Botões que ainda não fazem nada** (Lista, Filtrar, Sua conta, itens da faixa, Cadastrar processo): cada um ganha ação na funcionalidade dele; já anotado no código.
- **O estado vazio cita "importe a planilha", mas não há botão de importar:** o texto segue a identidade aprovada; o botão chega com a funcionalidade de importação. Mudar o texto é decisão do usuário.
- **Opções de Quadro | Lista com 23px de altura** (o mínimo do WCAG 2.2 é 24px): passa pela exceção de espaçamento do critério 2.5.8, porque não há outro alvo a menos de 24px; mudar a altura mexeria no visual aprovado.
- **Alvos de toque de 32 a 40px no celular** (o ideal é 44px): celular é opcional neste projeto (`PRODUCT.md`).
- **Sem modo escuro:** nenhum requisito pede; os tokens estão todos num arquivo só, o que facilita criar depois.
- **IBM Plex Mono aparece como "não carregada" na tela vazia:** é o comportamento normal do navegador (só baixa a fonte quando algum texto a usa). Testado forçando o uso: carrega.
