# Próximo passo (2026-11-03)

**Situação:** a funcionalidade 20, `setor-neutro-e-fotos`, foi entregue em 2026-11-03 (commit `a973441`, marco `marco/2026-11-03-entrega-setor-neutro-e-fotos`), com ressalva: os critérios `[visual]` 8 a 10 (selo neutro e maior, ícones do Status, pílulas de Situação e foto do Google no cartão) não foram vistos no app real, que exige o login Google. Todas as funcionalidades da lista do `.scratch/projeto.md` estão entregues. Testes (3316), build, cobertura (98,2%) e dependências circulares passaram.

**Próximo comando:** nenhum obrigatório. Para uma ideia nova ou um ajuste, `/demanda` (Opus para classificar); para uma funcionalidade nova planejada, `/planejar`. Sessão nova começando pelo `/situação`.

**Depende do usuário:**
- Ver o app com o login real e conferir o selo do setor, o Status, as pílulas de Situação e a foto do Google no cartão e na Lista (e os critérios `[visual]` 14 a 18 do redesenho e a miniatura com um .png real). Se algo destoar, `/demanda`.
- Ler as "Decisões tomadas ao escrever esta seção" da spec de `processos-etapas`; conferir o Catálogo de etapas e escolher o responsável inicial de cada etapa.
- Produção ainda não existe (revisão de pré-produção, projeto do Supabase, hospedagem, rede da TI).

**Adiados pelo usuário, cada um pelo `/demanda` quando ele pedir:**
1. Bug do histórico: os registros "Moveu o processo" não mostram "Moveu de {etapa} para {etapa}" (`src/cadastros/historicoDosCadastros.ts:19`).
2. Nome do setor ao passar o mouse no selo da Lista, do verso e das linhas de grupo (o selo do cartão já tem).
3. Dividir o `Quadro.css` e `/impeccable document`.
4. Lentidão da primeira abertura da miniatura (backlog).
5. Coluna `cor` de `setores` e `setor_cor` da view, sem uso: remover por migração se um dia incomodar.
6. No `.scratch/backlog.md`: renomear nomes de código "etiqueta" para "status"; extrair o bloco repetido do Avatar; teste instável de `substituirArquivo`; o pre-commit falhou uma vez sem motivo claro em 2026-11-03 e passou na repetição (possível mesmo teste instável).
