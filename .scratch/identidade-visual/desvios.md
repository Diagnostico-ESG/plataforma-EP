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

## 2026-10-30 — /polir do acabamento visual (itens 1 a 5 de `.scratch/proposta-visual/decisoes.md`)

Audit (`/impeccable audit`, só código; não olhei a tela): detector com 0 achados. Contrastes conferidos pelos tokens: iniciais do avatar `#4A5163` sobre `#E9ECF1` (cerca de 6,9:1), dias parado `#8F1D2C` e relatório pendente `#7A4A00` sobre branco (acima de 8:1), todos AA.

### Corrigidos
- **Círculo "sem responsável":** a borda tracejada usava `--linha-tracejada` (`#C3CAD8`, cerca de 1,6:1 sobre branco); passou a usar `--icone-inativo` (`#9098A6`), mais visível. O significado já estava no `aria-label`.
- (Na revisão de código, antes do polimento) trilha em contraste forçado distingue o tracinho atual dos feitos; `display` duplicado no trilho removido; comentários fora do lugar e ternário aninhado.

### Deixados de fora, com motivo
- **Prazo e contador de arquivos no rodapé do cartão:** o cartão não recebe esses dados; exige mudar a view do banco (fora do escopo "só aparência").
- **Nome do setor no selo da Lista, do verso e das linhas de grupo:** `ProcessoDaLista` não traz o nome do setor; só o cartão do Quadro o recebe (pelo mapa dos setores da lista).
- **"Laranja" do relatório pendente é um marrom escuro (`#7A4A00`):** é o tom de pendência documentado no `DESIGN.md`, escolhido para dar contraste AA; mudar a cor é decisão de identidade.
- **`title` do selo só aparece com mouse:** o nome acessível (`aria-label`) cobre leitor de tela; o cartão inteiro é um link focável.
- **Ordem de leitura da descrição da coluna:** visualmente vem depois da contagem (CSS `order`), no texto vem antes; a leitura segue sigla, nome, contagem, o que é coerente.
- **`Quadro.css` com mais de 300 linhas:** já estava no backlog (refatoração sem efeito visual).
- **Conferência na tela:** este lote não foi visto no app rodando.
