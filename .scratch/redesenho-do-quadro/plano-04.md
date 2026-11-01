# Ticket 04 (verso enxuto): plano de implementação

> **Para quem executa:** use superpowers:executing-plans, tarefa por tarefa. Marque as caixas ao terminar cada passo.

**Objetivo:** refazer o verso no desenho da verso-3, dentro da janela fixa de 880 × 740, reaproveitando os blocos que já existem.
**Requisitos:** ticket `issues/04-verso-enxuto.md` (critérios 1 a 12) e histórias 61 a 74 da seção "Redesenho do Quadro" de `.scratch/processos-etapas/spec.md`. Visual: `.scratch/proposta-visual/verso-3.html` e `verso-3-fechado.png`.
**Restrições:** sem banco, sem dependência, sem `any`; funções até 20 linhas, arquivos até 300, complexidade até 10; o que o verso faz não muda.
**Arquitetura:** a ordem do corpo do verso passa a ser: cabeçalho fixo (selo, nome, ação principal, "···", fechar) com a linha de dados; e, na área que rola, trilha, Agora (linha + avisos + campos da etapa) e o par versão/Anotações. A trilha continua a lista de etapas com a gaveta dentro do `<li>` (os testes dependem disso): só o CSS a deixa horizontal e põe a gaveta como painel flutuante. A ação principal sai do Agora e vai para o cabeçalho (componente novo `AcaoPrincipalDoVerso`); o resto (resumo, Editar revisão/aprovação, Corrigir publicação) fica no Agora, na linha dos campos.

## Decisões deste plano (a conferir pelo usuário)
1. O seletor "Etapa" do Agora mantém o rótulo "Etapa" (a história 66 chama de [Mover para]): trocar o texto quebraria a leitura de tela e os testes sem ganho.
2. "Registrar revisão" aparece no cabeçalho só enquanto a passagem não tem revisão; com revisão, o `[Editar revisão]` fica na linha dos campos. "Registrar aprovação" aparece sempre na Aprovação pelo setor (como hoje).
3. A Data da modelagem piloto vai para a linha dos campos quando a Modelagem piloto é a etapa atual; fora dela, continua na linha da etapa.
4. Os testes que achavam o botão "Registrar …" dentro do Agora passam a achá-lo no verso (o botão mudou de lugar; o comportamento é o mesmo).

## Tarefa 1: ação principal da etapa (função pura)
**Arquivos:** `src/processos/acaoPrincipalDaEtapa.ts` (novo) e `.test.ts`.
- `type AcaoPrincipal = 'registrar_revisao' | 'registrar_aprovacao' | 'registrar_publicacao'`
- `acaoPrincipalDaEtapa(processo: ProcessoLido, podeAlterar: boolean, temRevisaoDaPassagem: boolean): AcaoPrincipal | null` — `null` se não pode alterar ou se o processo está suspenso/cancelado; Revisão interna sem revisão da passagem → revisão; Aprovação pelo setor → aprovação; Publicação e Concluídos com `acaoDaPublicacao(processo) === 'registrar'` → publicação; o resto `null`.
- [x] Testes: uma linha por etapa, Consulta, suspenso, revisão já registrada, concluído já publicado (`corrigir` → `null`).

## Tarefa 2: ação principal no cabeçalho
**Arquivos:** `AcaoPrincipalDoVerso.tsx` (novo), `CabecalhoDoVerso.tsx`, `VersoDoCartao.tsx`, `RegistrosDoAgora.tsx`, `AgoraDaPublicacao.tsx`, `AgoraDoConcluido.tsx`; `src/App.versoEnxuto.test.tsx` (novo).
- `useRegistrosDoProcesso` sobe de `ColunasDoVerso` para `ProcessoAberto`, que passa `registros` ao cabeçalho e ao corpo.
- `AcaoPrincipalDoVerso({ processo, processos, revisoes, versoes, registros, usuarioId, podeAlterar, aoMudar })`: botão `botao-principal` com o rótulo da ação e a janela de registro (`JanelaDeRegistroDaRevisao`, `JanelaDeRegistroDaAprovacao`, `JanelaDaPublicacao`).
- `RevisaoDoAgora`, `AprovacaoDoAgora` e `BotaoDaPublicacao` perdem o botão "Registrar …"; ficam o resumo e os "Editar …"/"Corrigir publicação".
- [x] Testes de tela (novos): cada etapa mostra o botão azul no cabeçalho (`banner`/`header`) e só nela; as outras etapas não têm botão azul; Consulta não tem.
- [x] Ajustar os testes de `registrarRevisao`, `registrarAprovacao`, `registrarPublicacao` e afins para achar o botão no verso.

