# 05: Registrar revisão e aprovação sem trava

**Como resolve a sua parte.** Sem o "Concluir", a revisão interna e a aprovação deixam de ter onde ser gravadas. Este ticket as traz de volta como registros na etapa, sem travar o movimento (ADR 0023):

- com o processo na Revisão interna, [Registrar revisão], com "sem alteração" ou "corrigida";
- com o processo na Aprovação pelo setor, [Registrar aprovação], com o E-protocolo opcional.

O autor da versão é avisado, mas não impedido. A aprovação nova toma o lugar da anterior. A versão aprovada continua sem arquivo substituído (ADR 0011).

**What to build:** os dois registros de ponta a ponta (banco, módulo de revisões, Agora, gaveta e testes).

- **Banco da revisão:**
  - `revisoes_internas.passagem_id`, preenchida pelo banco e única por passagem;
  - o resultado passa a ser editável;
  - as versões são recalculadas ao incluir e ao mudar o resultado: "corrigida" liga a versão enviada nesta passagem pela Revisão interna à anterior;
  - recusa fora da Revisão interna, sem versão, com a revisão já registrada na passagem e com o processo suspenso, cancelado, concluído ou arquivado;
  - sai a recusa do autor.
- **Banco da aprovação:**
  - `registrar_aprovacao`, que inclui ou toma o lugar da aprovação anterior (evento "Substituiu a aprovação", com o antes);
  - só na Aprovação pelo setor e com versão;
  - sem exigir a versão completa e sem a data contra a última revisão;
  - sem apagar.
- **Edição dos registros:** aceita no processo em andamento ou concluído e recusada no suspenso, no cancelado e no arquivado.
- **Módulo de revisões:** saem os "concluir"; entram `registrarRevisao` e `registrarAprovacao`; a edição da revisão leva o resultado; a falsa lê a passagem aberta da falsa de processos.
- **Agora:**
  - na Revisão interna, [Registrar revisão] ou [Editar revisão], com o resumo do registro da passagem;
  - na Aprovação, [Registrar aprovação] e, quando há, "V{n} aprovada" com [Editar aprovação];
  - as janelas reusam os campos de hoje, com o aviso do autor (amarelo) e o aviso de que a aprovação toma o lugar da anterior;
  - "Corrigida" fica desabilitada, com o motivo, sem versão enviada na passagem.
- **Gaveta:** as revisões de todas as passagens e a aprovação atual.
- **Histórico:** registrou e editou a revisão; registrou, substituiu e editou a aprovação.

Spec: `.scratch/revisoes-aprovacao/spec.md`, seção "Andamento livre (mudança de 2026-10-23)" (histórias 32 a 48).

**Branch:** `quadro-livre-parte-1`. A migração vai ao banco de desenvolvimento no ticket 04 de publicacao-e-arquivamento.

**Blocked by:** processos-etapas 25 (Tela do andamento livre).

**Status:** ready-for-agent

## Critérios de aceite

- [x] Testes pgTAP escritos antes da migração e vistos falhar: cada célula da tabela "quem pode o quê" e cada regra da seção Andamento livre. Inclui a revisão por passagem (segunda recusada, nova depois de sair e voltar), "corrigida" com e sem versão na passagem, o autor aceito, a aprovação substituída com o evento, mover sem mexer na aprovação, a edição em concluído aceita e no arquivado recusada, e nada apagado.
- [x] Os testes antigos `38` a `41` estão ajustados (Docker local: 1266 ok, 0 not ok); **o workflow "Testes de banco" na branch fica por conferir**.
- [x] Testes de interface com o aplicativo inteiro: os botões só na etapa certa, os dois resultados, "Corrigida" desabilitada e depois disponível, o aviso do autor, [Editar revisão], a aprovação substituindo a anterior com o aviso, a gaveta, a Consulta sem botões, o histórico, e a recusa e a falha sem perder o preenchido.
- [x] Os testes do módulo real com o cliente simulado provam as chamadas novas e as frases das recusas novas.
- [x] As funções puras (opções de resultado com a versão da passagem, aviso do autor) têm testes unitários.

Concluído em 2026-10-24 (commit d44976a)
