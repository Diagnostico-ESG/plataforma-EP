# Roteiro de produção (preparado em 2026-11-04)

Segue o `/ship` (roteiros "Publicar no banco de produção", "Publicar o site", "Backup e restauração" e "Revisão de segurança para produção") e `docs/manutencao/02-publicacao.md`. Nada aqui foi executado: a produção ainda não existe (`supabase/AMBIENTES.md`). Cada passo marcado **[você]** é seu, no seu terminal ou nos painéis; **[eu]** é meu, com a sua aprovação no momento. Chave, senha e cadeia de conexão nunca vêm para a conversa.

## O que existe e o que falta (estado de hoje)

- Banco: 78 migrações, todas ainda sem publicar em produção. O `db push` aplica todas de uma vez.
- Funções do servidor: `arquivos-no-drive` e `planilhas-dos-dashboards`.
- Drive "EP – produção" já criado no Drive do CED, com a conta de serviço como Gerente de conteúdo (roteiro de 2026-10-16). Falta conferir.
- Faltam: projeto Supabase de produção, hospedagem do site (decisão em aberto), `.scratch/pre-producao.md` (revisão de pré-produção) e `.scratch/publicacao.md`.
- Funcionalidades: todas com `Entregue em`. A correção do anexo (9ae4820) mexeu em `supabase/functions/` e pede um `/ship` próprio (marca nova na spec de `documentos-versoes`).
- Pendências de prova no Drive real (C3, C4 e arrumação D de `documentos-versoes/roteiro-prova-final.md`): ficaram para depois por decisão sua. O anexo corrigido não foi visto funcionando no Drive real.

## Decisões suas antes de começar

1. **Hospedagem do site** (Netlify, Vercel ou outra) e o endereço. Precisa atender à exigência de região ou nuvem do `.scratch/projeto.md`, que o jurídico e a TI ainda não validaram (backlog).
2. **Revisão de segurança para produção:** o `/ship` exige para a primeira publicação. Dispensar só por decisão sua explícita, que eu registro em `.scratch/pre-producao.md` como "Publicação sem revisão decidida em AAAA-MM-DD". Recomendo fazer, porque o projeto tem dado pessoal (LGPD) e login.
3. **Login em produção:** o cliente OAuth do Google hoje está num projeto pessoal ("arranjo provisório", `docs/implantacao-login.md`). Decida se produção sai com ele ou com um projeto institucional.

## Ordem

### 1. Fechar o código (Sonnet) [eu]
- `/ship` da correção do anexo (revisão de segurança: a função mudou; vai ser a de reserva se o `/security-review` não achar diff).
- Marca nova em `documentos-versoes` e marco de entrega.

### 2. Revisão de pré-produção (Opus na revisão de segurança) [eu + você]
Marco `marco/AAAA-MM-DD-pre-producao`; banco (testes, RLS, views, funções, buckets); busca de chaves no código e no histórico; script pela API com os perfis; `/security-review` (você digita) ou a de reserva; `security-auditor` em `.scratch/security.md`; inventário em `.scratch/lgpd-inventario.md`; registro em `.scratch/pre-producao.md`. Achado que bloqueia (chave exposta, tabela sem RLS, bucket público) impede a publicação.

### 3. Criar a produção [você]
Projeto Supabase novo, região São Paulo (sa-east-1). Me passe só o ref. Eu registro em `AMBIENTES.md`.

### 4. Painel de produção, antes de qualquer `db push` [você, item a item comigo]
- Cadastro aberto **desligado** (o projeto novo nasce ligado).
- Provedor **Email desligado** (login é só Google).
- SMTP próprio, se algum e-mail do Supabase for usado.
- Endereços de redirecionamento só os do site (se o site ainda não existe, fica "pendente" para o passo 8).
- Plano e backup (o gratuito não tem backup automático), região, membros da equipe.
- Tudo registrado em `.scratch/pre-producao.md`.

