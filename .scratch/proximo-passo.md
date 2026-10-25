# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-25 (fim do `/executar-complexo` do ticket 26 de processos-etapas, Data da modelagem piloto)

- **Feito:** ticket 26 concluído e integrado à `main` (commits `ab78303` e `6e65833`; marco `marco/2026-10-25-inicio-ticket-26-data-da-modelagem-piloto`). A coluna virou `processos.data_da_modelagem_piloto` (migração `20261025194034`, aplicada no desenvolvimento pelo workflow, execução #49); "Testes de banco" #194 verde; suíte completa do Vitest verde; Edge Function, módulo de processos, Novo processo (data de hoje), verso, selo "Modelagem" e histórico já usam o nome novo.
- **Próximo comando:** em sessão nova com o Sonnet, `/executar-simples` no ticket 27 (cara do cartão: barra em blocos, etiquetas coloridas, processo parado em vermelho, Anotações com 7 linhas). Depois, `/polir` e `/ship` de processos-etapas.
- **Pendente do usuário:** republicar a Edge Function `planilhas-dos-dashboards` no desenvolvimento (`docs/planilhas-publicar-a-funcao.md`), porque o pacote agora traz a chave `data_da_modelagem_piloto`; até lá a atualização das planilhas recusa o pacote novo; conferir na tela com o login real o Novo processo e o verso; ler as "Decisões tomadas ao escrever esta seção" da spec (seção "Cartão e verso"); apagar ou refazer o handoff antigo `.scratch/handoff-2026-10-20.md`.
- **Ressalvas:** o critério `[visual]` do ticket 26 foi visto só na vitrine local (módulos falsos); o teste de banco 53 não roda no Docker local por falta de `seed.sql` (roda no GitHub Actions); a revisão de segurança do `/ship` ainda é a de reserva.
