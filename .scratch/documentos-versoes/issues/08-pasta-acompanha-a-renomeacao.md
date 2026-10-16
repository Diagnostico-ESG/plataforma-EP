# 08: A pasta acompanha a renomeação

**Como resolve a sua parte.** As pastas do Drive levam a sigla do setor e o nome do processo, que podem mudar depois (renomear o processo, trocar a sigla, mudar o processo de setor). Este ticket faz a pasta acompanhar: na próxima vez que a plataforma mexe nela (o próximo envio), a função confere se o nome e o lugar da pasta batem com os atuais e renomeia ou move a pasta, achando-a pelo identificador guardado. Os arquivos já enviados mantêm o nome com que foram enviados (regra 18).

**What to build:** conferência de nome e lugar da pasta do setor e da do processo em `iniciar_envio`, com renomear e mover no Drive; a decisão (nada, renomear, mover) numa função pura testada. Spec: história 38; seção "Pastas no Drive".

**Blocked by:** 02.

**Status:** ready-for-agent

## Critérios de aceite

- [x] Função pura que, dado o nome e o lugar atuais da pasta no Drive e a sigla, o setor e o nome atuais no banco, decide entre nada, renomear e mover; testes unitários dos três casos e do subprocesso.
- [x] Processo renomeado: no próximo envio a pasta tem o nome novo; os arquivos antigos mantêm o nome antigo, e os novos usam o nome novo.
- [x] Sigla trocada: a pasta do setor é renomeada.
- [x] Processo trocado de setor: a pasta do processo é movida para a pasta do novo setor (criada se faltar).
- [x] Prova no projeto de desenvolvimento com um processo inventado renomeado.
## Registro da execução (2026-10-16)

- **Critério 1:** `decidirAjusteDaPasta` (`supabase/functions/_shared/pasta.ts`) decide entre nada, renomear e mover (ou os dois), testada em `pasta.test.ts`: nada, processo renomeado, sigla trocada, setor trocado, os dois ao mesmo tempo, subprocesso reclassificado e pasta sem pai informado.
- **Critérios 2 a 4 (comportamento):** `acertarPasta` (`arquivos-no-drive/pastas.ts`) segue a decisão a cada `iniciar_envio`; a pasta do setor novo é garantida (criada se faltar) antes da pasta do processo. Os arquivos antigos não são tocados (a função não renomeia arquivo). O código que fala com o Drive não tem teste automático (Deno); a prova é a do critério 5.
- **Critério 5 (prova no desenvolvimento): pendente, do usuário.** Publicar a função (`npx supabase functions deploy arquivos-no-drive --use-api`, vínculo conferido) e seguir o passo 6.2 de `docs/drive-conta-de-servico.md`.
- **Sem a linha `Concluído em`**, até a prova do Drive (ver `desvios.md`). Sem `[visual]`: o ticket não mexe na tela.

## Fecho (2026-10-16)

- **Critérios 2 e 5 (provados à mão, passo 6.2):** com o processo renomeado e uma versão nova enviada, a pasta do processo ganhou o nome novo (a mesma pasta, sem segunda); os arquivos antigos mantiveram o nome antigo e os novos usaram o novo.
- **Ressalva: critérios 3 (sigla trocada) e 4 (mudança de setor) não foram provados no Drive.** O usuário não fez esses dois passos opcionais. Valem só pela decisão pura `decidirAjusteDaPasta`, testada no Vitest (sigla trocada, setor trocado, os dois juntos e subprocesso). Para o `/ship`: presumido, não provado.

Concluído em 2026-10-16 (commit 5930633), com ressalva: critérios 3 e 4 só pelo teste da decisão, sem prova no Drive
