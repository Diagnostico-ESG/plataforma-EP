# 02: Setores: abrir, editar, desativar, reativar e excluir

**Como resolve a sua parte.** Com o 01, os setores existem e podem ser criados. Este ticket fecha o ciclo de vida do setor: a equipe abre um setor, corrige o cadastro, desativa o que deixou de existir sem perder o que foi registrado, reativa e exclui o que foi cadastrado por engano, sempre com o evento no histórico.

**What to build:** setor aberto com o formulário (só leitura para a Consulta), [Salvar], [Desativar] ou [Reativar] e [Excluir] com a janela de confirmação; caixa "Mostrar inativos" com a pílula "Inativo"; aviso de item que não existe mais. Spec: `.scratch/cadastros-basicos/spec.md` (histórias 2, 3, 10, 13, 15, 16, 19, 42 e 43; seções "Interface" e "Regras de estado").

**Blocked by:** 01 (Setores: ver e cadastrar).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Prefactor: a janela de confirmação da Administração sai da pasta da Administração para os componentes compartilhados, sem mudar comportamento (os testes dela continuam passando).
- [ ] Módulo de cadastros ganha ler um setor, editar, desativar, reativar e excluir (real e falso); setor inexistente chega como caso próprio, não como erro genérico.
- [ ] Clicar numa linha abre o setor; a Consulta vê os dados sem campos editáveis e sem botões.
- [ ] Desativar e Reativar gravam na hora, sem confirmação; o botão troca conforme a situação.
- [ ] "Mostrar inativos", desmarcada ao abrir; inativos com a pílula "Inativo" (cor e texto); "Nenhum setor ativo para mostrar." quando só há inativos e a caixa está desmarcada.
- [ ] Excluir abre a janela "Excluir o setor {SIGLA}?" com o texto da spec (neste ticket sempre na forma de zero macroprocessos: "O histórico guarda…"), [Excluir setor] e [Cancelar]; foco no [Cancelar]; Esc e Cancelar não gravam.
- [ ] Setor aberto que já foi excluído: "Este cadastro não existe mais. Ele pode ter sido excluído; veja o Histórico." com [Voltar à lista].
- [ ] Erro de gravação e recusas mantêm o formulário, em vermelho.
- [ ] Testes de interface com o aplicativo inteiro: editar, desativar, reativar e excluir com sucesso e com falha, a janela (textos, Cancelar, Esc), "Mostrar inativos", item que não existe mais e a Consulta sem botões.
