# 07: Confirmação de Excluir e Desativar, e cores das mensagens

**Como resolve a sua parte.** Hoje Excluir autorização e Desativar agem com um clique, e um clique acidental tira o acesso de alguém. Além disso, a mesma falha aparece em amarelo na Administração e em vermelho na entrada. Este ticket pede confirmação só nas ações que tiram acesso ou apagam e separa as cores: vermelho para "a ação não aconteceu", amarelo para aviso (ADR 0003).

**What to build:** Excluir autorização e Desativar abrem uma janela de confirmação nativa do navegador com os textos da spec; Reativar e Corrigir nome seguem sem janela. As mensagens de falha da Administração passam ao vermelho da entrada, e o aviso de perfil sem permissão fica em amarelo. Spec: `.scratch/login-perfis/spec.md` (histórias 50 a 54; "Confirmação" e "Cores das mensagens").

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [x] Excluir abre "Excluir a autorização de {e-mail}?" com o texto e os botões [Excluir autorização] [Cancelar] da spec; Desativar abre "Desativar {nome}?" com o texto e os botões [Desativar] [Cancelar].
- [x] A janela abre com o foco no Cancelar; Cancelar e Esc fecham sem gravar; o botão da ação grava e fecha.
- [x] Se a gravação confirmada falhar, a mensagem aparece na linha, como nas demais ações.
- [x] Reativar grava com um clique, sem janela.
- [x] Sem dependência nova; o botão de confirmar usa o estilo principal existente.
- [x] Erro ao carregar a lista ou o histórico, erro de gravação e recusas das travas em vermelho (cores de atraso da identidade); a mensagem de perfil sem permissão em amarelo (pendência).
- [x] Testes de interface com o aplicativo inteiro e o módulo falso cobrindo janelas, Cancelar, Esc, confirmação, falha e Reativar sem janela, e o tipo de cada mensagem.
- [x] `[visual]` Janela na identidade visual (fundo esmaecido, botão principal azul, Cancelar com foco visível); falhas em vermelho e aviso em amarelo na Administração e na entrada.
