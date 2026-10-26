# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-26 (fim do `/ship` da parte 4 do quadro livre, anexos)

- **Feito:** parte 4 (documentos-versoes, tickets 12 e 13) **entregue com ressalva** (commit `817dcb3`, marco `marco/2026-10-26-entrega-documentos-versoes-2`). No `/ship`: revisão de código sem violação dura; revisão de segurança (de reserva) achou 1 problema real e foi corrigido: `retirar` e `baixar` do anexo só agem em arquivo dentro da subpasta "Anexos" do processo (opção 1 escolhida; ver `desvios.md`, 2026-10-26). `npm test`: 2890 verdes; cobertura 98,1%; circulares limpas; tipos do banco em dia.
- **Ressalvas na marca:** critérios `[visual]` presumidos; função `arquivos-no-drive` (com a correção) **não publicada**, camada Deno sem teste automático; provas no Drive real pendentes; revisão de segurança de reserva.
- **Pendente do usuário:** (1) **publicar a função de novo no desenvolvimento** (`npx supabase functions deploy arquivos-no-drive --use-api`; a correção da subpasta só vale depois); (2) conferir o papel da conta de serviço (Gerente de conteúdo) em cada Drive compartilhado; (3) provar no Drive real: enviar um anexo, baixar, retirar (lixeira) e restaurar; (4) conferir as telas com o login real; (5) republicar `planilhas-dos-dashboards`; (6) apagar ou refazer `.scratch/handoff-2026-10-20.md`; (7) o "Testes de banco" no GitHub não foi disparado nesta sessão (o último verde, #40410335689, é anterior; nenhuma migração nova depois).
- **Próximo comando:** `/planejar` da parte 5 do quadro livre (**Visualização por setores**, processos-etapas), em **Opus** (modo completo), numa sessão nova começando pelo `/situação`.
