# Sabatina de travas-em-avisos (2026-10-27)

Decisões do `grill-with-docs`, para o `to-spec`. O porquê está no ADR 0028; os termos, no `CONTEXT.md` (Confirmação de arquivos, Editar número da versão, versão mais recente).

## 1. Trava do autor na Revisão interna

- Já saiu em 2026-10-23 (ADR 0023, migração `20261024182706`); o gatilho antigo sumiu com a tabela `andamentos`. Hoje há só avisos amarelos (`avisoDoAutorDaRevisao` em `src/revisoes/opcoesDaRevisao.ts` e o aviso de `src/processos/agoraDoProcesso.ts`).
- Fica como está (Q1). Sai só a sobra: a recusa `autor_da_versao` em `src/processos/recusasDoBanco.ts` e `fraseDoAutorDaVersao` em `src/processos/frasesDeVersao.ts`.

## 2. Confirmação de arquivos (no lugar da trava)

- Mesmas etapas e mesmos arquivos de hoje (`private.arquivos_que_faltam`, migração `20261026154356`): sair para a frente da Modelagem piloto sem versão piloto (ou em sequência); sair para a frente da Relatório e modelagem técnica sem versão em sequência e relatório numerado. Voltar, a mesma etapa, processo que já estava adiante e etapa desativada não perguntam.
- Texto por etapa (Q2): "**Faltam os arquivos da Modelagem piloto.** Este processo ainda não tem a versão piloto…" e "**Faltam os arquivos da Modelagem técnica.** Este processo ainda não tem o fluxograma nem o relatório desta etapa. Você pode avançar agora e enviá-los depois." Ida que atravessa as duas: uma pergunta só, com a lista de tudo o que falta.
- Botões: [Enviar arquivos agora] [Avançar mesmo assim] [Cancelar]. "Enviar agora" reaproveita a janela de envio atual (`JanelaDaTrava.tsx`, `moverDepoisDoEnvio.ts`); depois do envio, se ainda faltar algo, a confirmação volta só com o que sobrou (Q3).
- Banco: `mover_processo` deixa de chamar a recusa; o evento do movimento ganha o que faltava, calculado pelo banco. Histórico mostra "Moveu para Revisão interna sem o relatório". Sem marca no cartão (Q4).

## 3. Editar número da versão

- Só o número; o tipo (F, P, em sequência) não muda (Q5). "T" da demanda = versão em sequência, sem letra no rótulo (Q6).
- Qualquer versão, inclusive histórica e aprovada (Q11). Na aprovada, o aviso lembra que o E-protocolo cita o número antigo.
- Administrador e Integrante do EP, com o processo em andamento (mesma regra de enviar e substituir arquivo, `private.conferir_processo_que_recebe_versao`) (Q12).
- Número repetido no processo continua recusado (restrição `versoes_numero_unico`) (Q9).
- Aviso antes de gravar, sem impedir (Q13), quando, pela ordem do número: a ordem dos tipos não é histórica → piloto → em sequência; ou uma versão em sequência não vem logo depois da anterior (salto). Históricas e piloto podem ter saltos entre si. Ex.: "A V9 ficará depois da V7, sem a V8. Gravar assim mesmo?" [Gravar] [Cancelar].
- Versão mais recente continua a de maior número, fora as históricas (Q7); a edição pode mudá-la. A próxima em sequência segue maior + 1.
- Onde: um "⋯" ao lado do rótulo de cada versão, com o item **Editar número** (reaproveita `MenuDeAcoes`); sem motivo (Q14).
- Drive: os arquivos da versão são renomeados para o número novo; tudo ou nada (se algo falha, os nomes voltam e o número fica) (Q8, Q16).
- Histórico: "Alterou o número da V7 para V5", com antes e depois.
- Regras do envio continuam recusando (piloto maior que todas, histórica só em Não iniciados e antes de piloto, piloto antes de versão em sequência) (Q15).
- Número do relatório fica fora: backlog (Q10).

## Specs que mudam

- `processos-etapas` (confirmação ao mover), `documentos-versoes` (confirmação, edição do número), `revisoes-aprovacao` (sobra do autor). Cada uma ganha `Em revisão desde 2026-10-27` abaixo do `Entregue em`.
