# Próximo passo (2026-11-03)

**Situação:** `miniatura-rapida` (item 19) entregue em 2026-11-03 (commit cf80e8c, marco `marco/2026-11-03-entrega-miniatura-rapida`), com ressalva: a reabertura da miniatura é imediata (parte A), mas a primeira abertura continua em cerca de 3 s (parte C sem ganho medido; no backlog, com as hipóteses e o caminho de retomada). Todas as funcionalidades da lista do `.scratch/projeto.md` estão entregues.

**Próximo comando:** nada obrigatório. Cada demanda nova entra pelo `/demanda` (Opus para classificar; Sonnet no bug). Se quiser retomar a lentidão da primeira abertura: `/demanda`, com o `execution_time_ms` do painel do Supabase.

**Adiados pelo usuário, cada um pelo `/demanda` quando ele pedir:**
1. Bug do histórico: os registros "Moveu o processo" não mostram "Moveu de {etapa} para {etapa}" (`src/cadastros/historicoDosCadastros.ts:19`). Marco `marco/AAAA-MM-DD-antes-correcao-historico-do-movimento`, teste vermelho, correção, `code-review`, `/polir`. Sonnet; Opus se a causa não aparecer.
2. Nome do setor ao passar o mouse no selo da Lista, do verso e das linhas de grupo.
3. Manutenção sem mudança visual: dividir o `Quadro.css`, ADR das 12 cores do setor, `/impeccable document`.
4. Lentidão da primeira abertura da miniatura (backlog).

**Depende do usuário:** ver o app com o login real (critérios `[visual]` 14 a 18 do redesenho e a miniatura com um .png real); ler as "Decisões tomadas ao escrever esta seção" da spec de `processos-etapas` e o "Deixado como está" de `.scratch/redesenho-do-quadro/desvios.md`; conferir o Catálogo de etapas e escolher o responsável inicial de cada etapa.
