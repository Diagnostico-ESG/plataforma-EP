# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-28 (/planejar ajustes-quadro-lista, modo curto, concluído)

- **Feito:** seção "Ajustes do Quadro e da Lista" no topo de `.scratch/processos-etapas/spec.md` (seis mudanças, sete critérios de pronto), ADR 0032 e registro datado em `.scratch/identidade-visual.md`. Marco `marco/2026-10-28-inicio-ajustes-quadro-lista`. Sem banco.
- **Próximo:** `/executar-simples` (Sonnet) para a seção "Ajustes do Quadro e da Lista" da spec de processos-etapas. Depois, `/polir` e o `/ship` (Sonnet), que entrega junto esta mudança e a "Coluna tingida e etiquetas fortes" (spec segue "Em revisão desde 2026-10-28").
- **Atenção na execução:** `src/cadastros/corDoSetor.test.ts` tem um teste não comitado (sobra do `/polir` de visual-do-cartao) que confere a frase da coluna vazia sobre o fundo tingido; com a mudança, a frase passa a ficar sobre o fundo da página, e o teste perde o sentido (decidir na execução descartar ou adaptar).
- **Pendente do usuário (segue valendo):** publicar de novo `arquivos-no-drive` e `planilhas-dos-dashboards` no desenvolvimento; conferir o papel da conta de serviço nos Drives compartilhados; provar anexos no Drive real; conferir as telas com o login real (critérios `[visual]`); conferir no painel do Supabase de desenvolvimento que o cadastro aberto por e-mail segue desligado; apagar `.scratch/handoff-2026-10-20.md`; repor o e-mail do git (`git config --global user.email`). `src/types/database.ts` pode aparecer modificado só por fim de linha.
