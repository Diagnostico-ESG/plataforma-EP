# Documentação de manutenção — plano de execução (ticket 05)

> **Para quem executa:** use `superpowers:executing-plans`. Marque as caixas (`- [x]`) ao terminar cada passo.

**Meta:** deixar em `docs/manutencao/`, em português, o que a TI do CED (ou outra equipe) precisa para assumir o sistema sem depender de quem o construiu: instalação, publicação, backup e restauração, modelo de dados, índice dos ADRs, planilhas e dashboards.

**Ticket:** `issues/05-documentacao-de-manutencao.md` (critérios citados como "critério N"). **Spec:** histórias 48 a 55. **Fontes:** ADRs 0001 a 0018; `supabase/AMBIENTES.md`; `.claude/commands/ship.md` (roteiros de produção); `.claude/regras/banco.md`; `docs/*.md` (roteiros que já existem); `src/types/database.ts` (modelo de dados atual); `.scratch/exportacao-e-manutencao/dashboards-anotacoes.md` (ticket 04).

**Branch:** `exportacao-e-manutencao-05`. Marco: `marco/2026-10-20-inicio-exportacao-e-manutencao-05`.

## Regras deste ticket (do ticket, de `CLAUDE.md` e de `banco.md`)

- Cada roteiro é **lista numerada, um passo por linha**, com caminho completo de arquivo ou pasta e o endereço da página quando há. Termo técnico explicado em uma frase na primeira vez.
- **Nenhum** nome de pessoa, e-mail, chave, senha, token ou identificador de planilha. Use marcadores (`<ref-do-projeto>`, `<identificador-da-planilha-interna>`). O ref do projeto de desenvolvimento fica no `supabase/AMBIENTES.md`, não nos documentos novos.
- O que depende da produção, que ainda não existe, vai com o que se sabe hoje e leva a marca **"conferir no `/ship` de produção"**.
- Os roteiros que já existem em `docs/` (login, Drive, cofre, função das planilhas) **não se duplicam**: os documentos novos apontam para eles.
- A documentação não exige o Claude Code: quem assumir pode usar só o terminal, o painel do Supabase e o navegador.
- Não edita `CLAUDE.md` nem `.claude/`.

## Arquivos (todos novos, em `docs/manutencao/`)

| Arquivo | Conteúdo | Critério |
| --- | --- | --- |
| `README.md` | Índice dos seis temas, com uma linha cada e o link; aviso do que depende da produção | 1 |
| `01-instalacao.md` | Pré-requisitos, clonar, `npm install`, variáveis, `npm run dev`, checagens (`npm test`, `lint`, `typecheck`, `check:circular`), pre-commit, GitHub Actions | 1, 2 |
| `02-publicacao.md` | Banco (migração, ordem, trava de ambiente), funções e segredos, site, primeiro administrador; produção marcada | 1, 2, 3 |
| `03-backup-e-restauracao.md` | O que o backup cobre, três comandos de `db dump`, Storage (não há: arquivos no Drive), teste de restauração | 1, 2, 3 |
| `04-modelo-de-dados.md` | Tabelas, view, funções, tipos, quem pode o quê, o que calcula e o que guarda | 1 |
| `05-decisoes-adr.md` | Índice dos ADRs 0001 a 0018, uma linha cada | 1, 4 |
| `06-planilhas-e-dashboards.md` | Cofre, conta de serviço e Sheets, fase de etapa nova, atualização e falhas, transição | 1, 2, 3 |
| `07-dashboards-no-data-studio.md` | Roteiro para refazer cada dashboard do zero; troca do link no site da Casa Civil; fim do Power BI; exclusão da planilha manual | 1, 2, 3 |

O ticket pede "seis temas"; planilhas e dashboards são um tema em dois arquivos para manter cada um abaixo de 300 linhas.

## Tarefas

