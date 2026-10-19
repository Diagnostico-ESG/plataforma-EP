# Mapa: Experiência do quadro

Mapa da iniciativa (`wayfinder`), criado em 2026-10-17. Origem: `.scratch/analise-experiencia-2026-10-17.md`.

## Destination

As partes da iniciativa definidas e em ordem, com as decisões que valem para mais de uma parte já tomadas. Cada parte segue pelo `/planejar` como mudança em funcionalidade existente (sabatina, spec atualizada, tickets). O mapa não escreve spec nem código.

## Notes

- Público: equipe do EP avessa a burocracia, que precisa ver vantagem clara sobre planilha e e-mail. Regra de desenho: o normal fica limpo; só o que foge do normal ganha cor ou selo; ações raras ficam em menu.
- Cada parte atualiza a spec da funcionalidade que muda (`processos-etapas`, `reunioes`, `revisoes-aprovacao`), com `Em revisão desde` nas já entregues, e continua a numeração de tickets da pasta dela.
- A produção ainda não existe: remover estrutura só perde dados inventados do desenvolvimento; toda remoção vai por migração nova.
- Vitrine local para ver telas sem login: `vitrine.local/` (fora do git), servida pelo `npx vite`.
- Skills da sabatina de cada parte: `grill-with-docs` (pelo `/planejar`).

## Partes, nesta ordem

1. **Simplificação** (`processos-etapas`, `reunioes`): saem as três etapas do setor e a coluna "Aguardando o setor", a reunião de sensibilização, os responsáveis do setor e a área de Reuniões; a reunião vira só uma data marcada no processo (uma marcação por processo, datas futuras valem); a primeira etapa passa a se chamar Modelagem piloto.
2. **Etapas mais rápidas** (`processos-etapas`): concluir abre "Quem fica com a próxima etapa?" (a própria pessoa marcada, opção "Ninguém por enquanto", sem o autor da versão na revisão interna, sem janela na última etapa) e já inicia a seguinte; dispensar e "realizada anteriormente" avançam igual; [Assumir] em qualquer etapa sem responsável; qualquer integrante atribui qualquer etapa a qualquer membro.
3. **Verso do cartão** (`processos-etapas`): janela central de duas colunas no lugar do painel lateral; Novo processo na mesma janela; histórico e ações raras (Editar, Reclassificar, Suspender, Cancelar, Excluir) no "⋯"; versão mais recente em destaque, anteriores recolhidas; reuniões como lista de datas com marcação rápida; a Lista ganha busca por nome e abre o verso (é o repositório dos concluídos).
4. **Cartão do Quadro** (`processos-etapas`): barra de progresso, selos só quando há algo a dizer (dias na etapa com limite único de 15, versão, pendência, próxima reunião, subprocessos), arrastar uma coluna à frente conclui a etapa (abre a janela da parte 2), "Agrupar por: Etapa | Responsável" (sem arrastar) e "Só os meus".
5. **Revisões e aprovação** (`revisoes-aprovacao`): spec revista antes de qualquer código; o [Concluir] pede o resultado da revisão ou o número do E-protocolo na mesma janela; quem enviou a versão mais recente não pode revisá-la; construída já dentro do verso.

## Decisions so far

- Detalhe do processo em janela central (verso do cartão), não expandido na coluna nem no painel lateral: `analise-experiencia-2026-10-17.md`, "Onde abre o detalhe".
- Reunião só com a data, marcada em cada processo tratado; sem local, hora, participantes e anotações; sem área própria: `CONTEXT.md`, "Reunião".
- Etapas do setor, sensibilização e responsáveis do setor fora da plataforma (já feitas para todos os setores): `CONTEXT.md`, "Catálogo de etapas".
- Primeira etapa renomeada para Modelagem piloto: `CONTEXT.md`, "Modelagem piloto".
- Quem conclui escolhe o responsável da próxima; qualquer integrante atribui a qualquer membro: `CONTEXT.md`, "Responsável da etapa".
- "Capturar" vira "Assumir", em qualquer etapa: `CONTEXT.md`, "Assumir".
- Quem enviou a versão não pode revisá-la (não "o responsável da etapa anterior"); a restrição vale só para a revisão interna, porque o setor não revisa, aponta o que mudar e o EP muda: `CONTEXT.md`, "Revisor".
- Concluídos ficam na Lista, que ganha busca e abre o verso: parte 3.
- Lista mantida; Quadro e Lista continuam lado a lado.

## Not yet specified

- **Parte 1:** o que acontece com o processo que tem reunião marcada ao ser excluído; como o histórico mostra os eventos antigos de etapas do setor e de reuniões removidos; o que muda no catálogo de etapas da Administração sem o nível "setor".
- **Parte 2:** resolvido na sabatina de 2026-10-18 (`sabatina-parte-2.md`, ADR 0014).
- **Parte 3:** o desenho fino das duas colunas; o que a Consulta vê; a busca da Lista (só nome ou também setor).
- **Parte 4:** resolvido na sabatina de 2026-10-19 (`sabatina-parte-4.md`, sem ADR).
- **Parte 5:** resolvido no `/planejar` de 2026-10-19 (`revisoes-aprovacao/sabatina.md`, revisão de 2026-10-19; ADR 0015).

## Out of scope

- Tela separada de concluídos: a Lista cumpre o papel (P17).
- Área própria de Reuniões: entra só se fizer falta no futuro (decisão do usuário).
- Prazos por etapa: v1.5; o limite de "parado" é um número único por enquanto.
