# Próximo passo (2026-11-03)

**Situação:** `miniatura-rapida` (item 19) implementada no commit 5d8a729: miniatura guardada na memória do app (`src/hooks/useImagemDoArquivo.ts`) e conferência da raiz com memória de 5 minutos na função `arquivos-no-drive` (`supabase/functions/_shared/raiz.ts`, ligada em `pastas.ts`). Spec de processos-etapas com `Em revisão desde` e `Implementado em`; ADR 0038. Falta `/polir` e `/ship`.

**Próximo comando:** `/polir` (Sonnet; mexeu pouco na interface, só o comportamento da miniatura, então pode ser rápido) e depois `/ship` (Sonnet; Opus na revisão de segurança). O `/ship` é obrigatório: muda `supabase/functions/` e pede revisão de segurança; olhar em especial que a tolerância de 5 minutos da pasta lembrada também vale nos caminhos de escrita (renumerar, garantir pasta). A função precisa ser publicada de novo no desenvolvimento (`functions deploy --use-api`, com o vínculo conferido e a aprovação do usuário). Conferir o ganho de tempo no app, com o mesmo .png de 396 KB.

**Adiados pelo usuário, cada um pelo `/demanda` quando ele pedir:**
1. Bug do histórico: os registros "Moveu o processo" não mostram "Moveu de {etapa} para {etapa}" (`src/cadastros/historicoDosCadastros.ts:19`). Marco `marco/AAAA-MM-DD-antes-correcao-historico-do-movimento`, teste vermelho, correção, `code-review`, `/polir`. Sonnet; Opus se a causa não aparecer.
2. Nome do setor ao passar o mouse no selo da Lista, do verso e das linhas de grupo.
3. Manutenção sem mudança visual: dividir o `Quadro.css`, ADR das 12 cores do setor, `/impeccable document`.

**Depende do usuário:** ver o app com o login real (critérios `[visual]` 14 a 18 do redesenho e a miniatura com um .png real); ler as "Decisões tomadas ao escrever esta seção" da spec de `processos-etapas` e o "Deixado como está" de `.scratch/redesenho-do-quadro/desvios.md`; conferir o Catálogo de etapas e escolher o responsável inicial de cada etapa.
