# Próximo passo (2026-11-03)

**Situação:** a funcionalidade 20, `setor-neutro-e-fotos`, foi implementada e mesclada na `main` (último commit de código `a5eba6e`; spec com "Implementado em"). Selo do setor em cor única e maior (também no cartão por setor), Status no lugar de Etiqueta com ícones maiores e A fazer laranja, Situação em pílulas de cor, avatar do responsável no cartão e na Lista. `npm test` (3312), typecheck e lint passaram. Sem migração. **Não vista no app real** (exige o login Google): critérios `[visual]` 8 a 10 da spec presumidos.

**Próximo comando:** `/ship` (o `/polir` de `setor-neutro-e-fotos` já foi feito em 2026-11-03: um problema grave corrigido, a legenda do Status, e dois menores; os deixados de fora estão em `.scratch/setor-neutro-e-fotos/desvios.md`), com o Sonnet, em sessão nova começando pelo `/situação`. O `/ship` grava a marca de entrega nas specs de `processos-etapas` e `cadastros-basicos`, que estão "Em revisão desde 2026-11-03". Não há funcionalidade seguinte na lista do `.scratch/projeto.md`.

**Depende do usuário:**
- **CONTEXT.md:** o termo "Etiqueta" (linha 111, com _Avoid_ "status") deveria virar "Status (antes Etiqueta)". Proposta de redação: "**Status**: a marca da etapa em que o processo está (A fazer, Em andamento — rótulo "Iniciado" na tela — e Finalizado), mostrada por um ícone; não é a Situação do processo. _Avoid_: etiqueta (nome antigo), situação (para o Status)". Aplico depois que o usuário confirmar; vale também trocar "etiqueta Finalizado" nas outras entradas.
- Decidir o rótulo do segundo Status: a tela diz "Iniciado", a spec diz "Em andamento" (`.scratch/setor-neutro-e-fotos/desvios.md`).
- Ver o app com o login real (o selo, os ícones, as pílulas e a foto do Google no cartão), além dos critérios `[visual]` 14 a 18 do redesenho e da miniatura com um .png real.
- A captura do verso, se a foto do responsável no verso não aparecer como esperado (marco `marco/2026-11-03-antes-correcao-foto-do-responsavel` existe).

**Adiados pelo usuário, cada um pelo `/demanda` quando ele pedir:**
1. Bug do histórico: os registros "Moveu o processo" não mostram "Moveu de {etapa} para {etapa}" (`src/cadastros/historicoDosCadastros.ts:19`).
2. Nome do setor ao passar o mouse no selo da Lista, do verso e das linhas de grupo (o selo do cartão já tem).
3. Dividir o `Quadro.css` e `/impeccable document`.
4. Lentidão da primeira abertura da miniatura (backlog).
5. Coluna `cor` de `setores` sem uso no banco (e a view `processos_com_andamento`, que ainda devolve `setor_cor`): remover por migração, se um dia incomodar.
