# 06: Substituir arquivo

**Como resolve a sua parte.** Anexar o arquivo errado é um erro de envio, não uma mudança no trabalho, então não deve gerar versão nova (ADR 0007). Este ticket dá a cada arquivo de versão nova o botão [Substituir]: depois de uma confirmação que avisa que o anterior não fica guardado, o arquivo novo, do mesmo tipo e com as mesmas conferências do envio, é gravado no mesmo arquivo do Drive, mantém o nome da versão, e o histórico registra quem trocou, quando, qual arquivo e o nome e o hash do que saiu.

**What to build:** função do banco de substituição (só tamanho, hash, autor e data mudam, pelo privilégio de coluna), gatilhos das regras (versão nova, processo em andamento) e o evento com o "antes"; ação `iniciar_envio` em modo de atualização do mesmo arquivo do Drive e `registrar` para substituição; botão, confirmação e formulário na seção Versões. Spec: histórias 28 a 32 e 45 (substituição).

**Blocked by:** 02.

**Status:** ready-for-agent

## Critérios de aceite

- [x] Banco: testes antes da migração: substituir em versão nova aceito para Administrador e Integrante, recusado para Consulta, inativo e visitante; em versão histórica recusado; com processo fora de andamento recusado; alterar `nome`, `papel` ou `drive_id` recusado; o evento traz no "antes" o nome e o hash do que saiu.
- [x] A substituição grava no mesmo identificador do Drive (nenhum arquivo novo na pasta, nada apagado).
- [x] [Substituir] em cada arquivo de versão nova, para Administrador e Integrante com o processo em andamento; a confirmação avisa que o anterior não fica guardado; o arquivo novo precisa ser do mesmo papel e passa pelas conferências do envio.
- [x] O histórico do processo mostra a troca com o texto próprio.
- [x] Testes de interface com a falsa: substituir com sucesso, cancelar na confirmação, tipo errado, falha no envio e recusas.

## Registro da execução (2026-10-16)

- **Critério 1 (banco):** `supabase/tests/30_substituir_arquivo.test.sql` (25 casos), escrito antes da migração (#85, vermelho: função inexistente, 17 de 25). Migração `20261016035341_substituir_arquivo`, ensaiada antes (#86: ensaio com 25 de 25, 28 com 35 e 29 com 37) e aplicada pelo workflow (#20); o "Testes de banco" seguinte (#87) reprovou o 27 (efeito do evento novo nas trocas de tamanho do próprio teste, ver `desvios.md`) e, com o 27 ajustado, os 31 arquivos ficaram verdes (#88). Cobre: administrador e integrante substituem; a substituição não cria arquivo; tamanho, hash e autor mudam e nome e `drive_id` ficam; relatório .pdf por .docx recusado; versão histórica recusada; processo suspenso, cancelado e concluído recusados; alterar `nome`, `papel`, `drive_id` ou `versao_id` e apagar recusados; hash fora do formato recusado; um evento por troca, com o nome e o hash do que saiu no "antes"; consulta, inativo e visitante recusados, e a leitura dos eventos por perfil.
- **Critério 2 (mesmo identificador do Drive):** o banco nunca altera `drive_id`; a função do servidor abre a sessão de **atualização** (`PATCH` no `drive_id` do arquivo, sem `name` nem `parents`) e confere no registro que o arquivo que chegou é o mesmo. A decisão está testada no Vitest (`substituicao.test.ts`, `registro.test.ts`, `decisao.test.ts`); a chamada de ponta a ponta fica na prova do Drive.
- **Critérios 3 a 5 (tela):** `src/App.substituirArquivo.test.tsx` (17 casos), com o aplicativo inteiro e a `VersoesFalso`: [Substituir] em cada arquivo da versão nova para Administrador e Integrante, sumindo na versão histórica, para a Consulta e com o processo suspenso, cancelado ou concluído; formulário com o campo do mesmo papel e a prévia do nome que continua valendo; conferências do envio (PNG) e do tipo (.docx no lugar do .pdf); janela de confirmação com o aviso de que o anterior não fica guardado, e Cancelar sem enviar; troca no mesmo lugar, sem versão nova; progresso e campo travado; falha no arquivo e recusa do servidor com o formulário preenchido; a troca no histórico do processo. Funções puras: `formularioDeVersao.test.ts`, `recusasDeVersoes.test.ts`, `historicoDasVersoes.test.ts`; módulo real e falso: `versoesSupabase.test.ts`, `VersoesFalso.test.ts`.
- **Prova real no Drive: pendente** (roteiro do usuário). O `prova-do-drive.mjs` já tem o passo da troca. A função do servidor alterada não foi publicada.
- **`[visual]`:** o [Substituir] ao lado do nome do arquivo, o formulário da troca no item e a janela de confirmação não foram conferidos olhando a tela.
- **Sem a linha `Concluído em`**, até a prova do Drive (ver `desvios.md`).
