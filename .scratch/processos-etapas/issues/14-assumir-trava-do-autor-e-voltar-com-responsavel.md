# 14: [Assumir], trava do autor na Revisão interna e voltar com responsável

**Como resolve a sua parte.** Depois do avanço, muitas etapas ficam em andamento sem responsável, e hoje pegar uma delas exige abrir o seletor e procurar o próprio nome. Além disso, nada impede que quem fez a versão seja posto para revisá-la. Este ticket dá o [Assumir] de um clique, faz o banco recusar o autor da versão mais recente como responsável da Revisão interna (só no momento da escolha, para não barrar o revisor que corrige) e leva a mesma escolha de responsável para a janela de voltar a uma etapa.

**What to build:** [Assumir] na linha de cada etapa pendente ou em andamento sem responsável, para Administrador e Integrante (não para a Consulta; não na Revisão interna para o autor da versão mais recente não histórica). Gatilho que recusa, quando o responsável da Revisão interna passa a ser alguém, quem enviou a versão mais recente não histórica, com a mensagem "{Usuário} enviou a versão V{n} e não pode ser responsável pela Revisão interna."; vale pelo seletor, pelo [Assumir], pelo avanço e pelo voltar. A janela de avanço (ticket 13) esconde o autor quando a próxima é a Revisão interna e marca, nesta ordem, o responsável que a etapa já tem, quem está na tela ou "Ninguém por enquanto", pulando quem a trava barra. A janela de voltar ganha "Quem fica com esta etapa?", com o responsável atual da etapa reaberta marcado e a mesma trava. Spec: `.scratch/processos-etapas/spec.md` (histórias 40, 101 a 106; "Interface", "[Assumir]" e "Janela de avanço", item Voltar; mensagem de recusa nova; "Regras que o banco impõe", linha da trava do autor; "Migração da parte 2"). Porquê: ADR 0014; `CONTEXT.md`, "Assumir" e "Revisor".

**Blocked by:** 13 (Resolver a etapa já inicia a próxima), porque a trava filtra a janela de avanço e precisa valer também na função de avanço.

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: migração nova cria o gatilho da trava do autor no andamento de código `revisao_interna` (conferido só quando o responsável muda para alguém) e recria a função de voltar com o parâmetro do responsável da etapa reaberta (apagada e recriada, com os mesmos privilégios).
- [ ] Banco (pgTAP, antes da migração): escolher o autor da V3 como responsável da Revisão interna recusado pelo seletor, pelo avanço e pelo voltar; autor de versão histórica aceito; processo sem versão aceito; o responsável que envia a V4 depois de escolhido continua responsável; deixar vazio aceito; voltar põe a etapa reaberta em andamento com o responsável recebido (ou nenhum); testes antigos de voltar ajustados à assinatura nova.
- [ ] Módulo de processos (falsa e Supabase): voltar leva o responsável; a falsa imita a trava; a recusa nova vira a mensagem da spec, com teste.
- [ ] [Assumir]: aparece em etapa pendente ou em andamento sem responsável; não aparece em etapa resolvida, para a Consulta nem, na Revisão interna, para o autor da versão mais recente; um clique põe quem está na tela como responsável e gera "Mudou o responsável da etapa" no histórico.
- [ ] Janela de avanço com a próxima sendo a Revisão interna: sem o autor da versão mais recente não histórica; autor de versão histórica presente; marcado "Ninguém por enquanto" quando o autor é quem conclui e a etapa não tem responsável que possa ficar.
- [ ] Seletor de responsável: escolher o autor na Revisão interna mostra a recusa do banco em vermelho e mantém o responsável anterior.
- [ ] Janela de voltar: "Quem fica com esta etapa?" com as mesmas opções e a mesma trava, marcado o responsável atual da etapa reaberta (se ele não pode, quem está na tela; senão, "Ninguém por enquanto"); confirmar desabilitado com o motivo vazio; Esc sem gravar.
- [ ] Testes de interface com o aplicativo inteiro cobrindo os itens acima.
- [ ] `supabase/AMBIENTES.md` registra a migração.
