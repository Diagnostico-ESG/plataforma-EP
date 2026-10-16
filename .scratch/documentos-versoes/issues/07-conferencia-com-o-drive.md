# 07: Conferência com o Drive

**Como resolve a sua parte.** A pasta do Drive é aberta à equipe, então alguém pode trocar ou apagar um arquivo lá sem passar pela plataforma, e o registro ficaria afirmando algo que já não é verdade. Este ticket faz a seção Versões, ao abrir, perguntar à função do servidor como está cada arquivo no Drive: a função compara o hash e a existência com o que o banco guarda, e a tela marca "alterado fora da plataforma" ou "não encontrado no Drive". Se a conferência falhar, a lista aparece normalmente, com um aviso discreto.

**What to build:** ação `conferir` da função do servidor (por processo; resultado não é gravado); conferência no módulo de versões (real e falso); marcas e aviso na seção Versões. Spec: histórias 39 e 50; seção "Regras de estado".

**Blocked by:** 02.

**Status:** ready-for-agent

## Critérios de aceite

- [x] `conferir` devolve, por arquivo do processo, `ok`, `alterado` ou `nao_encontrado`, comparando o MD5 e a existência no Drive; recusa inativo e sem login; coberta pelo arquivo puro de decisão.
- [x] Ao abrir a seção Versões, a conferência roda uma vez; as marcas aparecem como pílulas com texto no arquivo afetado.
- [x] Conferência que falha: lista normal, sem marcas, com o aviso "Não foi possível conferir os arquivos no Drive.".
- [x] Testes de interface com a falsa: cada resultado e a falha; teste do módulo real com `fetch` simulado.
- [x] Prova no projeto de desenvolvimento: arquivo alterado à mão no Drive de desenvolvimento aparece como "alterado fora da plataforma".

## Registro da execução (2026-10-16)

- **Critério 1:** a ação `conferir` (`supabase/functions/arquivos-no-drive/conferir.ts`) lê os arquivos do processo pela RLS, pergunta ao Drive `id, md5Checksum, trashed` de cada um e devolve `{ arquivos: { <id>: ok | alterado | nao_encontrado } }`, sem gravar nada. A decisão está em `_shared/conferencia.ts`, coberta em `conferencia.test.ts`: entrada (uuid do processo), situação (MD5 igual, diferente, ausente, arquivo que o Drive não acha, lixeira) e quem pode (Administrador, Integrante e Consulta ativos; inativo e visitante recusados).
- **Critério 2:** `useConferenciaNoDrive` chama o módulo quando a lista chega; a marca é a pílula com texto no item do arquivo (`MarcaNoDrive`). Coberto em `src/App.conferenciaNoDrive.test.tsx` (6 casos): marcas nos arquivos certos, uma só chamada ao abrir, Consulta também vê, sem marca quando está tudo certo, processo sem versão não chama a função.
- **Critério 3:** com a conferência falhando, a lista aparece normal, sem marcas, com "Não foi possível conferir os arquivos no Drive." (mesmo arquivo de teste).
- **Critério 4:** falso (`VersoesFalso.test.ts`, 3 casos novos) e módulo real com `fetch` simulado (`versoesSupabase.test.ts`, 2 casos novos), mais `situacaoNoDrive.test.ts`.
- **Critério 5 (prova no desenvolvimento): pendente, do usuário.** Falta publicar a função (`npx supabase functions deploy arquivos-no-drive --use-api`, vínculo conferido) e seguir os passos 6 e 6.1 de `docs/drive-conta-de-servico.md`.
- **`[visual]`:** as pílulas "Alterado fora da plataforma" e "Não encontrado no Drive" e o aviso discreto não foram conferidos olhando a tela (critério da spec, para o `/ship`).
- **Sem a linha `Concluído em`**, até a prova do Drive (ver `desvios.md`).

## Fecho (2026-10-16)

- **Critério 5 (prova, passo 6.1 à mão):** arquivo na lixeira apareceu como "Não encontrado no Drive" e, restaurado, a marca sumiu; nova versão pelo próprio Drive apareceu como "Alterado fora da plataforma". Um arquivo novo com o mesmo nome conta como outro arquivo (outro identificador). Na saída do script, a conferência dá `ok`, recusa sem login e continua `ok` depois da troca.
- **Ressalva `[visual]`:** as pílulas foram vistas pelo usuário na prova, mas a conferência visual da spec fica para o `/ship`.

Concluído em 2026-10-16 (commit 1693d88)
