# 04: Chegada a Concluídos, publicação, arquivamento e integração

**Como resolve a sua parte.** Concluídos virou uma etapa, e o processo chega lá movido. Para não contar como publicado o que não foi, a chegada pede a data da publicação ou a explicação de concluir sem publicação (ADR 0024). A data também se registra antes, na etapa Publicação, ou depois, mesmo no arquivado. O processo suspenso ou cancelado passa a poder ser arquivado, guardando a situação e a etapa.

Este é o último ticket da parte 1. Ele aplica as migrações da branch no banco de desenvolvimento, confere tudo na tela e leva o Andamento livre para a `main`.

**What to build:**

- **Janela de chegada a Concluídos** (pela lista do Agora e pelo arrastar, sem a data já registrada):
  - "Publicado", com a Data e o Link, ou "Concluir sem publicação", com a Explicação obrigatória;
  - o botão fica desabilitado até a opção escolhida estar completa;
  - Esc e [Cancelar] devolvem o cartão;
  - a recusa e a falha aparecem em vermelho, sem perder o preenchido;
  - grava por mover o processo (ticket 24).
- **Registrar publicação:**
  - `registrar_publicacao(processo, data, link)`, na Publicação ou em Concluídos e, no arquivado, só sem data;
  - a janela troca a Nota pelo Link e ganha o modo [Corrigir publicação], fora do arquivado;
  - o botão aparece na Publicação, em Concluídos sem publicação e no arquivado sem publicação.
- **Agora em Concluídos:** "Concluído · Publicado em dd/mm/aaaa" (com o link) ou "Concluído sem publicação: {explicação}", com [Arquivar] como principal.
- **Arquivar e desarquivar:**
  - arquivar aceita o processo concluído, suspenso ou cancelado;
  - o verso do suspenso e do cancelado traz [Arquivar];
  - a Lista mostra "Arquivado · {situação}";
  - desarquivar devolve a situação e a etapa;
  - o arquivado só registra a publicação e desarquiva;
  - a trava vale também nas passagens e no responsável.
- **O que sai:** a pergunta "Vai para publicação?", "Não vai mais para publicação", o aviso de escolha apagada e o selo "Não publicado". `App.escolhaDePublicacao` e `App.naoVaiMaisParaPublicacao` são apagados.
- **Histórico:** concluiu sem publicação (com a explicação), registrou e corrigiu a publicação, arquivou e desarquivou.
- **Integração:**
  - aplicar no banco de desenvolvimento, em ordem, as migrações da branch (tickets 24, 05 de revisoes-aprovacao, 06 de exportacao-e-manutencao e esta), pelo workflow "Migrar banco de desenvolvimento", e registrá-las em `supabase/AMBIENTES.md`;
  - regenerar os tipos;
  - conferir na tela, com o login real: mover pela lista e arrastando, etiqueta, responsável, revisão, aprovação, chegada a Concluídos, arquivar e desarquivar;
  - pedir ao usuário que republique a função `planilhas-dos-dashboards` e atualizar as planilhas pela aba Planilhas;
  - levar a branch `quadro-livre-parte-1` para a `main`, sem `--force`.

Spec: `.scratch/publicacao-e-arquivamento/spec.md`, seção "Andamento livre (mudança de 2026-10-23)" (histórias 46 a 63).

**Branch:** `quadro-livre-parte-1`, que termina neste ticket.

**Blocked by:** processos-etapas 25 (Tela do andamento livre), revisoes-aprovacao 05 (Registrar revisão e aprovação sem trava) e exportacao-e-manutencao 06 (Planilhas pela posição no catálogo).

**Status:** ready-for-agent

## Critérios de aceite

- [x] Testes pgTAP escritos antes e vistos falhar: cada célula e cada regra da seção Andamento livre. Inclui registrar publicação na Publicação, em Concluídos e no arquivado (com e sem data), a data futura ou antes da aprovação, o link fora de `http(s)`, arquivar suspenso e cancelado, desarquivar como estava, o arquivado sem mover, sem etiqueta, sem responsável e sem Anotações, e as colunas só pelas funções. Os testes `48` e `49` estão ajustados.
- [x] Testes de interface com o aplicativo inteiro: a janela de chegada pela lista e pelo arrastar (botão desabilitado, as duas opções, Esc com o cartão de volta, ida direta com a data registrada); registrar e corrigir a publicação; sair de Concluídos apagando a explicação; o Agora de Concluídos; o selo "Sem publicação"; arquivar o suspenso e o cancelado; a Lista com "Arquivado · {situação}"; desarquivar; Consulta sem botões.
- [x] Os testes do módulo real com o cliente simulado provam mover com os dados da chegada, `registrarPublicacao` com o link e as frases novas.
- [x] O workflow "Testes de banco" passa na branch inteira.
- [x] As migrações foram aplicadas no desenvolvimento pelo workflow (com o alvo conferido) e registradas em `AMBIENTES.md`.
- [ ] A conferência na tela está feita, com o que foi visto e o que foi presumido anotado no plano.
- [x] A branch foi levada à `main` e enviada ao GitHub, e o "Testes de banco" passa na `main`.

Concluído em 2026-10-24 (commit 80781d1)
