# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-26 (`/planejar` da parte 3 do quadro-livre, Arquivos por etapa: spec escrita pelo `to-spec`)

- **Feito:** sabatina (commit `6340ffa`) e spec. A spec ficou em duas seções novas: "Arquivos por etapa" em `.scratch/documentos-versoes/spec.md` (versão piloto, versão em sequência, relatório numerado, acrescentar .png/.bpmn, trava de arquivos, função do servidor) e "Data da validação e .pdf da aprovação" em `.scratch/revisoes-aprovacao/spec.md`. As duas specs ganharam `Em revisão desde 2026-10-26`. A spec de `processos-etapas` não foi alterada; a trava no movimento está descrita na de documentos-versoes.
- **Próximo comando:** `/mattpocock-skills:to-tickets` (Opus), que o usuário roda; a parte tem várias entregas (banco e numeração, relatório, trava, data da validação, .pdf da aprovação). Os tickets continuam a numeração de cada pasta (documentos-versoes a partir de 09, revisoes-aprovacao a partir de 06).
- **Pendente do usuário:** ler as "Decisões tomadas ao escrever esta seção, a confirmar na leitura" das duas seções novas (10 em documentos-versoes, 5 em revisoes-aprovacao); conferir na tela os critérios `[visual]` do ticket 27 de processos-etapas; republicar a Edge Function `planilhas-dos-dashboards` no desenvolvimento; apagar ou refazer o handoff antigo `.scratch/handoff-2026-10-20.md`.
- **Ressalvas:** a função `arquivos-no-drive` vai precisar ser publicada de novo no desenvolvimento depois desta parte. `src/types/database.ts` tem uma alteração não comitada que já existia antes desta sessão.
