# 03: Tirar do Quadro

**Como resolve a sua parte.** A coluna Concluídos do Quadro por etapa deve mostrar só o que acabou de ser concluído. Este ticket faz o cartão sair da coluna quando alguém o tira do Quadro ou sozinho, 30 dias depois de entrar em Concluídos, sem travar o processo, e deixa um aviso para desfazer e um pé que diz quantos ficaram de fora.

**What to build:** spec, seções "Coluna Concluídos do Quadro por etapa", "Quadro por responsável" e as de Interface e Modelo de dados que tratam de `tirar_do_quadro`, `voltar_ao_quadro`, aviso e verso:

- **Banco:** `tirar_do_quadro(p_processo)` grava `now()` em `tirado_do_quadro_em` (recusa processo fora de Concluídos com `tirar_do_quadro_so_concluido` e processo já fora com `ja_fora_do_quadro`); `voltar_ao_quadro(p_processo)` grava nulo (recusa processo fora de Concluídos). Sem `security definer`, a RLS decide; nenhuma grava evento no histórico. Só Administrador e Integrante do EP; Consulta, desativado e visitante não. pgTAP primeiro, com a migração ensaiada antes de aplicada; tipos regenerados.
- **Quadro por etapa:** a coluna Concluídos lista só os `no_quadro`; o cartão ganha "Tirar do Quadro" (alcançável pelo teclado, sem disputar espaço com o nome e a faixa do setor) para quem altera; o botão também aparece no verso do concluído ainda no Quadro, onde ficavam Arquivar/Desarquivar. Depois de tirar, o aviso "Tirado do Quadro · Desfazer" (componente novo, `role="status"`, ~8 segundos, não cobre cartão nem coluna) devolve o cartão ao Desfazer. Recusa ou falha de conexão: o cartão fica onde estava (ou volta), com a mensagem de erro no padrão das ações do Quadro.
- **Pé da coluna:** "N concluídos fora do Quadro · Ver na Lista" (singular: "1 concluído fora do Quadro"), com N respeitando os filtros do Quadro; "Ver na Lista" abre a Lista em Concluídos (`mostrar=concluidos`) com os mesmos filtros. Discreto e legível.
- **Quadro por responsável:** o concluído não aparece em nenhuma coluna.
- Sair de Concluídos e voltar devolve o cartão à coluna, com os 30 dias recomeçando.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [x] `tirar_do_quadro` e `voltar_ao_quadro` funcionam para Administrador e Integrante do EP e são recusadas para Consulta, desativado e visitante; as recusas de regra têm os códigos da spec
- [x] Tirar e desfazer não criam evento no histórico
- [x] A coluna Concluídos mostra só o que está no Quadro; some sozinho o que passou de 30 dias; mover para trás e voltar traz o cartão de volta
- [x] O botão "Tirar do Quadro" está no cartão e no verso, só para quem altera, e funciona pelo teclado
- [x] O aviso "Tirado do Quadro · Desfazer" aparece, é anunciado a leitores de tela e Desfazer devolve o cartão
- [x] O pé conta corretamente com os filtros do Quadro e "Ver na Lista" abre a Lista em Concluídos com os mesmos filtros
- [x] O Quadro por responsável não mostra concluídos
- [x] Falha ao tirar ou desfazer deixa o cartão no lugar certo com mensagem de erro
- [x] Testes de banco e de tela verdes; `npm test` verde

Concluído em 2026-10-29 (commit 27daa95), com ressalva: banco verificado no Docker local (1671 ok, 0 not ok); a migração `20261029021159_tirar_e_voltar_ao_quadro` ainda não foi aplicada no remoto de desenvolvimento (GitHub Actions bloqueado por cobrança).
