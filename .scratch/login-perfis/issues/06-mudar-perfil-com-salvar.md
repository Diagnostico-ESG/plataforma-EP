# 06: Mudar perfil só com Salvar

**Como resolve a sua parte.** Hoje o seletor de perfil grava a cada opção escolhida, e no Windows cada seta do teclado vira uma troca de perfil e um evento no histórico. Este ticket separa escolher de gravar: o administrador escolhe, confere e só então salva (ADR 0003).

**What to build:** na tabela de usuários da Administração, escolher outro perfil numa linha mostra [Salvar] e [Cancelar] ao lado, no padrão do "Corrigir nome". Salvar grava; Cancelar volta ao perfil gravado. Vale para linhas de usuário e de autorização aguardando. Spec: `.scratch/login-perfis/spec.md` (histórias 47 a 49; "Mudar perfil numa linha").

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Trocar a opção do seletor (inclusive pelas setas do teclado) não chama a gravação.
- [ ] Com a escolha diferente do perfil gravado, aparecem [Salvar] e [Cancelar]; com a escolha igual, não aparecem.
- [ ] Salvar grava uma vez, gera um evento só e esconde os botões.
- [ ] Cancelar volta o seletor ao perfil gravado sem gravar.
- [ ] Salvar com falha (sem conexão ou recusa de trava) mantém a escolha no seletor, mostra a mensagem na linha e deixa Salvar e Cancelar disponíveis.
- [ ] O seletor do formulário "Autorizar e-mail" continua como está.
- [ ] Testes de interface com o aplicativo inteiro e o módulo falso cobrindo cada critério acima.
- [ ] `[visual]` Salvar e Cancelar ao lado do seletor sem desalinhar a linha da tabela.
