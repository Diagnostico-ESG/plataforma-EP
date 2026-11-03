# Desvios — setor-neutro-e-fotos

2026-11-03 — A spec fala em três valores do Status (A fazer, Em andamento, Finalizado), mas o rótulo atual do segundo valor é "Iniciado" (`src/processos/rotulos.ts`). Mantido "Iniciado"; trocar o rótulo fica para o usuário decidir.

2026-11-03 — O cabeçalho da coluna do Quadro por setor e o fundo da coluna já eram neutros desde a identidade de 2026-10-30 (só o selo carregava a cor); o item "cabeçalho sem cor" da spec já valia e não exigiu mudança.

2026-11-03 — `/polir` (auditoria com o detector do Impeccable, sem achados, e revisão manual do código; o app não pôde ser aberto sem o login Google, então nada foi visto na tela).

Corrigidos:
- **[P1] Legenda do Status perdia o estilo da faixa de controles.** Ao envolver a legenda num contêiner (`.legenda-do-status`), as regras de `FaixaDeControles.css` (encolher, esconder abaixo de 900px) continuavam mirando `.legenda-das-etiquetas` e deixaram de valer. Selectors corrigidos e teste de estrutura acrescentado em `App.cartaoDoQuadro.test.tsx`.
- **[P2] A explicação "Status é da etapa; Situação é do processo" estava só num `title` (invisível no teclado, no toque e para leitor de tela).** O rótulo da legenda agora é visível: "Status da etapa".
- **[P3] Altura do topo do cartão variava** (selo do setor de 26px contra ícone de 22px, nas Linhas por setor, onde não há selo). `.cartao-topo` com altura mínima de 26px.

Deixados de fora:
- **[P2] Suspenso (âmbar) e Cancelado (vermelho) usam as mesmas cores dos prazos "vencendo" e "atrasado".** Vem da decisão da spec (Situação em âmbar e vermelho claro); na Lista as duas informações moram em colunas diferentes. Se confundir na prática, dar tons próprios à Situação.
- **[P2] O selo do setor, maior, deixa as linhas da Lista mais altas** (cerca de 6px por linha). É o que a spec pediu ("maior" na Lista também); a densidade de ferramenta de trabalho diário (princípio 3) pode pedir um selo menor só na Lista.
- **[P3] Contorno tracejado do avatar sem responsável (`#9098a6`) tem cerca de 2,9:1 sobre o branco**, abaixo de 3:1 para elementos gráficos. É enfeite ao lado do texto "Sem responsável", sem informação própria.
- Critérios `[visual]` 8 a 10 da spec seguem presumidos (foto do Google, cores e tamanhos não vistos no app real).

2026-11-03 — Decisão do usuário sobre os nomes: o rótulo do segundo Status continua **Iniciado** ("Em andamento" é uma Situação do processo, não um Status). A divergência da primeira entrada deste arquivo fica resolvida a favor do código; a spec foi corrigida. O `CONTEXT.md` trocou o termo **Etiqueta** por **Status**.

2026-11-03 — `/ship` (revisão do diff com `/code-review`: padrões sem violação dura; spec com achados).

Corrigidos:
- **Critério 4 da spec não cumprido:** ainda havia "etiqueta" em texto visível: a frase do processo parado ("mudar a etapa, a etiqueta ou o responsável", no verso e em `frasesDeSituacao.ts`), o registro do histórico ("Mudou a etiqueta") e as três recusas de `frasesDoMovimento.ts`. Agora dizem "status". Teste novo em `src/processos/frasesDoStatus.test.ts`.
- Resto de CSS morto (`.opcao-cor` e `.opcao-cor-do-setor` em `caixas.css`), que o `/polir` não pegou.
- `SetorEditavel.tsx` estava salvo sem quebra de linha final e com outro fim de linha que o resto; normalizado.

Deixados de fora:
- **Mensagens escritas dentro do banco** (nas migrações, ex.: "etiqueta é sempre Concluído") continuam com a palavra "etiqueta" quando a recusa chega por um código que a tela não conhece; a tela traduz as conhecidas. Trocar exigiria migração nova; sem urgência.
- **O campo do verso diz só "Status"**, sem "da etapa" (a legenda do Quadro diz "Status da etapa"). Ele fica ao lado de "Etapa" no mesmo cartão; se confundir, acrescentar.
- **Nomes de código com "etiqueta"** (`EtiquetaDoProcesso`, `ETIQUETAS`, `ROTULO_DA_ETIQUETA`, coluna do banco): renomear tudo seria uma mudança grande sem efeito para quem usa; `.scratch/backlog.md`.
- **Repetição do bloco `<Avatar ... fotoUrl={x.fotoUrl ?? undefined} decorativo />`** em seis lugares (três deste diff): juízo de refatoração, não violação; `.scratch/backlog.md`.

Verificado no `/ship`: `npm run build` ok; `npm run test:coverage`: 98,2% das instruções, 94,4% dos ramos; `npm run check:circular` sem ciclo; sem mudança em `package.json` (passo 3 pulado, `.scratch/security.md` já existe); sem login, permissão, migração ou dado novo (passos 4, 7 e 10 pulados: a mudança só reapresenta nome e foto que já apareciam).

2026-11-03 — `/polir` da revisão (ADR 0040) e das duas correções das Linhas do Quadro. Audit do Impeccable: 17/20 (detector sem achados nos 10 arquivos tocados). Conferido numa vitrine local com módulos falsos (`vitrine.local/cores.html`, fora do git), em 1366×768, pelos estilos calculados no navegador; a captura de tela não saiu (janela do app oculta), e nada foi visto com o login real.

Corrigidos:
- **[P2] Pílula dentro de pílula no cabeçalho do Quadro por setor.** O selo colorido (25,5px) ficava dentro da moldura branca com borda do título da coluna (33,5px). `Quadro.css`: `.coluna-titulo-texto:has(.selo-do-setor)` sem borda, fundo nem preenchimento; os cabeçalhos por etapa continuam com a moldura. Conferido: as quatro colunas por setor sem moldura, cartões começando na mesma altura (183px), por etapa sem mudança, console sem erro.

Conferido sem achado:
- Linhas por setor: selo colorido sobre o fundo, sem moldura; cartões sem repetir a sigla; a grade com 8 cabeçalhos uma vez só no alto, colunas nas mesmas posições em todas as linhas e altura igual dentro de cada linha (as duas correções de hoje seguram).
- Selos do cartão nas cores do ciclo e ícones de Status no quase preto do texto, distintos pela forma.

Deixados de fora:
- **[P3] `DESIGN.md` desatualizado** (Status colorido, `selo-do-setor` único, `canto-amostra`): vai com o `/impeccable document` já adiado (`.scratch/backlog.md`).
- Teste automático da regra nova: o jsdom não aplica a cascata nem `:has()`; a regra é de uma linha e foi conferida no navegador. Fica no critério `[visual]` 8.
- Layout de celular não conferido (opcional no projeto).
- Critérios `[visual]` 8 e 9 seguem presumidos no app real com o login.
