# 23: Anotações do processo

**Como resolve a sua parte.** Hoje o que a equipe precisa lembrar sobre um processo (o porquê de estar parado, um combinado com o setor, um contato) não tem lugar na plataforma. Este ticket dá ao verso do cartão um bloco "Anotações": um texto livre, único por processo, compartilhado pela equipe, que se grava sozinho enquanto se escreve e não vai para o Histórico (ADR 0021).

**What to build:** o bloco "Anotações" no alto da coluna direita do verso, acima da Reunião, de ponta a ponta (banco, tela e testes).

- **Escrever:** Administrador e Integrante do EP ativos escrevem direto no campo, sem botão. A gravação acontece cerca de 1 segundo depois da última tecla e ao sair do campo. Ao lado do título, "Salvando…" e depois "Salvo", anunciados sem roubar o foco. Até 2.000 caracteres, com a contagem só perto do limite. O campo cresce com o texto até uma altura máxima e depois rola por dentro. O campo tem o nome "Anotações".
- **Ler:** dica "Escreva aqui as anotações do processo" no campo vazio; a Consulta vê o texto sem campo editável e "Sem anotações." quando vazio. Abaixo do campo, discreto, "Alterado por {nome} em {dd/mm}, {hh:mm}", que não aparece enquanto não há anotação gravada. Cada subprocesso tem as suas, separadas das do pai, e elas continuam no processo depois de uma reclassificação.
- **Situação:** escreve-se com o processo em andamento, suspenso, cancelado ou concluído; no arquivado, só se lê (com a linha "Alterado por").
- **Conferência de quem escreveu antes (no banco):** a gravação só acontece se o texto no banco ainda é o mesmo de quando a pessoa começou a escrever; se outra pessoa alterou antes, o banco recusa. O banco impõe também os perfis: Consulta, usuário inativo e visitante sem login não gravam, e inativo e visitante não leem, mesmo fora da tela.
- **Sem histórico, sem vazamento:** alterar as Anotações não gera evento no Histórico do processo. O texto fica só no verso: fora do cartão do Quadro, da busca da Lista, das views usadas pelas planilhas dos dashboards e do pacote de exportação.
- **Fica para os próximos passos (backlog, só se fizerem falta):** os avisos de falha ao salvar e de conflito na tela, o botão "Ver o texto atual", a confirmação ao fechar o verso com texto não gravado e o aviso do navegador ao fechar a aba. Neste ticket, a falha ou a recusa ao salvar mantém o texto no campo e não mostra "Salvo".

Spec: `.scratch/processos-etapas/spec.md` (histórias 173 a 178, 183 a 187, 190 a 194, 196 e 197; a seção "Anotações do processo (2026-10-23)"); sabatina em `.scratch/processos-etapas/sabatina-anotacoes.md`; ADR 0021; termo "Anotações" no `CONTEXT.md`.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Teste de banco (pgTAP) escrito antes da migração e visto falhar: Administrador e Integrante ativos gravam; Consulta, inativo e visitante são recusados; inativo e visitante não leem; gravar com o texto anterior diferente do que está no banco é recusado e não altera nada; arquivado recusa a gravação e os outros status aceitam; mais de 2.000 caracteres é recusado; a gravação não gera evento; o autor e o momento da última alteração ficam registrados; subprocesso e pai têm textos separados.
- [ ] As Anotações não aparecem nas views e funções usadas pelo Quadro, pela Lista, pelas planilhas dos dashboards e pelo pacote de exportação (teste que confirma a ausência).
- [ ] Funções puras com testes unitários: decidir quando gravar (pausa de 1 segundo e saída do campo), limite e contagem de caracteres, e o texto "Alterado por … em …".
- [ ] Testes de interface com o aplicativo inteiro: o bloco aparece no alto da coluna direita, acima da Reunião; a gravação automática mostra "Salvando…" e "Salvo"; a recusa por texto alterado ou por falha mantém o texto no campo e não mostra "Salvo"; as dicas de campo vazio; a Consulta lê sem campo editável; o arquivado só lê; o subprocesso tem as suas Anotações.
- [ ] Acessibilidade: o campo se chama "Anotações" e "Salvando…" e "Salvo" são anunciados sem tirar o foco.
- [ ] Migração não destrutiva, aplicada pelo workflow "Migrar banco de desenvolvimento" e testada pelo "Testes de banco"; tipos regenerados com `db:types`.
- [ ] `[visual]` O bloco "Anotações" fica no alto da coluna direita do verso, acima da Reunião, com o título e o estado "Salvando…/Salvo" lado a lado, o campo crescendo até uma altura máxima e a linha "Alterado por" discreta abaixo.
