# Revisão de pré-produção

Revisão de segurança para produção (roteiro do `/ship`), iniciada em 2026-11-05. Marco: `marco/2026-11-05-pre-producao`. Hospedagem decidida: Netlify.

## Feito nesta sessão (2026-11-05, commit de partida 4a1f62c)

### Banco (passo 2)
- **Testes:** "Testes de banco" (GitHub Actions) verde no push de 9ae4820, que roda os 77 arquivos de `supabase/tests/`, incluindo `00_rls_ligada`, `01_buckets_privados` e `46_funcoes_e_views_seguras`. Não repeti no Docker local.
- **Tabelas:** as 24 criadas pelas migrações têm RLS ligada (lista de `create table` e de `enable row level security` idênticas).
- **Views:** as 2 views (`processos_com_andamento`, `resultado_das_atualizacoes_das_planilhas`) nascem com `security_invoker = true` em todas as migrações; o teste 46 confere o catálogo.
- **Funções `security definer`:** quase todas em `private`. Em `public`, só `registrar_resultado_das_planilhas`, exceção decidida (ADR 0018): a função das planilhas devolve o resultado sem login, protegida por ficha de uso único conferida por hash; o teste 46 aceita só essa. Observação, sem ação: ela é executável por `anon` por desenho; a ficha tem 64 caracteres hexadecimais e vale uma tentativa só.
- **Storage:** nenhum bucket (arquivos ficam no Drive, não no Storage do Supabase); `01_buckets_privados` cobre o futuro.

### Chaves (passo 3)
- `sb_secret_`, `service_role` e `eyJ…` não aparecem em `src/`, `supabase/functions/`, `supabase/seed.sql` nem `.env.example`.
- **Histórico do git:** `sb_secret_` e `BEGIN PRIVATE KEY` aparecem só em documentos que citam o nome (sem valor) e em testes (uma chave gerada na hora, outra de exemplo "abc"). Nenhuma chave real. Nada a trocar.
- `.gitignore` cobre `*.local` e `dados-reais/`; o único arquivo de ambiente rastreado é `.env.example`. Observação: `.env` sem sufixo não está no `.gitignore`; se alguém criar um, ele seria comitado. Vale acrescentar `.env` (backlog).

### Código (passo 7, revisão de reserva, menos completa)
- `/security-review` compara com a `main`; a `main` já tem tudo, então ele não acha diff. Fiz a revisão de reserva por leitura, com foco em login, permissões, dado de fora e envio de arquivo:
  - **`arquivos-no-drive`:** ordem fixa (configuração → quem chamou → perfil e situação → entrada → Drive); `verify_jwt = false` de propósito e a própria função confere o token; CORS só para as origens de `EP_ORIGENS_ACEITAS`; log leva só o tipo do erro; a conferência exige que o arquivo esteja debaixo da raiz do ambiente (corrigida hoje para três níveis, 9ae4820).
  - **`planilhas-dos-dashboards`:** `verify_jwt = false`, exige `x-senha-interna` (comparação sem parada no primeiro byte), valida o pacote antes de tocar o Google, não lê o banco nem usa a chave secreta, log sem dado do pedido.
  - **Interface:** nenhum `innerHTML`, `dangerouslySetInnerHTML`, `eval` nem `localStorage`; só `sessionStorage` para a última forma de ver; links externos com `rel="noopener noreferrer"`; o link da aprovação e o da publicação têm trava `^https?://` no banco, então não há `javascript:`.
  - **Sem achados bloqueantes.** Ainda vale o `/security-review` por você, se quiser a revisão completa (veja abaixo).
- **Pacotes (security-auditor, `.scratch/security.md`):** produção com 0 vulnerabilidades; 16 achados só em ferramentas de desenvolvimento (2 altos, `undici` e `zod`), nenhum bloqueia.

### Inventário de dados pessoais (passo 8)
- `.scratch/lgpd-inventario.md` gravado. Há cinco decisões que são suas com o encarregado, o jurídico e a TI (prazo de guarda, registro de leituras, eliminação a pedido, validação da nuvem externa, aviso de privacidade).

## Ainda aberto (por isso a linha final da revisão ainda não foi gravada)

1. **Consulta do catálogo no painel (passo 2, para pegar objeto criado à mão):** você roda no SQL Editor do desenvolvimento (e, depois do `db push`, na produção) e cola o resultado. Deve voltar vazia, exceto o bucket (nenhum).
2. **Passo 4, painel de produção** e **passo 5, hospedagem:** ficam para o roteiro de publicação, porque a produção e o site ainda não existem.
3. **Passo 6, script por perfil pela API:** não escrevi. Os testes de banco já tentam, com um usuário de cada perfil e um visitante, as ações proibidas, e o teste 46 confere permissões de visitante; o script repetiria isso pelo caminho HTTP. Posso escrevê-lo se você quiser essa prova a mais (pede usuários de teste no desenvolvimento).
4. **`/security-review` completo (passo 7):** só você pode digitá-lo; como a `main` já tem tudo, ele provavelmente dirá que não há mudanças. Decida se quer tentar.
