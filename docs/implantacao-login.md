# Implantação do login (Google institucional)

Passo a passo para ligar o login em cada ambiente: desenvolvimento agora, produção depois. Decisão de origem: `docs/adr/0001-login-google-institucional-com-autorizacao.md`.

Nada deste roteiro vai para o git nem para conversas: identificador e segredo do Google ficam só no painel do Supabase, e o e-mail do primeiro administrador só no SQL Editor.

Nos passos abaixo, `<ref>` é o identificador do projeto Supabase do ambiente (ver `supabase/AMBIENTES.md`) e `<endereço do site>` é `http://localhost:5173` no desenvolvimento ou o endereço publicado em produção.

## Antes: a migração do login

A migração `supabase/migrations/20261007200505_login_perfis.sql` precisa estar aplicada no ambiente. Ela cria as tabelas e as duas barreiras do banco:

- **Gancho "antes de criar usuário"** (`private.antes_de_criar_usuario`): o Supabase o chama antes de criar qualquer conta. Ele recusa e-mail fora de `@ccivil.pr.gov.br` (motivo `fora_do_dominio`) e e-mail sem autorização (motivo `sem_autorizacao`). A tela de entrada traduz o motivo em mensagem.
- **Gatilho de primeiro acesso** (`private.registrar_primeiro_acesso`): transforma a autorização em usuário. Se não houver autorização, ele também recusa, então o banco continua fechado mesmo que o gancho esteja desligado.

Escolha registrada em 2026-10-07: gancho do Supabase Auth como barreira principal (devolve a mensagem própria), conferido na documentação atual, e gatilho como segunda barreira.

## 1. Google Cloud: cliente OAuth

1. Em console.cloud.google.com, com a conta institucional, crie (ou escolha) um projeto para a plataforma.
2. Em **APIs e serviços → Tela de consentimento OAuth** (ou "Google Auth Platform → Público-alvo"), escolha o público **Interno**, se a organização permitir. Interno significa que só contas da organização conseguem entrar. Se só aparecer "Externo", use-o no modo de teste e cadastre apenas a sua própria conta como usuária de teste.
3. Em **Credenciais → Criar credenciais → ID do cliente OAuth**, tipo **Aplicativo da Web**:
   - Origens JavaScript autorizadas: `<endereço do site>`.
   - URIs de redirecionamento autorizados: `https://<ref>.supabase.co/auth/v1/callback`.
4. Guarde o **ID do cliente** e a **chave secreta do cliente** só até colá-los no passo 2.

## 2. Painel do Supabase: Authentication

1. **Sign In / Providers → Google**: ligue, cole o ID do cliente e a chave secreta, salve.
2. **Sign In / Providers → Email**: desligue (ninguém entra por e-mail e senha).
3. **Sign In / Providers → "Allow new users to sign up"**: **ligado**. Sem isso, o primeiro acesso pelo Google não cria a conta; quem barra é o banco.
4. **URL Configuration**: Site URL = `<endereço do site>`; em Redirect URLs, acrescente `<endereço do site>`.

## 3. Painel do Supabase: gancho

**Authentication → Hooks → Before User Created** → tipo **Postgres** → schema `private`, função `antes_de_criar_usuario` → salvar.

Se o painel não listar o schema `private`, pare e registre: a função não deve ser movida para `public` sem uma decisão, porque lá ela ficaria exposta pela API.

## 4. SQL Editor: primeiro administrador

Uma vez por ambiente, antes do primeiro acesso:

```sql
-- Primeiro administrador: troque <meu-email> pelo seu e-mail institucional e rode uma vez.
insert into public.autorizacoes (email, perfil)
values (lower(btrim('<meu-email>')), 'administrador');
```

Depois disso, entre na plataforma com essa conta. A autorização vira usuário administrador, e os demais usuários são autorizados pela própria plataforma.

## 5. Conferência

- Entrar com a conta autorizada: abre o Quadro de processos com o seu avatar na barra superior.
- Abrir o menu do avatar: nome, perfil "Administrador" e Sair.
- Sair: volta à tela de entrada.
- Entrar com uma conta fora do domínio (por exemplo, pessoal): a entrada é recusada com a mensagem "Use sua conta @ccivil.pr.gov.br…".
