# Ligação com o Drive: roteiro do usuário

Passos que só o usuário faz, fora da sessão, para a plataforma guardar os arquivos das versões no Drive compartilhado do CED (ADR 0008). A chave da conta de serviço nunca vem para a conversa, para o código nem para o git.

Termos usados aqui:

- **Conta de serviço:** um "usuário robô" do Google, sem pessoa por trás, que a plataforma usa para entrar no Drive.
- **Chave da conta de serviço:** um arquivo JSON que funciona como a senha desse robô. Quem tem o arquivo age como o robô.
- **Drive compartilhado:** um Drive da instituição, e não de uma pessoa. Os arquivos continuam lá quando alguém sai da equipe.
- **Segredo:** um valor guardado no projeto Supabase, que só a função do servidor lê.
- **Edge Function (função do servidor):** um pequeno programa que roda no Supabase, e não no navegador. É o único lugar onde a chave do robô fica.

## 1. Criar a conta de serviço (Google Cloud)

1. Abra o console do Google Cloud e escolha o projeto pessoal que já é usado no login da plataforma.
2. Em **APIs e serviços → Biblioteca**, procure **Google Drive API** e clique em **Ativar**.
3. Em **IAM e administrador → Contas de serviço**, clique em **Criar conta de serviço**. Use o nome `ep-drive`. Não é preciso dar nenhum papel no projeto: pule os passos opcionais.
4. Abra a conta criada, vá à aba **Chaves**, clique em **Adicionar chave → Criar nova chave → JSON**. O navegador baixa um arquivo `.json`.
5. Mova esse arquivo para a pasta `dados-reais/` do projeto, com o nome `ep-drive.json`. Essa pasta fica fora do git. Não abra o arquivo na conversa com o Claude.
6. Anote o e-mail da conta de serviço, mostrado na lista de contas de serviço (termina em `.iam.gserviceaccount.com`). Ele vai no passo 2.

Se o Google recusar a criação da chave por uma política da organização, pare e traga a mensagem para a conversa (sem o arquivo).

## 2. Criar os Drives compartilhados (Drive do CED)

1. No Google Drive do CED, clique em **Novo → Drive compartilhado** e crie **EP – desenvolvimento**. Repita para **EP – produção**.
2. Em cada um, abra **Gerenciar membros** e adicione o e-mail da conta de serviço com o papel **Gerente de conteúdo**. Desmarque o aviso por e-mail.
   - Por que esse papel: o Gerente de conteúdo inclui, edita e move arquivos e pastas, e só manda para a lixeira (não apaga de vez). O Colaborador não move pastas, e a plataforma precisa mover a pasta quando um processo muda de setor. O Administrador pode apagar de vez, o que a plataforma não precisa. Fonte: página de ajuda do Google "Níveis de acesso nos drives compartilhados" (support.google.com/a/users/answer/12380484).
3. Mantenha as permissões da equipe direto no Drive: Integrantes como **Colaborador**, você como **Administrador**. A plataforma não sincroniza membros.
4. Abra o **EP – desenvolvimento** no navegador e copie o trecho final do endereço, depois de `/folders/`. Esse é o **identificador do Drive de desenvolvimento**.

Se o CED não permitir criar Drive compartilhado, use uma pasta dentro de um Drive compartilhado que já exista. O identificador será o dessa pasta.

## 3. Gravar os segredos no projeto de desenvolvimento

No seu terminal (PowerShell), na pasta do projeto. Se a CLI pedir login, rode antes `npx supabase login`.

1. Confira que o vínculo é o projeto de desenvolvimento:

```powershell
Get-Content supabase\.temp\project-ref
```

O resultado deve ser `yclkzyoebpsxmgpbcbus`. Se for outro, pare.

2. Grave a chave da conta de serviço. O comando transforma o arquivo em texto base64 e o grava sem mostrá-lo na tela:

```powershell
$conta = [Convert]::ToBase64String([IO.File]::ReadAllBytes("dados-reais\ep-drive.json")); npx supabase secrets set "EP_DRIVE_CONTA_JSON_BASE64=$conta" --project-ref yclkzyoebpsxmgpbcbus; Remove-Variable conta
```

3. Grave o identificador do Drive de desenvolvimento (troque `<identificador>`) e o endereço do site local:

```powershell
npx supabase secrets set EP_DRIVE_RAIZ_ID=<identificador> EP_ORIGENS_ACEITAS=http://localhost:5173 --project-ref yclkzyoebpsxmgpbcbus
```

4. Confira só os nomes (a lista mostra um resumo, e não o valor):

```powershell
npx supabase secrets list --project-ref yclkzyoebpsxmgpbcbus
```

Devem aparecer `EP_DRIVE_CONTA_JSON_BASE64`, `EP_DRIVE_RAIZ_ID` e `EP_ORIGENS_ACEITAS`.

## 4. Publicar a função no projeto de desenvolvimento

```powershell
npx supabase functions deploy arquivos-no-drive --use-api --project-ref yclkzyoebpsxmgpbcbus
```

O `--use-api` monta a função nos servidores do Supabase, sem Docker. Ele só usa a porta 443, então funciona na rede do escritório.

## 5. Usuários inventados para a prova

A prova precisa de dois usuários inventados que entrem com e-mail e senha: um Integrante e um Consulta.

1. No painel do Supabase de desenvolvimento, abra **Authentication → Sign In / Providers** e confira que **Email** está ligado. O cadastro aberto continua desligado.
2. No **SQL Editor**, autorize os dois:

```sql
insert into public.autorizacoes (email, perfil) values
  ('prova.integrante@ccivil.pr.gov.br', 'integrante_ep'),
  ('prova.consulta@ccivil.pr.gov.br', 'consulta');
```

3. Em **Authentication → Users → Add user → Create new user**, crie os dois com uma senha inventada e marque **Auto Confirm User**. A linha de cada um em `usuarios` nasce sozinha, com o perfil da autorização.
4. Confira que há pelo menos um processo **em andamento** no desenvolvimento. A prova envia o arquivo de teste para a pasta dele.

## 6. Rodar a prova

```powershell
node scripts/prova-do-drive.mjs
```

O script pede o e-mail e a senha de cada usuário inventado na hora, e não grava nem mostra nenhum dos dois. Ele imprime só "OK" ou "FALHOU" de cada passo, o código devolvido pela função e o nome do arquivo de teste. Copie as linhas impressas para a conversa.

## 7. Depois da prova

1. No **EP – desenvolvimento**, apague o arquivo de teste (o nome tem `_V99_`). As pastas do setor e do processo podem ficar.
2. Desative os dois usuários inventados na Administração da plataforma. Quem já entrou não se exclui (ADR 0002).
3. Guarde o `dados-reais/ep-drive.json` fora do computador do escritório, se a política do CED pedir. Ele vai ser usado de novo na publicação em produção, pelo roteiro do `/ship`.
