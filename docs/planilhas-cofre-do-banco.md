# Planilhas dos dashboards: gravar o cofre do banco (roteiro do usuário)

Passos que só o usuário faz, fora da sessão, para o banco saber onde estão as duas planilhas e como chamar a função que as escreve (ADR 0018). Nenhum valor real vai para a conversa, para o código nem para o git: este roteiro traz só marcadores `<…>`.

Termos usados aqui:

- **Cofre (Vault):** o lugar do banco onde os segredos ficam guardados, cifrados. Só o próprio banco os lê; a tela nunca recebe a senha.
- **SQL Editor:** a tela do painel do Supabase onde se roda um comando no banco.
- **Planilha interna e planilha pública:** as duas planilhas do Google que a plataforma reescreve todo dia às 6h. A interna é da equipe; a pública só tem contagens.
- **Identificador da planilha:** o trecho do endereço da planilha entre `/d/` e `/edit`.
- **Senha interna:** uma senha inventada por você, que o banco envia à função em cada atualização. A função só trabalha se a senha vier certa.

Este roteiro vale para o projeto de **desenvolvimento**. A produção ainda não existe; quando existir, o roteiro de publicação do `/ship` repete estes passos lá.

## Passos

1. No Drive compartilhado **EP – desenvolvimento** (ver `docs/drive-conta-de-servico.md`), crie duas planilhas do Google em branco: **EP – planilha interna (dev)** e **EP – planilha pública (dev)**.
2. Abra a planilha interna e copie o identificador dela: o trecho do endereço entre `/d/` e `/edit`. Anote.
3. Faça o mesmo com a planilha pública e anote o segundo identificador.
4. Invente uma senha interna longa (mais de 30 caracteres, só letras e números) e guarde-a no gerenciador de senhas. Ela também será cadastrada como segredo da função no ticket 03.
5. Abra o SQL Editor do projeto de desenvolvimento: https://supabase.com/dashboard/project/yclkzyoebpsxmgpbcbus/sql/new
6. Cole o comando abaixo, troque `<identificador-da-planilha-interna>` pelo valor do passo 2 e rode:

   ```sql
   select vault.create_secret('<identificador-da-planilha-interna>', 'planilhas_id_interna');
   ```

7. Cole o comando abaixo, troque `<identificador-da-planilha-publica>` pelo valor do passo 3 e rode:

   ```sql
   select vault.create_secret('<identificador-da-planilha-publica>', 'planilhas_id_publica');
   ```

8. Cole o comando abaixo, troque `<senha-interna>` pela senha do passo 4 e rode:

   ```sql
   select vault.create_secret('<senha-interna>', 'planilhas_senha_interna');
   ```

9. Cole o comando abaixo, sem trocar nada, e rode (é o endereço da função das planilhas neste projeto):

   ```sql
   select vault.create_secret('https://yclkzyoebpsxmgpbcbus.supabase.co/functions/v1/planilhas-dos-dashboards', 'planilhas_endereco_da_funcao');
   ```

10. Confira que os quatro nomes estão no cofre (a consulta não mostra os valores):

    ```sql
    select name from vault.secrets where name like 'planilhas\_%' order by name;
    ```

    Devem aparecer: `planilhas_endereco_da_funcao`, `planilhas_id_interna`, `planilhas_id_publica` e `planilhas_senha_interna`.
11. Na plataforma, abra **Administração → Planilhas**: os links das duas planilhas devem aparecer e o botão **Atualizar planilhas agora** deve estar ligado. Se aparecer "As planilhas ainda não foram configuradas neste ambiente.", falta um dos quatro nomes do passo 10.

## Trocar um valor depois

1. No SQL Editor, rode `select id, name from vault.secrets where name = '<nome>';` e anote o `id` (o nome é um dos quatro do passo 10).
2. Rode `select vault.update_secret('<id>', '<novo-valor>');`, com o `id` do passo anterior e o novo valor.

## O que ainda não existe (ticket 03)

Até o ticket 03, um pedido de atualização é registrado e enviado, mas **nada escreve nas planilhas**: a tentativa fica "Em andamento" e passa a "Sem resposta" depois de 10 minutos. O ticket 03 traz a função, o segredo novo dela (a mesma senha interna, cadastrada com `npx supabase secrets set`, por você) e o passo de ligar a API do Google Planilhas (Sheets) no projeto do Google Cloud.
