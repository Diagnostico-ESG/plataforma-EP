# Ticket 03 (Linhas, ícone por etapa e "Você"): plano de implementação

> **Para quem executa:** use superpowers:executing-plans, tarefa por tarefa. Marque as caixas ao terminar cada passo.

**Objetivo:** Linhas (Nenhuma | Setor | Responsável) no Quadro por etapa, ícone por etapa e "Você" no cartão.
**Requisitos:** ticket `issues/03-linhas-icone-por-etapa-e-voce.md` (critérios 1 a 12) e histórias 12 a 26, 49 a 52, 59 e 60 da seção "Redesenho do Quadro" de `.scratch/processos-etapas/spec.md`. Visual: `.scratch/proposta-visual/proposta-6.html` (`.grade`, `.rs`, `.gh`).
**Restrições:** sem banco, sem dependência, sem `any`; funções até 20 linhas, arquivos até 300, complexidade até 10.
**Arquitetura:** `linhas` entra no endereço (só Quadro por etapa). Lógica pura em `linhasDoQuadro.ts` (agrupa os processos de `colunasDoQuadro` em linhas). A matriz é um componente novo (`MatrizDoQuadro`) com grade CSS: cabeçalho das etapas uma vez, uma linha por grupo; cada célula reusa `ColunaDoQuadro` com a prop `linha`. Mover recarrega a lista, então o processo cai sozinho na linha certa (critério 8).

## Tarefa 1: endereço `linhas` e ícone por etapa (funções puras)
**Arquivos:** `src/processos/enderecoDosProcessos.ts`, `src/processos/iconeDaEtapa.ts` (novo), `src/components/Icone.tsx`; testes ao lado.
- `type LinhasDoQuadro = 'nenhuma' | 'setor' | 'responsavel'`; `EnderecoDosProcessos.linhas`; `?linhas=setor|responsavel` só com `visao: 'quadro'` e `agrupar: 'etapa'`; valor desconhecido = `nenhuma`; omitível ao montar.
- `iconeDaEtapa(codigo: string): NomeIcone`: oito códigos de `codigosDasEtapas.ts` têm ícone próprio; outro código recebe `etapaGenerica`.
- [x] Testes: ler/montar `linhas`; trocar de forma de ver descarta; `iconeDaEtapa` dos oito e de `qualquer`.
## Tarefa 2: agrupar em linhas (função pura)
**Arquivos:** `src/processos/linhasDoQuadro.ts`, `.test.ts`.
- `type LinhaDoQuadro = { chave: string; titulo: string; nome?: string; cor?: number; voce?: boolean; inativo?: boolean }`
- `linhasDoQuadro(tipo: 'setor' | 'responsavel', colunas: ColunaDoQuadro[], setores: SetorDoQuadro[], usuarioId: string): LinhaDoQuadro[]` — só linhas com cartão; setor por sigla; responsável por nome, "Sem responsável" (chave `sem-responsavel`) por último; `voce` para o usuário; `inativo` por `cartao.responsavelAtivo === false`.
- `chaveDaLinha(tipo, processo): string`.
- [x] Testes: ordem, vazias omitidas, Você, Inativo, Sem responsável por último.
## Tarefa 3: "Você" e cartão sem selo/responsável nas linhas
**Arquivos:** `CartaoDoProcesso.tsx`, `ColunaDoQuadro.tsx`, `QuadroDeProcessos.tsx`, `VisaoDosProcessos.tsx`; `src/App.cartaoDoQuadro.test.tsx`.
- Props novas do cartão: `usuarioId: string`, `naLinha?: 'setor' | 'responsavel'`.
- [x] Teste de tela: cartão do usuário mostra "Você"; de outra pessoa, o nome; sem contador de arquivos e sem prazo.
## Tarefa 4: ícone no cabeçalho da coluna e no verso
**Arquivos:** `ColunaDoQuadro.tsx` (cabeçalho extraído em `CabecalhoDaColuna`), `EtapasDoProcesso.tsx`, `Etapas.css`, `Quadro.css`.
- [x] Teste de tela: coluna de etapa fixa e etapa nova do catálogo têm `svg[aria-hidden]` no título; etapas do verso também.
## Tarefa 5: interruptor Linhas e matriz
**Arquivos:** `FaixaDeControles.tsx` (prop `linhas`), `ControlesDoQuadro.tsx` (exportar `LinhasDoQuadro`), `VisaoDosProcessos.tsx`, `AreaDeProcessos.tsx`, `MatrizDoQuadro.tsx` (novo), `Quadro.css`; `src/App.linhasDoQuadro.test.tsx` (novo).
- Linhas só no Quadro por etapa; padrão Nenhuma = quadro de hoje; escolha no endereço.
- Matriz: cabeçalho (ícone, nome, contagem) uma vez; linha com setinha (`aria-expanded`, recolhe/abre, recarregar abre todas), selo ou nome, contagem; só linhas com cartão; filtros vazios = frase dos filtros (já existente).
- Arrastar: célula só recebe cartão da própria linha; soltar em outra mostra "Solte o cartão na mesma linha." e não grava; Concluídos nas linhas com Tirar do Quadro; pé "fora do Quadro" no cabeçalho de Concluídos.
- [x] Testes de tela: um por critério (1 a 8 do ticket), incluindo mover e reaparecer na linha do responsável inicial do destino.
## Tarefa 6: fechamento
- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`; conferir no navegador; commit.

## Pontos de atenção
1. Consulta: vê Linhas, não arrasta. 2. `destacar` continua valendo nas linhas. 3. Setor inativo com cartão ainda gera linha.
