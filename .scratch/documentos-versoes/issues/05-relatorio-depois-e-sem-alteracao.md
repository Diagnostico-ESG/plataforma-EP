# 05: Relatório depois e "sem alteração de conteúdo"

**Como resolve a sua parte.** Muitas vezes o fluxograma de uma versão fica pronto antes do relatório, ou o relatório não muda de uma versão para a outra. Este ticket marca "relatório pendente" nas versões novas sem relatório, deixa acrescentar o relatório depois (a versão mais recente pendente vem escolhida) e, quando o relatório não mudou, oferece "sem alteração de conteúdo": a função copia no Drive o relatório da versão anterior com o nome da versão nova, e o histórico registra a cópia.

**What to build:** funções do banco para acrescentar relatório e para "sem alteração", com os gatilhos das regras (só em versão nova sem relatório; cópia só da versão imediatamente anterior, que precisa ter relatório; coluna `copiado_de`); ações `registrar` (relatório) e `sem_alteracao` da função do servidor; marca, botões e formulário na seção Versões. Spec: histórias 22 a 27 e 45 (relatório e sem alteração).

**Blocked by:** 02.

**Status:** ready-for-agent

## Critérios de aceite

- [x] Banco: testes antes da migração: relatório acrescentado a versão nova sem relatório aceito; a versão que já tem, recusado; a versão histórica, recusado; "sem alteração" copiando da versão anterior com relatório aceito; de versão sem relatório ou que não é a anterior, recusado; cada operação gera um evento.
- [x] `sem_alteracao` copia o arquivo no Drive (sem passar pelo navegador) para a pasta do processo com o nome da versão nova e registra o arquivo com `copiado_de`.
- [x] A marca "relatório pendente" (pílula com texto) aparece em toda versão nova sem relatório, calculada na tela.
- [x] [Acrescentar relatório] abre o formulário com a versão mais recente pendente escolhida e permite escolher outra; aceita só .docx ou .pdf até 20 MB.
- [x] [Sem alteração de conteúdo] só aparece na versão nova pendente cuja anterior tem relatório; pede confirmação; a versão mostra de qual versão o relatório veio.
- [x] Recusas viram mensagens; testes de interface com a falsa cobrindo os itens acima, inclusive falhas.

## Registro da execução (2026-10-16)

- **Critério 1 (banco):** `supabase/tests/29_relatorio_depois.test.sql` (37 casos), escrito antes da migração (#82, vermelho: funções inexistentes, 3 de 37). Migração `20261016020123_relatorio_depois_e_sem_alteracao`, ensaiada antes (#83: 27 com 52, 28 com 35 e 29 com 37) e aplicada pelo workflow (#19); depois, os 30 arquivos verdes (#84). Cobre: relatório acrescentado à versão sem relatório; relatório repetido, na versão criada com relatório e na histórica recusados; papel forçado; número da versão conferido; "sem alteração" copiando da anterior (com `copiado_de`, nome da versão nova e cadeia V2 → V3 → V4); versão anterior sem relatório, versão sem anterior, cópia que não é da anterior, de arquivo que não é relatório e com MD5 diferente recusadas; um evento por operação, com a versão de origem; processo suspenso, cancelado e concluído; integrante, consulta, inativo e visitante.
- **Critério 2 (cópia no Drive):** a ação `sem_alteracao` da função `arquivos-no-drive` lê a origem no banco (`origem_do_relatorio`), copia no Drive (`files.copy`, sem passar pelo navegador) para a pasta do processo com o nome padrão da versão nova e grava por `registrar_sem_alteracao`. A decisão (perfis e entrada) está testada no Vitest (`decisao.test.ts`, `semAlteracao.test.ts`, `registro.test.ts`); a chamada de ponta a ponta fica na prova do Drive.
- **Critérios 3 a 6 (tela):** `src/App.relatorioDepois.test.tsx` (22 casos), com o aplicativo inteiro e a `VersoesFalso`: marca "Relatório pendente" só na versão nova sem relatório; [Acrescentar relatório] para Administrador e Integrante, sumindo com a Consulta, o processo parado e sem versão pendente; formulário com a versão mais recente escolhida e a lista para trocar; só .docx ou .pdf, prévia do nome; progresso e campos travados; falha no arquivo e recusa do servidor com o formulário preenchido; [Sem alteração de conteúdo] só na versão pendente cuja anterior tem relatório, com confirmação, a mostra de "Sem alteração de conteúdo · relatório da V3", a recusa em vermelho e os dois eventos no histórico. Mais os testes do módulo real e do falso, das recusas e das funções puras.
- **Prova real no Drive: pendente** (roteiro do usuário). O `prova-do-drive.mjs` já tem o passo do relatório depois e do "sem alteração".
- **`[visual]`:** a marca "Relatório pendente", o formulário do relatório e o texto "Sem alteração de conteúdo · relatório da V3" não foram conferidos olhando a tela.
- **Sem a linha `Concluído em`**, até a prova do Drive (ver `desvios.md`).

## Fecho (2026-10-16)

- **Prova real:** os passos do relatório depois e do "sem alteração" (cópia no Drive) estão no script do Integrante, relatado OK pelo usuário (saída não colada). Presumido a partir do relato.

Concluído em 2026-10-16 (commit 617fdbb)
