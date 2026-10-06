# Melhorias do protocolo

Registro de itens não testados que aconteceram numa execução real e de regras que falharam ou podem melhorar. A avaliação é do usuário.

## 2026-10-06 — /projeto

- **Escopo conferido antes das perguntas.** Esperado: verificar se o projeto é aplicação web com interface antes de qualquer pergunta. Aconteceu: a especificação descreve uma plataforma web (React + Supabase) que substitui um dashboard Power BI; o escopo foi considerado compatível e nenhuma pergunta foi feita sobre isso.
- **Partida de uma especificação pronta.** Esperado: ler a especificação inteira, copiá-la para `.scratch/especificacao.md` e perguntar só o que ela deixa em aberto. Aconteceu: o arquivo `especificacao-inicial-plataforma-ep.md` estava na raiz sem ser apontado no comando; foi lido inteiro, copiado, e foram feitas 4 perguntas (quantidade de usuários, quem cria usuários, registro de leitura, duração/manutenção). O original continua na raiz.
- **Fases da especificação no backlog.** Esperado: só a v1 no `projeto.md`; as demais fases em `backlog.md`, uma linha cada, com prefixo. Aconteceu: 10 decisões abertas e 13 itens de fases ("EP v1.5", "EP v2", "EP depois") foram para o backlog, mais 2 itens futuros surgidos na conversa. A decisão aberta 10 foi marcada como resolvida na própria linha (riscada), e não removida.
- **Pergunta sobre registro de leitura.** Esperado: perguntar se a instituição exige registrar quem consultou cada dado. Aconteceu: perguntado; o usuário escolheu registrar só alterações na v1 e deixar o registro de consultas como possibilidade futura (backlog).
- **Observação:** a skill `superpowers:brainstorming` prevê terminar com documento em `docs/superpowers/specs/` e a skill `writing-plans`; prevaleceu o `/projeto` (resultado só em `.scratch/projeto.md`). Talvez valha o comando dizer isso explicitamente.

## 2026-10-06 — /status (Qualquer momento: troca de sessão com `/status` na retomada)

- **Esperado:** a sessão nova começa digitando `/status`. **Aconteceu:** no app desktop (aba Code), digitar `/status` e Enter não fez nada. O arquivo `.claude/commands/status.md` existe e está correto. Causa provável: `/status` é também um comando nativo do Claude Code (janela de status do terminal), que tem prioridade sobre o comando do projeto e não abre no app desktop. Contorno: pedir em texto ("rode o comando status do DevFlow"), e o Claude aciona o comando do projeto. Sugestão: renomear o comando na cópia mestra (por exemplo `/onde-estou` ou `/situacao`) para não colidir com o nativo.