- [x] **1. Índice dos ADRs (`05-decisoes-adr.md`).** Uma linha por ADR (0001 a 0018): título, data e o que mudou ou foi decidido, e os ADRs que substitui ou complementa (0009 → 0012 e 0015; 0010 sem objeto; 0007 → 0011). Verificação: `grep -c "^| 00" docs/manutencao/05-decisoes-adr.md` dá 18 e cada arquivo de `docs/adr/` aparece.
- [x] **2. Modelo de dados (`04-modelo-de-dados.md`).** Escreva a partir de `src/types/database.ts` e das migrações: 16 tabelas, 2 views, 19 funções públicas, tipos enumerados, schema `private`, gatilhos que gravam o histórico, RLS por perfil, o que o banco calcula (view `processos_com_andamento`) e o que ele guarda. Diga quais tabelas das primeiras migrações foram apagadas (reuniões, responsáveis do setor). Verificação: cada nome citado existe em `src/types/database.ts` (script de conferência no passo final).
- [x] **3. Instalação (`01-instalacao.md`).** Dos arquivos `package.json`, `.env.example`, `.husky/pre-commit`, `.github/workflows/verificacao.yml`: Node 24, `npm install`, `.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (valores no painel do Supabase, nunca no git), `npm run dev`, os cinco comandos de checagem, o pre-commit, a rede que só abre a porta 443 (testes de banco pelo GitHub Actions) e o que NÃO fazer (chave secreta fora do projeto).
- [x] **4. Publicação (`02-publicacao.md`) e backup (`03-backup-e-restauracao.md`).** Traduza as seções "Publicar no banco de produção", "Publicar o site" e "Backup e restauração" de `.claude/commands/ship.md` para um roteiro que uma pessoa faz sozinha, sem o Claude: painel da produção (cadastro aberto desligado, SMTP, redirecionamentos), migração (`npx supabase db push` com o vínculo conferido), funções (`functions deploy --use-api` e segredos), site (variáveis de produção, busca de `sb_secret_`/`service_role` em `dist/`), primeiro administrador, dump em três arquivos, teste de restauração. Tudo de produção com a marca "conferir no `/ship` de produção". Hospedagem do site: ainda não decidida (`.scratch/especificacao.md`, seção 9).
- [x] **5. Planilhas (`06-planilhas-e-dashboards.md`).** Visão (ADRs 0017 e 0018), cofre (nomes dos quatro segredos, sem valor), conta de serviço e API do Sheets (aponta `docs/drive-conta-de-servico.md` e `docs/planilhas-publicar-a-funcao.md`), a aba Planilhas da Administração, a atualização diária às 6h, **como dar fase a uma etapa nova** (Administração → Catálogo de etapas, campo Fase), códigos de falha e o que fazer, e a transição (Power BI e planilha manual até o cadastro dos processos atuais).
- [x] **6. Dashboards (`07-dashboards-no-data-studio.md`).** Do `dashboards-anotacoes.md`: roteiro numerado para refazer, do zero, as fontes, os campos calculados (com as fórmulas), a combinação, as três páginas do interno e a página do público; compartilhar o interno com a equipe e deixar o público "Não listado"; trocar o link na página do EP no site da Casa Civil; encerrar o Power BI; excluir a planilha manual depois do cadastro dos processos atuais. Sem e-mail de pessoa e sem identificador de planilha. Limites do Data Studio. O visual final ainda está em aberto (critério 5 do ticket 04): diga isso.
- [x] **7. Índice (`README.md`) e verificação.** Índice dos oito arquivos, em uma linha cada. Verificações: (a) nenhum e-mail, `sb_`, `eyJ`, identificador de planilha (cadeias de 44 caracteres de letras e números), nem o ref `yclkzyoebpsxmgpbcbus`; (b) toda ocorrência de produção leva a marca; (c) cada nome de tabela, view e função citado existe em `src/types/database.ts`; (d) cada arquivo tem até 300 linhas; (e) links relativos apontam para arquivos que existem.
- [x] **8. Fechamento.** Marcar os critérios do ticket, `desvios.md`, `melhorias-protocolo.md` (itens não testados que aconteceram), linha `Concluído em` no ticket 05 (o 04 segue aberto), merge, push, aviso do `/polir` ou `/ship`.

## Teste

Documentação: não há teste automático novo. A verificação é o passo 7 (conferências por comando) mais a leitura. `npm test` roda no pre-commit de cada commit.
