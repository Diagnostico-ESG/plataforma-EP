# 08: Subprocessos e reclassificação

**Como resolve a sua parte.** Muitos processos têm subprocessos, e o tipo de um item muda no meio do caminho: um processo vira subprocesso, um "a classificar" ganha o seu tipo. Este ticket permite cadastrar subprocessos ligados ao pai (seguindo o macroprocesso dele) e reclassificar qualquer item com motivo, mantendo o mesmo item com tudo o que ele já tem. O banco garante um nível só de subprocesso, que o pai é sempre um Processo e que nenhum subprocesso some de carona numa exclusão.

**What to build:** subprocesso no cadastro (pai entre os processos do tipo Processo, macroprocesso fixo do pai, setor próprio incluído como envolvido se faltar); mudar o macroprocesso do pai muda o dos filhos; recusa de excluir processo com subprocessos; função de reclassificar (motivo, bloqueios, macroprocesso do pai, aviso antes quando o macroprocesso muda); seção "Subprocessos" ou "Processo pai" no painel; pílula "Subprocesso" no cartão. Spec: `.scratch/processos-etapas/spec.md` (histórias 8 a 11, 13 (subprocessos acompanham), 16, 60 a 67; seções "Interface", "Modelo de dados", "Regras que o banco impõe" e "Regras de estado").

**Blocked by:** 04 (Cadastro de processos e o Quadro).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes pgTAP antes da migração (se houver migração): subprocesso sem pai, com pai subprocesso e com pai "a classificar" recusados; processo e "a classificar" com pai recusados; subprocesso adota o macroprocesso do pai; mudar o macroprocesso do pai muda o do filho e inclui o setor do filho como envolvido; excluir processo com subprocessos recusado com a contagem; reclassificar sem motivo recusado; processo com subprocessos não vira subprocesso; virar processo apaga o pai e mantém o macroprocesso; o item mantém o id e os andamentos; cada reclassificação gera o evento com de, para e motivo.
- [ ] A função de reclassificar não é `security definer`; mudar tipo e pai fora dela continua recusado.
- [ ] Módulo de processos (real e falso) ganha o pai no cadastro e reclassificar; recusas: "Este processo tem {n} subprocessos; reclassifique-os ou exclua-os antes.", "O processo pai precisa ser do tipo Processo.".
- [ ] Formulário: tipo Subprocesso habilita o seletor de pai e fixa o macroprocesso no do pai.
- [ ] Painel: "Subprocessos" (cada um abre o seu painel) ou "Processo pai"; [Reclassificar] com a janela de motivo, novo tipo, pai e o aviso "O item passa do macroprocesso {de} para {para}, o do processo pai."; pílula "Subprocesso".
- [ ] Histórico: "Reclassificou", com de, para e motivo.
- [ ] A Consulta não vê [Reclassificar].
- [ ] Testes de interface com o aplicativo inteiro: cadastrar subprocesso, reclassificar nos três sentidos com sucesso e com falha, o aviso de macroprocesso, cada recusa e a navegação entre pai e subprocessos.

Concluído em 2026-10-14 (commit 0bc37e1)
