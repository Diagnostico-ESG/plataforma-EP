# Planilhas dos dashboards: publicar a função e conferir (roteiro do usuário)

Passos que só o usuário faz, fora da sessão, para a plataforma escrever de verdade as duas planilhas do Google (ADRs 0017 e 0018). Nenhuma senha nem chave vem para a conversa, para o código nem para o git: este roteiro traz só marcadores `<…>`.

Termos usados aqui:

- **Função das planilhas (`planilhas-dos-dashboards`):** o pequeno programa, no servidor do Supabase, que recebe os dados do banco e reescreve as duas planilhas.
- **API do Google Planilhas (Sheets):** o serviço do Google que a função usa para escrever na planilha. Precisa estar ligado no projeto do Google Cloud.
- **Conta de serviço:** o "usuário robô" do Google (`ep-drive` no roteiro; no seu projeto pode ter outro nome, como `ep-dev`: vale o e-mail, ver `docs/drive-conta-de-servico.md`). Ela já é membro do Drive compartilhado **EP – desenvolvimento** e, por isso, já alcança as planilhas criadas lá.
- **Segredo da função:** um valor guardado no Supabase, que só a função lê.
- **Senha interna:** a senha que o banco envia à função em cada pedido. A função só trabalha se ela vier certa. É a mesma que você já gravou no cofre do banco (passo 4 de `docs/planilhas-cofre-do-banco.md`).
- **Chave publicável:** a chave do projeto que a própria plataforma já usa no navegador (`sb_publishable_…`). Não é secreta. A função a usa só para devolver ao banco o resultado da atualização.

Este roteiro vale para o projeto de **desenvolvimento**. A produção ainda não existe; quando existir, o roteiro de publicação do `/ship` repete estes passos lá.

## Antes de começar

1. Faça antes o roteiro do cofre: `docs/planilhas-cofre-do-banco.md`, passos 1 a 11. Sem ele, a aba **Planilhas** diz que o ambiente não foi configurado.
2. No terminal (PowerShell), na pasta do projeto, confira que o vínculo é o projeto de desenvolvimento:

```powershell
Get-Content supabase\.temp\project-ref
```

O resultado deve ser `yclkzyoebpsxmgpbcbus`. Se for outro, pare. Se a CLI pedir login nos passos abaixo, rode antes `npx supabase login`.

## 1. Ligar a API do Google Planilhas

1. Abra https://console.cloud.google.com/apis/library/sheets.googleapis.com
2. No seletor de projeto, no alto da página, escolha o **mesmo projeto** em que você ativou a Google Drive API e criou a conta `ep-drive`.
3. Clique em **Ativar**. Se aparecer **Gerenciar**, a API já estava ligada.

## 2. Gravar os dois segredos novos da função

1. Abra https://supabase.com/dashboard/project/yclkzyoebpsxmgpbcbus/settings/api-keys e copie a **chave publicável** (começa com `sb_publishable_`). Ela é a mesma de `VITE_SUPABASE_PUBLISHABLE_KEY` no seu `.env.local`.
2. Tenha à mão a **senha interna** do gerenciador de senhas (a do passo 4 do roteiro do cofre).
3. Rode o comando abaixo, trocando `<senha-interna>` e `<chave-publicavel>`:

```powershell
npx supabase secrets set EP_PLANILHAS_SENHA=<senha-interna> EP_CHAVE_PUBLICAVEL=<chave-publicavel> --project-ref yclkzyoebpsxmgpbcbus
```

4. Confira só os nomes (a lista mostra um resumo, não o valor):

```powershell
npx supabase secrets list --project-ref yclkzyoebpsxmgpbcbus
```

Devem aparecer `EP_PLANILHAS_SENHA` e `EP_CHAVE_PUBLICAVEL`, além de `EP_DRIVE_CONTA_JSON_BASE64`, que já existe (a função das planilhas usa a mesma conta de serviço).

## 3. Publicar a função no projeto de desenvolvimento

1. Rode:

```powershell
npx supabase functions deploy planilhas-dos-dashboards --use-api --no-verify-jwt --project-ref yclkzyoebpsxmgpbcbus
```

O `--use-api` monta a função nos servidores do Supabase, sem Docker, e usa só a porta 443. O `--no-verify-jwt` é de propósito: quem chama a função é o banco, sem login; a própria função confere a senha interna antes de qualquer trabalho.

