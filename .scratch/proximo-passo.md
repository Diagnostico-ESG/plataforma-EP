# Próximo passo (2026-11-03)

**Situação:** o `/planejar` em modo curto de `miniatura-rapida` (item 19 de `.scratch/projeto.md`) terminou. Spec de processos-etapas atualizada (com `Em revisão desde 2026-11-03`) e ADR 0038 gravado: miniatura guardada na memória do app até recarregar; conferência da raiz na função `arquivos-no-drive` lembra pasta confirmada por 5 minutos (só resposta positiva). Sem B (imagem reduzida do Drive).

**Próximo comando:** sessão nova (Sonnet) começando pelo `/situação` e depois `/executar-simples` para `miniatura-rapida` (critério 12 e a seção Miniatura da spec). Depois: `/polir` e `/ship` (obrigatório: muda `supabase/functions/` e pede revisão de segurança; a função precisa ser publicada de novo no desenvolvimento).

**Adiados pelo usuário, cada um pelo `/demanda` quando ele pedir:**
1. Bug do histórico: os registros "Moveu o processo" não mostram "Moveu de {etapa} para {etapa}" (`src/cadastros/historicoDosCadastros.ts:19`). Marco `marco/AAAA-MM-DD-antes-correcao-historico-do-movimento`, teste vermelho, correção, `code-review`, `/polir`. Sonnet; Opus se a causa não aparecer.
2. Nome do setor ao passar o mouse no selo da Lista, do verso e das linhas de grupo.
3. Manutenção sem mudança visual: dividir o `Quadro.css`, ADR das 12 cores do setor, `/impeccable document`.

**Depende do usuário:** ver o app com o login real (critérios `[visual]` 14 a 18 do redesenho e a miniatura com um .png real); ler as "Decisões tomadas ao escrever esta seção" da spec de `processos-etapas` e o "Deixado como está" de `.scratch/redesenho-do-quadro/desvios.md`; conferir o Catálogo de etapas e escolher o responsável inicial de cada etapa. Opcional: tempo de execução da função nos logs do Supabase, para separar o custo fixo de 1,5 s (login, banco, rede).
