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

## 2026-10-30 — /polir do redesenho "Grafite e branco, cor em ponto"

Audit (`/impeccable audit`): detector com 0 problemas e 3 avisos; nota por dimensão: acessibilidade 3/4, desempenho 3/4, tema 3/4 (só claro, por decisão), responsivo 3/4, integridade 4/4.

### Corrigidos
- **Grade de cores do setor:** 12 amostras em 6 colunas de 34×24px com canto de 5px (a identidade pedia isso; eram 10 colunas de 28px). Novo token `--canto-amostra`.
- **Tracinhos da etapa:** o canto de 2px passou a usar o token `--canto-macro`, e a máscara não usa mais `#000` solto (`currentColor`).
- **DESIGN.md:** os cantos `canto-macro` e `canto-amostra` entraram na escala.
- **Nome nos testes:** `corClaraDe` virou `corDoSeloDe` (a cor deixou de ser clara).

### Deixados de fora, com motivo
- **Selo do setor sem nome ao passar o mouse; rodapé do cartão sem ícones e com prazo em pílula; cores do avatar; faixa de controles de 56px; plaqueta da coluna só com o nome:** são comportamento ou estrutura nova, na `.scratch/backlog.md` (seção "Achados da revisão de código da identidade").
- **`Quadro.css` com mais de 300 linhas:** dividir em Quadro e Lista é uma refatoração sem efeito visual; backlog.
- **Alvos de toque de 24 a 34px e pacote do site de 695 kB:** celular é opcional; dividir o pacote não é desta etapa.
- **`prefers-reduced-motion` global zera as transições:** já era assim e vale para todo o app; revisar numa passada de animação.
- **Quadro por Setor sem colunas na vitrine local:** a vitrine não tem setores cadastrados; não é defeito da tela (a suíte cobre o agrupamento).
