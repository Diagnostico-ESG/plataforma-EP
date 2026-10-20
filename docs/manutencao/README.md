# Manutenção da plataforma do Escritório de Processos

Documentação para quem vai **assumir, publicar ou mexer** na plataforma do EP sem depender de quem a construiu. Está em português, em listas numeradas, um passo por linha, e não exige o Claude Code: bastam o terminal, o navegador e os painéis do Supabase e do Google.

## Estado hoje

- Existe só o ambiente de **desenvolvimento**, com dados inventados. **A produção ainda não existe.**
- Tudo que depende da produção está marcado **"conferir no `/ship` de produção"** nos documentos: quem fizer a primeira publicação deve refazer essas conferências com o ambiente real.
- O visual dos dashboards no Data Studio ainda não teve acabamento (backlog do projeto).

## Os seis temas

| # | Tema | Arquivo | Quando ler |
| --- | --- | --- | --- |
| 1 | Instalação do ambiente de desenvolvimento | [01-instalacao.md](01-instalacao.md) | Antes de mexer no código. |
| 2 | Publicação: banco, funções e site | [02-publicacao.md](02-publicacao.md) | Antes de publicar uma mudança ou criar a produção. |
| 3 | Backup e restauração | [03-backup-e-restauracao.md](03-backup-e-restauracao.md) | Antes de uma migração destrutiva e antes de a produção receber dado real. |
| 4 | Modelo de dados | [04-modelo-de-dados.md](04-modelo-de-dados.md) | Para entender as tabelas, as regras do banco e quem pode o quê. |
| 5 | Decisões (índice dos ADRs) | [05-decisoes-adr.md](05-decisoes-adr.md) | Antes de mudar uma regra do sistema. |
| 6 | Planilhas e dashboards | [06-planilhas-e-dashboards.md](06-planilhas-e-dashboards.md) e [07-dashboards-no-data-studio.md](07-dashboards-no-data-studio.md) | Para configurar as planilhas, dar fase a uma etapa nova, refazer um dashboard, trocar o link no site, encerrar o Power BI. |

## Roteiros que já existem em `docs/`

Roteiros testados no desenvolvimento, que os documentos acima apontam:

- [Login pelo Google](../implantacao-login.md) (ADR 0001)
- [Conta de serviço e Drive compartilhado](../drive-conta-de-servico.md) (ADR 0008)
- [Cofre do banco para as planilhas](../planilhas-cofre-do-banco.md) (ADR 0018)
- [Publicar a função das planilhas](../planilhas-publicar-a-funcao.md) (ADRs 0017 e 0018)

Esses quatro citam o ref do projeto de desenvolvimento nos endereços; no ambiente em que você estiver trabalhando, troque pelo ref dele (`supabase/AMBIENTES.md`).

## Outros arquivos que ajudam

- `supabase/AMBIENTES.md`: os ambientes, o vínculo atual da CLI e o registro das migrações.
- `CONTEXT.md`: o vocabulário do domínio (processo, etapa, fase do Regimento, versão, aprovação…).
- `.scratch/<funcionalidade>/spec.md`: a especificação viva de cada funcionalidade, com a tabela "quem pode o quê".
- `.scratch/backlog.md`: o que ficou para depois.
- `docs/adr/`: as decisões de projeto, uma por arquivo.

## Regras que valem sempre

1. A tela usa só a chave **publicável** do Supabase. A chave secreta nunca entra no projeto, no git nem em conversa.
2. O banco só muda por migração em `supabase/migrations/`. Migração já aplicada não se edita: o conserto é uma migração nova.
3. Teste e exemplo usam só dado **inventado**. Dado pessoal real só existe em produção.
4. Nada de segredo, senha, e-mail real, chave de conta de serviço ou identificador de planilha no git ou nestes documentos.
5. Não use `git commit --no-verify`: se o pre-commit barrar, corrija a causa.
