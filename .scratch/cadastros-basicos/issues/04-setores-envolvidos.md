# 04: Setores envolvidos

**Como resolve a sua parte.** Com setores e macroprocessos cadastrados, falta dizer quem participa de quê, que é a base da matriz macroprocesso × setor do painel. Este ticket liga os dois: no macroprocesso aberto, a equipe põe e tira setores e escreve o papel de cada um; no setor aberto, vê os macroprocessos de que ele participa; e excluir um setor ou macroprocesso desfaz os vínculos dele, guardando tudo no histórico.

**What to build:** seção "Setores envolvidos" no macroprocesso aberto (pôr, tirar, observação, gravando na hora); "Macroprocessos em que participa" no setor aberto; contagens nas duas listas; exclusão em cascata com eventos e janela com a quantidade. Spec: `.scratch/cadastros-basicos/spec.md` (histórias 1, 12, 14, 16, 17, 20, 26 a 31, 33, 37 e 38; seções "Interface", "Modelo de dados" e "Regras que o banco impõe").

**Blocked by:** 02 (Setores: abrir, editar, desativar, reativar e excluir) e 03 (Macroprocessos).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes pgTAP antes da migração: cada célula de `setores_envolvidos` da tabela "quem pode o quê"; mesmo setor duas vezes no mesmo macroprocesso recusado; excluir setor ou macroprocesso apaga as linhas dele.
- [ ] Migração não destrutiva cria `setores_envolvidos` (chave composta, referências que apagam junto, observação até 500 caracteres) com RLS ligada e os mesmos privilégios do 01.
- [ ] Gatilhos gravam em `eventos` (entidade `setor_envolvido`, os dois ids) pôr (`criar`), tirar (`excluir`) e mudar observação (`editar`), com a sigla do setor e o nome do macroprocesso legíveis; a exclusão em cascata também gera os eventos de tirar.
- [ ] O "antes" do evento de exclusão de setor e de macroprocesso passa a trazer a lista dos setores envolvidos; teste pgTAP.
- [ ] Módulo de cadastros ganha pôr, tirar, mudar observação e as leituras com vínculos e contagens (real e falso); a recusa vira "O setor {SIGLA} já está neste macroprocesso.". Contagem derivada na leitura; se virar view, `security_invoker = true`.
- [ ] Macroprocesso aberto: lista com sigla, nome, observação editável e [Tirar]; seletor só com setores ativos ainda não envolvidos, mais [Pôr setor]; setores inativos envolvidos marcados "Inativo"; falha mostrada na linha; "Nenhum setor envolvido ainda.".
- [ ] Setor aberto: "Macroprocessos em que participa" (código, nome, observação, só leitura) ou "Este setor ainda não participa de nenhum macroprocesso.".
- [ ] Listas ganham a coluna de quantidade (macroprocessos do setor, setores do macroprocesso).
- [ ] Janelas de exclusão passam a dizer "{SIGLA} sai de {n} macroprocessos." e "{n} setores deixam de estar envolvidos nele.".
- [ ] A Consulta vê os vínculos sem [Tirar], sem seletor e sem observação editável.
- [ ] Testes de interface com o aplicativo inteiro: pôr, tirar e mudar observação com sucesso e com falha, o seletor (sem inativos e sem os já envolvidos), as contagens, as janelas com n e a Consulta.

Concluído em 2026-10-13 (commit 1dcd4c8)
