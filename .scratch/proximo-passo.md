# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-30 (/demanda de 8 itens; pacote 1, bug da rolagem ao arrastar, corrigido)

- **Demanda de 2026-10-30, dividida em 5 pacotes (aprovada pelo usuário):**
  1. Bug: o Quadro não rolava ao arrastar o cartão até a borda. **Feito** (commit da correção e registro em `.scratch/processos-etapas/desvios.md`); o gesto real no navegador fica para o usuário conferir com o login.
  2. Ajuste pequeno: "Nome do Processo" no Novo processo e no Editar, e a seta ▾ em toda coluna da Lista (▲/▼ na que ordena). **Feito** (testes passando; `/polir` ainda não rodou).
  3. Mudança em funcionalidade existente: tirar a Busca ("Buscar pelo nome") da Lista e incluir o agrupamento por Setor na árvore. `/planejar` modo curto (Sonnet).
  4. Mudança em funcionalidade existente: responsável inicial por etapa no Catálogo de etapas (Administração), e ao trocar de etapa o processo fica sem responsável, salvo se a etapa tiver responsável inicial (substitui "quem move vira o responsável"). Pede migração, ADR e CONTEXT.md. `/planejar` completo (Opus). Conferir antes se o comportamento relatado ("o responsável da etapa anterior continua") bate com a regra atual.
  5. Mudança em funcionalidade existente: redesenho do verso do cartão (Etapas, Documentos do Mapeamento e Outros anexos, achados pesados e desorganizados pelo usuário; imagem na conversa de 2026-10-30). `/planejar` completo, com conversa (Opus).
- **Análise crítica de design de todas as telas (2026-10-30):** `.scratch/analise-de-design-2026-10-30.md`. Prioridades: cores dos setores (reduzir a ponto de cor em paleta sóbria), hierarquia do cartão (nome primeiro, situação sem vermelho/âmbar), cabeçalho do quadro em faixa própria. Os achados do cartão aberto alimentam o pacote 5. Aguarda o usuário decidir a direção; o caminho é `/demanda` (Opus) para classificar como redesenho visual.
- **Próximo:** pacote 3, `/planejar` modo curto (Sonnet); o `/polir` do pacote 2 pode vir junto, a cada ciclo. Se o usuário priorizar a análise de design, `/demanda` (Opus) antes.
- **Pendente do usuário (segue valendo):** publicar de novo a `planilhas-dos-dashboards` no desenvolvimento; conferir com o login real o Quadro (inclusive arrastar até a borda), a Lista, a árvore e o verso; decidir sobre os arquivos soltos em `.scratch/`; apagar `.scratch/handoff-2026-10-20.md`; repor o e-mail do git; resolver a cobrança do GitHub.
