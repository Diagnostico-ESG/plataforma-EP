# Próximo passo (2026-11-02)

**Situação:** todas as funcionalidades da v1 estão entregues; as seis migrações sem registro foram conferidas e registradas no `supabase/AMBIENTES.md`; a tabela de `.scratch/proposta-visual/decisoes.md` foi atualizada depois da entrega do `redesenho-do-quadro`.

**Próximo comando:** `/demanda` (Opus para classificar), começando pelo possível defeito do histórico: os registros "Moveu o processo" não mostram a etapa de origem e a de destino (visto em 2026-10-30, causa não investigada). Se for bug, segue em Sonnet (Opus se a causa não aparecer na primeira investigação).

**Depois, nesta ordem, cada um pelo `/demanda`:**
1. Nome do setor ao passar o mouse no selo da Lista, do cabeçalho do verso e das linhas de grupo (a view dos processos não traz o nome do setor).
2. Manutenção sem mudança visual: dividir o `Quadro.css` (544 linhas), ADR das 12 cores do setor, `/impeccable document` e as dívidas de padrão do redesenho (backlog, 2026-11-02).
3. Contador de arquivos no cartão (exige migração; backlog). O prazo no cartão fica para a v1.5.

**Depende do usuário:** abrir o app com o login real e ver o Quadro e o verso (critérios `[visual]` 14 a 18 do redesenho e a miniatura com um .png real); ler as "Decisões tomadas ao escrever esta seção, a confirmar na leitura" da seção Redesenho do Quadro da spec de `processos-etapas` e os itens "Deixado como está" do `.scratch/redesenho-do-quadro/desvios.md`; conferir o Catálogo de etapas e escolher o responsável inicial de cada etapa.
