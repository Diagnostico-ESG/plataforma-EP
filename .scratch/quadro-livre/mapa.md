# Mapa: Quadro livre

Mapa da iniciativa (`wayfinder`), criado em 2026-10-23. Origem: `.scratch/quadro-livre/demanda.md` (texto do usuário). Esboço visual escolhido: `.scratch/quadro-livre/esboco-cartao.html`, opção A (dados inventados; a etiqueta "Não iniciado" do esboço passou a "A fazer" depois dele).

## Destination

As partes da iniciativa definidas e em ordem, com as decisões que valem para mais de uma parte já tomadas. Cada parte segue pelo `/planejar` como mudança em funcionalidade existente (sabatina, spec atualizada, tickets). O mapa não escreve spec nem código.

## Notes

- Inspiração: o Planner. A dinâmica entre etapas fica a cargo do combinado da equipe, não de travas da plataforma: quem termina marca Concluído, o próximo vê e pega o processo. É isso que dá sentido a acrescentar etapas ao catálogo.
- Cada parte atualiza a spec da funcionalidade que muda, com `Em revisão desde` nas já entregues, e continua a numeração de tickets da pasta dela.
- A produção ainda não existe: trocar o modelo só afeta dados inventados do desenvolvimento; toda remoção vai por migração nova.
- Os termos novos (Etiqueta, Responsável do processo, Não iniciados, mover entre etapas) e os ADRs que mudam (0012, 0014, 0016, 0020) são gravados na sabatina da parte 1, pelo `grill-with-docs`; o mapa só aponta.
- Vitrine local para ver telas sem login: `vitrine.local/` (fora do git), servida pelo `npx vite`.
- Skills da sabatina de cada parte: `grill-with-docs` (pelo `/planejar`).

## Partes, nesta ordem

1. **Andamento livre** (`processos-etapas`, `revisoes-aprovacao`, `publicacao-e-arquivamento`, `exportacao-e-manutencao`): primeira etapa Não iniciados (todo processo cadastrado entra nela) e Concluídos como etapa; o processo vai a qualquer etapa pela lista suspensa ou arrastando; etiquetas A fazer, Em andamento e Concluído, que voltam a A fazer ao mudar de etapa; um responsável do processo numa caixa simples (frente e verso, com a foto do Google); histórico de cada mudança de etapa, etiqueta e responsável; saem Iniciar/Concluir etapa, "Realizada anteriormente", dispensa, obrigatória/opcional, "Voltar com motivo" e a escolha "vai para publicação"; revisor igual ao autor da versão vira aviso; fases dos dashboards pela posição da etapa no catálogo.
2. **Cartão e verso** (`processos-etapas`): Data da modelagem piloto (vem com a data de hoje, editável) no lugar da reunião; nas visualizações que não são por etapa, barra em blocos com o nome da etapa e a posição ("4 de 8"); etiquetas em cor suave, sem azul; Anotações com o triplo da altura.
3. **Arquivos por etapa** (`documentos-versoes`, `revisoes-aprovacao`): cada etapa com os seus campos; as versões inseridas aparecem em todas as etapas. Não iniciados: versões F, opcionais. Modelagem piloto: versão P com o .bpm, número digitado maior que o da última F, com trava. Modelagem técnica e relatório: .bpm e .docx (não .pdf) em sequência sem letra, com trava. Revisão interna: nada obrigatório, numeração em sequência. Relatório com numeração própria (V1 se não houver anterior), ligado à versão que acompanha. Validação com o setor: só a data de aprovação (opcional). Aprovação: um .pdf protocolado (fluxo e relatório juntos, opcional) e o número do E-protocolo. Publicação: link opcional. Concluídos: nada. Sai a Observação; o formulário de enviar versão e de versão histórica abre e fecha e rola até aparecer inteiro.
4. **Outros anexos** (`documentos-versoes`): em todas as etapas; formatos comuns (.pdf, .docx, .xlsx, .png, .jpg, .eml); cada anexo marcado com a etapa em que entrou.
5. **Visualização por setores** (`processos-etapas`): uma coluna por setor; o cartão mostra a barra da etapa e a etiqueta.

## Decisions so far

- Etapa atual escolhida livremente, sem trava de sequência, sem motivo obrigatório; obrigatória/opcional e dispensa deixam de existir: rodada 1 do mapa (Q5).
- Etiqueta da etapa atual, não do processo; volta a A fazer ao mudar de etapa: Q3.
- Etiquetas A fazer, Em andamento e Concluído; a primeira etapa se chama Não iniciados: Q2 e Q13.
- Um responsável do processo, não por etapa; o histórico guarda quem esteve em cada etapa: Q4.
- Concluído é a etapa Concluídos, alcançada arrastando ou pela lista; o arquivamento continua igual: Q6.
- Revisão interna e Aprovação sem trava: E-protocolo e resultado da revisão viram campos; revisor igual ao autor vira aviso; ir para Publicação ou Concluídos é só mover: Q7.
- Fase do Regimento concluída quando o processo está numa etapa depois dela, ou na última etapa da fase com Concluído, ou em Concluídos: Q8.
- Etapa mostrada por barra em blocos com o nome e a posição, só nas visualizações que não são por etapa; etiqueta como bullet em cor suave; nada em azul (cor da plataforma): Q9, opção A do esboço.
- Suspender, cancelar, retomar e subprocessos ficam como estão: Q10.
- Trava só de arquivos, e só na Modelagem piloto (versão P) e na Modelagem técnica (.bpm e .docx): Q14.
- Cada tipo de versão é inserido na sua etapa e aparece em todas; número da P digitado e maior que o da última F; relatório com numeração própria ligada à versão: Q15.
- Validação com o setor guarda só a data de aprovação; envios e respostas continuam sem registro: Q16.
- Aprovação aceita só .pdf; outros anexos em formatos comuns, marcados com a etapa: Q17.

## Not yet specified

- **Parte 1:** como o histórico mostra os eventos antigos (iniciar, concluir, dispensar, realizada anteriormente); o que o catálogo de etapas da Administração perde sem obrigatória/opcional; a etapa Não iniciados e a Concluídos no catálogo (fixas ou editáveis); o que acontece com os dados do desenvolvimento ao trocar o modelo; o que a Consulta vê e faz.
- **Parte 2:** cores finais das etiquetas; o que a data da modelagem piloto mostra antes e depois de passar.
- **Parte 3:** o desenho fino das travas (o que aparece ao tentar mover sem o arquivo); a versão P em processos que já passaram da Modelagem piloto; como o relatório com numeração própria convive com "Sem alteração de conteúdo".
- **Parte 4:** tamanho máximo dos anexos; se um anexo se substitui ou se apaga; pasta no Drive.
- **Parte 5:** ordem das colunas; setores sem processo; arrastar entre setores (provavelmente não).

## Out of scope

- Prazos por etapa: v1.5 (backlog).
- Registro de cada envio ao setor e da resposta: continua fora (ADR 0012), só a data de aprovação entra.
