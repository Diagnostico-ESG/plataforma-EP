# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-26 (fim do `/executar-simples` da parte 5 do quadro livre)

- **Feito:** Visualização por setores implementada (commit `6052a4f`, linha `Implementado em` na spec de processos-etapas): "Agrupar por: Etapa | Responsável | Setor", uma coluna por setor ativo (sigla e nome, ordem de sigla, mesmo vazia), setor inativo só com processo e anunciado como inativo, cartão com barra, etiqueta e avatar, sem sigla e sem arrastar, `agrupar=setor` no endereço. Sem mudança no banco. `npm test`: 2905 verdes. Revisão de código (padrões e spec) feita; achados corrigidos (rótulo "inativo" da coluna, conversão de tipo no endereço, fábrica de setor dos testes compartilhada).
- **Não visto na tela:** os critérios `[visual]` (título em duas linhas, nome longo, marca "inativo") ficam para o `/polir`.
- **Pendente do usuário (da parte 4, segue valendo):** publicar de novo `arquivos-no-drive` no desenvolvimento; conferir o papel da conta de serviço nos Drives compartilhados; provar anexos no Drive real; conferir as telas com o login real; republicar `planilhas-dos-dashboards`; apagar `.scratch/handoff-2026-10-20.md` (desatualizado).
- **Próximo comando:** `/polir` da Visualização por setores (processos-etapas), em **Sonnet**, numa sessão nova começando pelo `/situação`; depois `/ship`.