### 5. Publicar o banco
1. **[eu, com sua aprovação]** Listo as 78 migrações, as destrutivas e confirmo que nenhuma é de funcionalidade sem `Entregue em`. Atualizo o vínculo em `AMBIENTES.md` para produção.
2. **[você]** `npx supabase login` (se pedir) e `npx supabase link --project-ref <ref-producao>`. A senha do banco, se pedida, é só sua.
3. Sem backup na primeira vez (banco vazio). **[eu, com sua aprovação]** `npx supabase db push`.
4. **[você]** Volta o vínculo: `npx supabase link --project-ref yclkzyoebpsxmgpbcbus`. Eu atualizo `AMBIENTES.md` (última migração publicada, vínculo de volta ao desenvolvimento).
5. Enquanto o vínculo estiver em produção, eu só rodo `db push` e `functions deploy`. Nada de `npm run test:db`, `db reset` ou `migration up`.

### 6. Segredos e funções [você os valores; eu o deploy, com aprovação]
Segredos de produção (`npx supabase secrets set ... --project-ref <ref-producao>`):
- `EP_DRIVE_CONTA_JSON_BASE64` (a mesma chave `dados-reais/ep-drive.json`, comando do passo 3 de `docs/drive-conta-de-servico.md`);
- `EP_DRIVE_RAIZ_ID` (o identificador do Drive **EP – produção**, não o de desenvolvimento);
- `EP_ORIGENS_ACEITAS` (o endereço do site publicado, não `localhost`);
- `EP_PLANILHAS_SENHA` e `EP_CHAVE_PUBLICAVEL` (a função das planilhas; ver `docs/planilhas-publicar-a-funcao.md` e `docs/planilhas-cofre-do-banco.md`, que repetem os passos em produção, com os ids das duas planilhas de produção).

Depois, `npx supabase functions deploy arquivos-no-drive --use-api --project-ref <ref-producao>` e o mesmo para `planilhas-dos-dashboards`. Cada função ganha um teste de recusa para usuário sem permissão (entrego o comando).

### 7. Login e primeiro administrador [você]
Segue `docs/implantacao-login.md` para produção: cliente OAuth do Google com o endereço de redirecionamento de produção, Authentication → Providers → Google no painel, gancho de autorização e o SQL do primeiro administrador (eu entrego com marcador no lugar do e-mail). Confira entrar e sair.

### 8. Publicar o site
- `.scratch/publicacao.md` criado (hospedagem, endereço, variáveis).
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` **de produção** na hospedagem (você configura; eu não leio os valores).
- **[eu]** `npm run build`; busca de `sb_secret_`, `service_role` e (se o build for no seu computador) do ref de desenvolvimento no `dist/`.
- Publica pelo método da hospedagem, com sua aprovação. Você abre o endereço, confere a página inicial e entrar/sair. Marco `marco/AAAA-MM-DD-publicacao`.
- Volta aos redirecionamentos do passo 4 se ficaram "pendentes".

### 9. Backup e prova de restauração [você; eu entrego os comandos]
Antes de a produção receber dado real: backup do banco (e dos arquivos do Storage, se houver) e teste de restauração num projeto Supabase separado. Registro em `AMBIENTES.md`. Sem Docker na máquina, o `db dump` não roda: valem o backup do painel (planos pagos) ou o `pg_dump`.

### 10. Primeira conferência com dado de verdade [você]
Com seu login: criar um processo, enviar uma versão e um anexo pelo Drive de produção, retirar o anexo (lixeira) e conferir a pasta no Drive "EP – produção". É a prova que o C3 e o C4 do desenvolvimento deixaram pendente; a feita em produção vale mais, mas use dado inventado e apague depois.

## Riscos que sigo vendo
- Anexo corrigido sem prova no Drive real. Se falhar em produção, não perde dado (a recusa deixa um arquivo solto, sem anexo gravado), mas o recurso não funciona.
- Provas no Drive real de `documentos-versoes` com ressalva aberta (ressalvas de `revisoes-aprovacao` e `repositorio-de-processos` também).
- Critérios `[visual]` de várias entregas presumidos (a tela nunca foi vista com o login real em 1366×768).
- Sem decisão de hospedagem nem validação jurídica da nuvem externa.
