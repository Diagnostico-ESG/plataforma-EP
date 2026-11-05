# Criar o projeto Supabase de produção (2026-11-05)

Passo 3 e começo do passo 4 de `.scratch/roteiro-producao.md`. Tudo aqui é **seu**, no painel do Supabase. Os nomes dos menus podem mudar um pouco; se algum não bater com a tela, diga o que aparece.

Regra de ouro: a senha do banco nunca vem para a conversa. Só o **ref** (identificador do projeto, não é segredo).

## 1. Criar o projeto

1. Entre em https://supabase.com/dashboard com a mesma conta do desenvolvimento e abra a mesma organização do `plataforma-ep-dev`.
2. Clique em **New project**.
3. Preencha:
   - **Name:** `plataforma-ep-prod` (deixa claro que é produção).
   - **Database password:** gere uma senha forte e guarde no seu gerenciador de senhas. Ela é só sua.
   - **Region:** **South America (São Paulo)**, a mesma do desenvolvimento (`sa-east-1`), como fixa o resumo do projeto.
4. **Plano:** o gratuito não faz backup automático. Para dado real, o plano Pro tem backup diário. Se a organização ainda for gratuita, decida com a TI antes de abrir a produção. Dá para criar agora e trocar depois.
5. Clique em **Create new project** e espere ficar pronto (cerca de 2 minutos).

## 2. Pegar o ref

- Em **Project Settings → General**, copie o **Reference ID** (cerca de 20 letras minúsculas). Ele também aparece no endereço do painel, depois de `/project/`.
- Me mande só o ref. Eu registro em `supabase/AMBIENTES.md`.

## 3. Fechar o cadastro aberto (antes de qualquer outra coisa)

O projeto novo nasce com cadastro aberto: qualquer pessoa poderia criar conta.

1. Vá em **Authentication → Sign In / Providers**.
2. Desligue o cadastro aberto (opção **Allow new users to sign up**).
3. Confira que o provedor **Email** está desligado. O login é pelo Google, que você liga só no passo de login.

## 4. O que vem depois (item a item comigo)

Depois que eu receber o ref, conduzimos um item por vez, registrando em `.scratch/pre-producao.md`:

- SMTP próprio, se algum e-mail do Supabase for usado.
- Endereços de redirecionamento só os do site (fica "pendente" até o endereço da Netlify existir).
- Plano e backup, região, membros da equipe.

Só então vêm as etapas 5 a 10 do `roteiro-producao.md` (`db push`, segredos e funções, login, site, backup, primeira conferência), cada uma com a sua aprovação no momento.

## Ainda preciso de você

- O ref do projeto de produção.
- O endereço do site na Netlify.
- Qual projeto do Google vai no login (o pessoal "arranjo provisório" ou um institucional).
