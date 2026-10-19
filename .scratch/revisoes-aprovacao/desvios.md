# Desvios — revisoes-aprovacao

## 2026-10-19 — ticket 01 (etapas protegidas e Revisão pelo setor com versão completa)

- **"Versão mais recente" é a não histórica de maior número.** A spec diz "maior número do processo". A trava do autor (ADR 0014) e `UltimaVersao` já usam a não histórica, e a versão histórica (V6F) só nasce antes da primeira versão nova e pode ter só o .bpm. Um processo que tem só histórica fica "sem versão" para esta trava. Funções `private.id_da_versao_mais_recente` e `private.papeis_que_faltam`.
- **A falsa de processos imita a trava com `ultimaVersao.papeis`, não consultando a falsa de versões.** O ticket pedia que a falsa de processos consultasse a de versões. A leitura real do processo já traz os papéis dos arquivos da versão mais recente (`lerUltimaVersao`), então a falsa usa o mesmo dado que a tela recebe; os testes de tela preenchem `ultimaVersao.papeis`. Isso evita acoplar `ProcessosFalso` (288 linhas) à `VersoesFalso`.
- **Gatilho de conclusão genérico: `private.conferir_conclusao_da_etapa`.** Age só quando o status passa a `concluida` e despacha pelo código da etapa; hoje só a `revisao_setor` tem conferência. Os tickets 02 e 03 acrescentam a Revisão interna e a Aprovação pelo setor no mesmo gatilho.
- **O gatilho das etapas protegidas se chama `bloquear_etapa_protegida`**, para vir antes de `conferir_etapa_nunca_usada` na ordem alfabética dos gatilhos: excluir uma etapa protegida já usada dá a recusa de "protegida", não a de "usada".
- **A frase de recusa do catálogo e a de "sem versão" são decisão de execução** (a spec só dá "A V8 está sem relatório."): "A etapa Revisão interna é obrigatória no fluxo: não pode ser desativada nem excluída." e "O processo ainda não tem versão enviada.".
- **A janela só bloqueia o Concluir da Revisão pelo setor.** Dispensar e "Realizada anteriormente" seguem como antes (a etapa é obrigatória e "realizada anteriormente" continua sem registro nem trava). Sem etapa pendente depois, o Concluir grava direto e a recusa vem do banco como frase em vermelho.
- **O teste de banco 38 prova "sem .png" apagando o arquivo como dono do banco**, porque `registrar_versao` nunca cria versão sem .bpmn e .png.
- **Sem conferência na tela (nada de [visual] neste ticket):** só testes de tela com as falsas; o aspecto da frase na janela (classe `cadastros-falha`, vermelho) não foi visto no navegador. A conferência fica para o `/polir` da funcionalidade.
- **`db:types` rodou e nada mudou** (as funções novas estão em `private`); o `src/types/database.ts` segue modificado só por fim de linha (CRLF), como antes.
