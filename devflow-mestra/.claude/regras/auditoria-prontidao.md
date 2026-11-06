# Auditoria de prontidão — RASCUNHO — DevFlow v3.1

**Rascunho, não testado, não ligado a nenhum comando.** Só roda quando eu pedir ("faça a auditoria de prontidão"), antes de colocar o sistema na frente de usuários de verdade e depois de mudanças grandes. Vem do material "111 conceitos de engenharia", cortado para os pontos que se aplicam a Vite + React + Supabase e a sistema pequeno; o que o `/ship` e `producao.md` já cobrem é apontado, não repetido.

## Como conduzir

1. Leia `.scratch/projeto.md` (quantas pessoas, dado pessoal, pagamento ou integração) e diga o contexto em uma frase antes de começar.
2. Percorra a lista abaixo e devolva **uma tabela**: ponto, situação (ok, falta, não se aplica agora), **evidência com arquivo e linha** (ou comando e resultado), risco em uma frase. Trabalhe só com o que existe no código; **não invente problema para preencher a lista**.
3. Depois da tabela: as 10 correções mais urgentes, por impacto e facilidade, com esforço em horas, e a lista do que **não** faz sentido para o tamanho do projeto, com o motivo.
4. **Não mude nada antes de me mostrar o plano.** Cada correção é uma mudança por vez, com teste, pelo funil (`/demanda`), e um commit por correção.

## Pontos

**Segredos e acesso** (`CLAUDE.md`, `banco.md`, revisão para produção)
1. Nenhuma chave secreta no repositório, no histórico do git nem no pacote do navegador (`dist/`).
2. Toda tabela com RLS e política testada por perfil; views com `security_invoker`; nenhuma rota de administrador aberta.
3. Cadastro aberto desligado; usuário desativado perde acesso; recuperação de senha com SMTP próprio.
4. Funções (`supabase/functions/`) conferem quem chamou antes de usar a chave secreta.

**Entrada e saída de dados** (passo 4 do `/ship`)
5. Nenhum HTML vindo de usuário inserido sem limpeza (XSS); nenhum arquivo enviado exibido como HTML ou SVG no DOM.
6. Nenhuma consulta montada concatenando texto de usuário (as funções de acesso usam o cliente do Supabase).
7. CORS das funções restrito aos domínios do projeto; links externos com `rel="noopener noreferrer"`.
8. Limite de requisições onde há rota pública ou função que custa dinheiro ou envia e-mail (o login já tem limite do Supabase; confirme no painel). *Condicional: só com função pública ou integração.*

**Banco e desempenho** (`banco.md`)
9. Índice em coluna de filtro, ordenação, junção e política de RLS; `explain` nas 5 consultas mais usadas quando a tabela cresce.
10. Nenhum `select *` e nenhuma consulta por item (N+1) nas funções de acesso.
11. Tabela editada por mais de uma pessoa tem controle de versão, com teste do conflito.
12. Toda mudança de estrutura por migração versionada; produção e desenvolvimento no mesmo ponto (`AMBIENTES.md`).

**Entrega e recuperação** (`producao.md`)
13. CI roda lint, tipos, testes e dependência circular a cada envio (`verificacao.yml`).
14. Um caminho de voltar à versão anterior, conhecido e testado (`/voltar`, rollback da hospedagem).
15. Backup do banco e dos arquivos feito e **restaurado em teste**; data do último na `AMBIENTES.md`.
16. Dependências sem vulnerabilidade alta conhecida; `npm audit` registrado em `.scratch/security.md`.

**Operação** ("Operação depois da publicação" de `producao.md`)
17. Aviso por e-mail quando o site cai ou a taxa de erro sobe, com destinatário indicado.
18. Logs sem senha, token nem dado pessoal.
19. Alguém sabe quem avisar e quem decide voltar a versão; pós-mortem de uma página para cada bug que chegou à produção.

**Só com pagamento, integração ou IA paga** *(condicional)*
20. Timeout em toda chamada a serviço externo; nova tentativa só em operação segura de repetir, com espera crescente.
21. Idempotência (a mesma operação feita duas vezes dá o mesmo resultado) e conferência da assinatura em webhooks.
22. Limite de gasto e custo por usuário nas APIs pagas.
23. Limites de tempo e memória das funções do provedor (uma resposta longa pode ser cortada no meio).

**Fora de escopo até haver prova de uso:** balanceamento, Kubernetes, multirregião, filas, eventos, réplicas e fragmentação do banco, cache de borda, rastreamento distribuído, SLO e plantão. Se um projeto chegar neles, é outra conversa.