2. Confira que ela aparece em https://supabase.com/dashboard/project/yclkzyoebpsxmgpbcbus/functions

## 4. Atualizar as planilhas pela plataforma

1. Entre na plataforma como **Administrador** e abra **Administração → Planilhas**.
2. Confira que os dois links aparecem e que o botão **Atualizar planilhas agora** está ligado.
3. Clique em **Atualizar planilhas agora**. A tentativa aparece como **Em andamento** e, em alguns segundos, passa a **Concluída**.
4. Abra a **planilha interna** pelo link da aba. Devem existir as abas **Processos** e **Fases**, com os processos de desenvolvimento e uma linha por processo e fase (I a VII) na aba **Fases**.
5. Abra a **planilha pública** pelo link da aba. Devem existir as abas **Resumo** (total de processos, total de setores e a data e hora da atualização) e **Fases** (concluídos e total de cada fase I a VII).
6. Confira que a planilha pública não tem nome de processo, de setor nem de pessoa.
7. Confira que a planilha interna não tem nome de pessoa (nem de responsável) em nenhuma aba.
8. Anote o que viu e traga para a conversa só o que for número ou frase da plataforma (contagens, "Concluída", cabeçalhos das abas), sem copiar dados das linhas.

A aba de fábrica "Planilha1" (ou "Sheet1") pode ficar como está; a função não mexe nela.

## 5. Provocar uma falha de teste

Serve para conferir que uma falha aparece com a frase do motivo e que a planilha que falhou fica como estava. A planilha interna é escrita primeiro, então ela já estará nova.

1. Abra o SQL Editor do desenvolvimento: https://supabase.com/dashboard/project/yclkzyoebpsxmgpbcbus/sql/new
2. Troque o identificador da planilha pública por um que não existe (o comando acha o segredo sozinho, sem copiar `id`):

```sql
select vault.update_secret((select id from vault.secrets where name = 'planilhas_id_publica'), 'identificador-que-nao-existe');
```

3. Confira que a troca valeu. O resultado deve ser `true`:

```sql
select (decrypted_secret = 'identificador-que-nao-existe') as trocado from vault.decrypted_secrets where name = 'planilhas_id_publica';
```

4. Na plataforma, em **Administração → Planilhas**, clique em **Atualizar planilhas agora**.
5. A tentativa deve terminar como **Falhou**, com o motivo **O Google recusou a escrita na planilha pública.** A planilha interna continua escrita; a pública continua como estava.
6. Devolva o identificador certo (troque `<identificador-da-planilha-publica>` pelo da planilha pública, o do passo 3 do roteiro do cofre):

```sql
select vault.update_secret((select id from vault.secrets where name = 'planilhas_id_publica'), '<identificador-da-planilha-publica>');
```

7. Clique em **Atualizar planilhas agora** de novo: deve terminar como **Concluída**.

## Se algo não der certo

| O que aparece | O que quase sempre é |
| --- | --- |
| A tentativa fica **Em andamento** e vira **Sem resposta** depois de 10 minutos | A função não foi publicada, ou a senha interna dela (`EP_PLANILHAS_SENHA`) é diferente da do cofre. Veja o item A abaixo |
| **Falhou** com "O Google recusou a escrita na planilha interna." (ou pública) | A API do Google Planilhas não está ligada (passo 1), a planilha não está no Drive compartilhado onde a conta de serviço é membro, ou o identificador no cofre está errado |
| **Falhou** com "O Google não respondeu." | O Google ficou fora do ar ou limitou as chamadas; clique de novo em alguns minutos |
| **Falhou** com "O pedido enviado à atualização estava incompleto." | O banco e a função estão em versões diferentes; publique a função de novo (passo 3) |
| **Falhou** com "A atualização falhou por um motivo não identificado." | Erro inesperado da função; veja o item B abaixo |

**A. O que o banco recebeu da função.** No SQL Editor, rode (não mostra nenhum dado dos processos):

```sql
select status_code, error_msg, created from net._http_response order by created desc limit 5;
```

`401` quer dizer que a senha interna da função é diferente da do cofre. `404` quer dizer que a função não está publicada com esse nome. `202` quer dizer que a função aceitou o pedido.

**B. Registros da função.** Abra https://supabase.com/dashboard/project/yclkzyoebpsxmgpbcbus/functions/planilhas-dos-dashboards/logs . Os registros trazem só o tipo do erro, nunca nome de processo nem identificador de planilha.