## Tarefa 3: linha de dados
**Arquivos:** `LinhaDeDadosDoVerso.tsx` (novo; usa `EstruturaDoProcesso` reaproveitado), `CabecalhoDoVerso.tsx`, `SobreDoProcesso.tsx` (sai), `VersoDoCartao.tsx`; testes `contextoDoVerso`, `subprocessos`, `reclassificar`, `cadastrarProcesso`, `recursosRetirados`, `versoDoCartao`.
- Região "Dados do processo" abaixo do nome: setor, macroprocesso (se houver), tipo, situação. Subprocesso: "Subprocesso de {pai}" com o pai como link; processo com subprocessos: botão "Subprocessos (n)" que abre a lista de links na mesma janela; o clique confere as anotações antes (`saida.sair`), como hoje.
- [x] Testes: dados de processo, de subprocesso e de processo com subprocessos; o clique no pai abre o pai.

## Tarefa 4: Agora em linhas, trilha horizontal e janela fixa
**Arquivos:** `CorpoDoAgora.tsx`, `AgoraDoProcesso.tsx`, `Agora.css`, `Etapas.css`, `Verso.css`, `EtapasDoProcesso.tsx`, `VersoDoCartao.tsx` (substitui `verso-colunas`), `DataDaModelagemPiloto` (posição).
- Ordem do Agora: linha (etapa, etiqueta, responsável com Trocar) → avisos lado a lado (selo de parado e aviso do revisor, em grade de 2 colunas) → campos da etapa (registros, publicação, concluído, Data da modelagem piloto atual).
- Janela: altura fixa (`height: min(740px, 94vh)`), cabeçalho fixo e `.verso-corpo` com `overflow-y: auto`.
- Trilha: `.etapas-lista` em linha, ícone em círculo, nome e data embaixo; a gaveta aberta é painel flutuante largo sob a trilha.
- [x] Testes: os de `agoraDoVerso`, `etapasDoVerso`, `dataDaModelagemPiloto` continuam passando; um teste novo para os campos da etapa só quando a etapa os tem.

## Tarefa 5: corpo — versão e Anotações lado a lado, anteriores e anexos recolhidos
**Arquivos:** `SecaoDeVersoes.tsx`, `VersaoEmDestaque.tsx`, `VersaoEmDestaque.css`, `SecaoDeAnexos.tsx`, `Anotacoes.css`, `BlocoDasAnotacoes.tsx`, `Verso.css`.
- Versão em destaque: quadro com o ícone do fluxograma no lugar da miniatura (o ticket 05 troca pela imagem) e os arquivos em lista vertical com `SeloDoTipoDeArquivo`; sem versão: "Nenhuma versão enviada ainda" e `[Enviar versão]` quando permitido.
- "Versões anteriores (n)" e "Outros anexos (n)" recolhidos (`<details>`) lado a lado; o conteúdo continua como hoje.
- Anotações ao lado da versão, com o dobro da altura de hoje (campo mínimo de 21em).
- [x] Testes: "Nenhuma versão enviada ainda"; anexos recolhidos com contagem e abrindo; Consulta sem `[Enviar versão]` e com Anotações só leitura; ajustar `versoesNoProcesso`, `anexos*`, `conferenciaNoDrive`, `versaoPiloto`, `registrarVersaoHistorica`.

## Tarefa 6: fechamento
- [x] `npm test`, `npx tsc -b`, `npm run lint`; conferir no navegador (vitrine local) a 1366×768 que nada vaza da janela; commit.

## Pontos de atenção
1. Consulta vê o verso inteiro, sem ação principal. 2. Histórico e Editar continuam trocando o conteúdo da janela. 3. A função `arquivos-no-drive` não muda neste ticket.

## Registro da execução (2026-11-01)
- Rulings: (a) a pílula de situação saiu do cabeçalho do verso: a situação passou para a linha de dados e o ticket não lista pílula no cabeçalho; (b) o seletor "Etapa" do Agora manteve o rótulo "Etapa" (decisão 1); (c) "Registrar revisão" só aparece no cabeçalho sem revisão na passagem (decisão 2); (d) os "Versões anteriores" e "Outros anexos" ficaram empilhados e recolhidos, não lado a lado como na verso-3 (a verso-3 os põe em duas colunas; cabem na janela fixa empilhados, e o corpo rola por dentro); (e) a gaveta de uma etapa aberta flutua sobre o Agora, sem empurrar o resto.
- Testes: a suíte inteira passou (262 arquivos, 3350 testes), com `tsc -b` e `eslint src` limpos. Os testes de registrar revisão, aprovação e publicação, de Sobre, de Anotações, de data da modelagem piloto, do cabeçalho e de "Nenhuma versão enviada ainda" foram ajustados ao lugar novo (o comportamento é o mesmo).
- `[visual]`: visto na vitrine local (módulos falsos) a 1366×768: janela de 880 × 722, corpo rolando por dentro, nada vazando; Anotações com 310 px (o dobro dos 163 px de antes). Não visto com o login real.
