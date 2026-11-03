# Próximo passo (2026-11-03)

**Situação:** em andamento o `/planejar` em modo curto de `miniatura-rapida` (item 19 de `.scratch/projeto.md`; marco `marco/2026-11-02-inicio-miniatura-rapida`). Parado na pergunta 1, a medição que o usuário faz no app. Detalhe em `.scratch/handoff-2026-11-03.md`.

**Próximo comando:** sessão nova começando pelo `/situação` e depois `/planejar` continuando o modo curto de `miniatura-rapida`, a partir da resposta da medição (tempo, reabertura, tamanho do .png). Modelo: Sonnet (modo curto). Depois: `/executar-simples`, `/polir`, `/ship` (obrigatório: muda `supabase/functions/`).

**Adiados pelo usuário em 2026-11-02, cada um pelo `/demanda` quando ele pedir:**
1. Bug do histórico: os registros "Moveu o processo" não mostram "Moveu de {etapa} para {etapa}" (história 248 da spec de processos-etapas; texto fixo em `src/cadastros/historicoDosCadastros.ts:19`). Já classificado como bug; caminho: marco `marco/AAAA-MM-DD-antes-correcao-historico-do-movimento`, investigar a causa, teste vermelho, correção, `code-review`, `/polir`, `/ship` só se criar migração. Sonnet; Opus se a causa não aparecer na primeira investigação.
2. Nome do setor ao passar o mouse no selo da Lista, do cabeçalho do verso e das linhas de grupo.
3. Manutenção sem mudança visual: dividir o `Quadro.css` (544 linhas), ADR das 12 cores do setor, `/impeccable document` e as dívidas de padrão do redesenho.

**Depende do usuário:** abrir o app com o login real e ver o Quadro e o verso (critérios `[visual]` 14 a 18 do redesenho e a miniatura com um .png real); ler as "Decisões tomadas ao escrever esta seção, a confirmar na leitura" da spec de `processos-etapas` e o "Deixado como está" do `.scratch/redesenho-do-quadro/desvios.md`; conferir o Catálogo de etapas e escolher o responsável inicial de cada etapa.
