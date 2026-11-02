# Próximo passo (2026-11-02)

**Situação:** o contador de arquivos (📎) foi descartado no `/planejar` de 2026-11-02 (registrado no `decisoes.md` e no backlog; marco `marco/2026-11-02-inicio-contador-de-arquivos` ficou sem uso). Todas as funcionalidades da v1 estão entregues; as seis migrações sem registro foram conferidas e registradas no `supabase/AMBIENTES.md`; a tabela de `.scratch/proposta-visual/decisoes.md` foi atualizada depois da entrega do `redesenho-do-quadro`.

**Próximo comando:** sessão nova com **Sonnet**, começando pelo `/situação`, e depois pedir: `corrigir o bug pelo caminho do /demanda: no histórico do processo, os registros "Moveu o processo" não mostram "Moveu de {etapa} para {etapa}" (história 248 da spec de processos-etapas, seção Andamento livre); texto fixo em src/cadastros/historicoDosCadastros.ts:19`. Classificado no `/demanda` de 2026-11-02 como **bug** (a spec pede de → para; o código tem o texto fixo), caminho confirmado pelo usuário: marco `marco/2026-11-02-antes-correcao-historico-do-movimento`, investigar a causa (tela que não lê as etapas gravadas no evento, ou banco que não as grava), teste vermelho, correção, `code-review`, `/polir`, `/ship` só se criar migração. Se a causa não aparecer na primeira investigação, registrar no backlog e retomar em Opus.

**Depois, nesta ordem, cada um pelo `/demanda`:**
1. Nome do setor ao passar o mouse no selo da Lista, do cabeçalho do verso e das linhas de grupo (a view dos processos não traz o nome do setor).
2. Manutenção sem mudança visual: dividir o `Quadro.css` (544 linhas), ADR das 12 cores do setor, `/impeccable document` e as dívidas de padrão do redesenho (backlog, 2026-11-02).
O contador de arquivos no cartão foi descartado em 2026-11-02 (no `/planejar` em modo curto: repetiria informação do cartão). O prazo no cartão fica para a v1.5.

**Depende do usuário:** abrir o app com o login real e ver o Quadro e o verso (critérios `[visual]` 14 a 18 do redesenho e a miniatura com um .png real); ler as "Decisões tomadas ao escrever esta seção, a confirmar na leitura" da seção Redesenho do Quadro da spec de `processos-etapas` e os itens "Deixado como está" do `.scratch/redesenho-do-quadro/desvios.md`; conferir o Catálogo de etapas e escolher o responsável inicial de cada etapa.
