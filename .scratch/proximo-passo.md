# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-27 (fim do `/ship` das caixas de seleção)

- **Feito:** `caixas-de-selecao` implementada (spec com `Implementado em`). Estilo único em `src/styles/caixas.css` (`appearance: base-select`, só Chrome e Edge); `OpcaoDaCaixa` e `BotaoDaCaixa` em `src/components/OpcaoDaCaixa.tsx` (selo da etiqueta, marca de cor do macroprocesso, Avatar do responsável); filtro Responsável e o "Trocar" trazem a foto (`pessoa` nas opções, `foto_url` em `listarResponsaveisPossiveis`); padrão registrado em `.scratch/identidade-visual.md`. 2.910 testes passando. O React 19.3 aceitou a opção rica e o `<selectedcontent>` sem aviso no Chrome; o aviso só aparece no jsdom e é filtrado em `src/configurarTestes.ts`.
- **Conferido no Chrome (vitrine local):** lista aberta (borda, canto, sombra, opção com marca de cor), caixa fechada com a marca de cor e com o Avatar (filtros Macroprocesso e Responsável). **Não conferido:** verso do cartão (Etiqueta e "Trocar" com Esc; a vitrine local não abre o verso), modo de contraste forçado, Firefox/Safari.
- **Pendente do usuário (segue valendo):** publicar de novo `arquivos-no-drive` e `planilhas-dos-dashboards` no desenvolvimento; conferir o papel da conta de serviço nos Drives compartilhados; provar anexos no Drive real; conferir as telas com o login real; apagar `.scratch/handoff-2026-10-20.md`. `src/types/database.ts` aparece modificado só por fim de linha.
- **Entregue:** `caixas-de-selecao` com marca de entrega (ressalvas na spec). Os passos de aprovação ficam com o usuário: ver as telas no Chrome (lista aberta, verso do cartão com Etiqueta e "Trocar"/Esc), contraste forçado e Firefox/Safari.
- **Próximo comando (Opus):** `/planejar` da próxima funcionalidade; demandas fora do plano entram pelo `/demanda` (Opus para classificar).
