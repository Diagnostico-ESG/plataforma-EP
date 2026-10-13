# 05: Histórico dos cadastros

**Como resolve a sua parte.** Desde o 01, cada mudança nos cadastros vira um evento, mas só o Administrador lê `eventos`. Este ticket abre a leitura dos eventos dos cadastros a todos os perfis ativos (os de usuários continuam só do Administrador, porque trazem e-mails) e mostra, na aba Histórico, o que mudou, quem mudou e o que um item excluído tinha.

**What to build:** aba Histórico com a lista das alterações de setores, macroprocessos e setores envolvidos, da mais recente para a mais antiga, com data e hora, autor, ação, item e antes e depois; filtro por item, inclusive excluídos. Spec: `.scratch/cadastros-basicos/spec.md` (histórias 35 a 40, 42, 44 e 45; seção "Histórico dos cadastros").

**Blocked by:** 04 (Setores envolvidos).

**Status:** ready-for-agent

## Critérios de aceite

- [x] Testes pgTAP antes da migração: eventos dos cadastros lidos por Administrador, Integrante e Consulta; não lidos por inativo e visitante; eventos de usuários e autorizações continuam só do Administrador; ninguém inclui, altera ou apaga evento pela plataforma.
- [x] Migração não destrutiva cria a política nova de leitura em `eventos`, limitada às entidades `setor`, `macroprocesso` e `setor_envolvido`.
- [x] Módulo de cadastros ganha listar o histórico dos cadastros (real e falso).
- [x] Textos das ações: "Criou", "Editou", "Desativou", "Reativou", "Excluiu", "Pôs o setor no macroprocesso", "Tirou o setor do macroprocesso", "Mudou a observação do setor no macroprocesso"; teste unitário da função pura. Reaproveitar o que já existe no histórico de usuários onde couber.
- [x] Lista no padrão do Histórico de usuários; a exclusão mostra todos os campos que o item tinha, inclusive os setores envolvidos.
- [x] Filtro "Item" com todos os setores e macroprocessos que aparecem no histórico, inclusive excluídos, nomeados pelo evento mais recente.
- [x] Estados "Carregando histórico…", "Nenhuma alteração registrada ainda." e erro de carregamento com [Tentar de novo].
- [x] Testes de interface com o aplicativo inteiro: lista, ordem, filtro (inclusive por item excluído), estados e a Consulta lendo o histórico dos cadastros.
