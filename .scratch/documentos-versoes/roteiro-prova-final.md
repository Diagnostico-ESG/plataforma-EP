# Roteiro da prova final no Drive real (2026-11-04)

Passos que só você faz, no seu terminal e no navegador, contra o projeto de **desenvolvimento** (`yclkzyoebpsxmgpbcbus`). Complementa `docs/drive-conta-de-servico.md` (que continua valendo para a montagem) e fecha as ressalvas "provas no Drive real pendentes" de `documentos-versoes`, `revisoes-aprovacao` e `repositorio-de-processos`. Nada aqui vai para produção.

Nada de chave, senha ou conteúdo de `dados-reais/` na conversa. Cole só as linhas OK/FALHOU e o que viu na tela.

## O que este roteiro prova

| Ressalva em aberto | Passo |
|---|---|
| Função `arquivos-no-drive` publicada em 2026-10-17 e 2026-10-20, mas depois ela mudou de novo (retirar, renumerar etc.) e a publicação a partir da `main` não foi reconferida | A, B |
| Saída do Integrante não foi colada (tickets 01, 02, 04, 05); `files.copy` nunca apareceu numa saída | B |
| Versão histórica e relatório sozinho: já estão no script, mas nunca rodaram numa prova com saída colada | B |
| Troca de sigla do setor e mudança de setor (ticket 08, critérios 3 e 4) | C1, C2 |
| Retirada de anexo manda para a lixeira do Drive (ADR 0027) | C3 |
| Acrescentar arquivo à versão, e a recusa na versão aprovada | C4 |
| Arrumação adiada (seção 7 do roteiro antigo; o Email já foi desligado, o resto segue no backlog) | D |

Já provados e **fora** deste roteiro: renomear processo e a pasta acompanhar (2026-10-16), marcas "Alterado fora da plataforma" e "Não encontrado" (2026-10-16), ação renumerar (2026-10-27).

## A. Preparar e publicar a função a partir da `main`

1. Confira que o vínculo é o de desenvolvimento (tem de sair `yclkzyoebpsxmgpbcbus`; se for outro, pare):

```powershell
Get-Content supabase\.temp\project-ref
```

2. Confira que está na `main`, sem mudança pendente, e anote o commit:

```powershell
git status --short; git branch --show-current; git log -1 --format=%h
```

3. Confira que os três segredos ainda existem (só nomes):

```powershell
npx supabase secrets list --project-ref yclkzyoebpsxmgpbcbus
```

Devem aparecer `EP_DRIVE_CONTA_JSON_BASE64`, `EP_DRIVE_RAIZ_ID` e `EP_ORIGENS_ACEITAS`. Se faltar algum, refaça o passo 3 do roteiro antigo.

4. Publique a função:

```powershell
npx supabase functions deploy arquivos-no-drive --use-api --project-ref yclkzyoebpsxmgpbcbus
```

5. Confira no painel do Supabase de desenvolvimento, em **Authentication → Sign In / Providers**, **ligue o Email** (o backlog registra que ele já foi desligado, em 2026-10-19; o script entra com e-mail e senha, então precisa dele ligado). Confira também os usuários `prova.integrante@ccivil.pr.gov.br` e `prova.consulta@ccivil.pr.gov.br`: o backlog manda desativá-los, então talvez estejam desativados. Se estiverem, reative na Administração; se não existirem mais, refaça o passo 5 do roteiro antigo (autorizar os e-mails no SQL Editor e criar os dois em Authentication → Users, com senha inventada e Auto Confirm). Todo esse passo é desfeito no D.
6. Confira que há pelo menos um processo **em andamento** sem versão nova (a prova da versão histórica só roda nesse caso; se não houver, o passo sai como "pulado", o que é aceitável).

## B. Rodar o script

```powershell
node scripts/prova-do-drive.mjs
```

Ele pede e-mail e senha de cada usuário inventado na hora. **Cole a saída inteira**, inclusive as linhas do Integrante. Esperado: todas as linhas `OK`, incluindo as de versão histórica e relatório sozinho. Qualquer `FALHOU` ou linha "pulado": cole assim mesmo, não tente corrigir.

## C. Conferências à mão

Use o processo inventado da prova (o que já tem pasta no Drive "EP – desenvolvimento"). Em cada passo, anote o que viu.

### C1. Troca de sigla do setor (ticket 08, critério 3)

1. Na Administração, troque a sigla do setor desse processo (por exemplo, acrescente "X" no fim).
2. Envie uma versão nova nesse processo.
3. No Drive, confira: a **pasta do setor** foi renomeada para a sigla nova (é a mesma pasta, não uma segunda).
4. Volte a sigla ao valor original e confira de novo (se a plataforma mexer na pasta de novo, anote).

### C2. Mudança de setor do processo (ticket 08, critério 4)

1. Mude o processo para outro setor (se ele já tiver pasta e versões, melhor).
2. Envie uma versão nova.
3. No Drive, confira: a **pasta do processo** foi movida para dentro da pasta do novo setor (criada, se faltava), sem duplicar.

### C3. Retirada de anexo manda para a lixeira (ADR 0027)

1. Num processo, anexe um arquivo de teste (inventado) pela tela.
2. Retire o anexo pela tela.
3. No Drive, abra a **lixeira** do Drive compartilhado: o arquivo deve estar lá (não apagado de vez). Se a retirada falhar com "Não foi possível falar com o Drive", a conta de serviço está sem o papel de **Gerente de conteúdo**: confira no Drive e anote.
4. Opcional: restaure o arquivo pela lixeira do próprio Drive.

### C4. Acrescentar arquivo à versão e recusa na versão aprovada

1. Numa versão ainda não aprovada, acrescente um `.png` ou `.bpmn` (botão da etapa). Confira que aparece na lista da versão.
2. Numa versão **aprovada**, tente acrescentar. Deve ser recusado pela plataforma.
3. Se a tela não tiver o botão como descrito, diga o que apareceu em vez de improvisar.

## D. Arrumação (seção 7 do roteiro antigo)

Só depois de colar tudo acima:

1. No Drive "EP – desenvolvimento", apague os arquivos de teste (`_V99_` e os anexos de teste). As pastas podem ficar.
2. Desative os dois usuários inventados na Administração.
3. No painel do Supabase de desenvolvimento, desligue de novo o **Email** (Authentication → Sign In / Providers), que o A.5 ligou.

## E. O que eu faço quando você colar

- Conferir a saída contra os critérios dos tickets 01, 02, 04, 05 e 08 de `documentos-versoes` e contra as ressalvas de `revisoes-aprovacao` e `repositorio-de-processos`.
- Gravar o resultado em `.scratch/documentos-versoes/prova-do-drive.md` (seção nova, datada) e registrar no `desvios.md`. As marcas `Entregue em` antigas não se editam; o que ficar provado aparece nas entradas novas.
- Tirar a linha da seção 7 do `.scratch/backlog.md` depois de você confirmar o passo D.
- Qualquer `FALHOU` vira ticket ou backlog, pelo `/demanda`.

Modelo para a próxima sessão: Sonnet (conferir saída e gravar registros).
