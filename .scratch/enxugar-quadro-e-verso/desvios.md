
## 2026-11-04 — Aprovação parcial da prévia (critério 18)
- O usuário aprovou só a faixa de fundo das colunas (tom neutro mais escuro, título dentro e alinhado aos cartões). Disse que o restante da prévia era "muito diferente" do app.
- A arrumação do verso **não** foi aprovada: o esboço em `previa-verso.html` não usava os componentes reais. Decisão: montar a arrumação no app real e mostrar uma captura dele ao usuário antes de fechar a Tarefa 8.3. Tarefas 1 a 7 seguem; o critério 18 fica aberto até essa aprovação.

## 2026-11-04 — Item 7 da spec (sem [Enviar relatório]) adiado por decisão do usuário
- A spec e o ADR 0042 supõem um "+ Acrescentar relatório" na versão, mas ele saiu no ticket 10 de `documentos-versoes`: hoje o único caminho para mandar um relatório sem versão nova é o [Enviar relatório]. Tirá-lo deixaria o relatório só no formulário da versão nova.
- Decisão do usuário: **manter o [Enviar relatório] por ora**. Nada muda na seção de versões, na Confirmação de arquivos nem nos testes de relatório. O critério 5 e o 6 de pronto ficam abertos; o `/ship` e a spec devem registrar isso. Se o usuário quiser tirar o botão depois, é preciso antes criar o "+ Acrescentar relatório" (espaço tracejado na versão mais recente que abre o `FormularioDeRelatorio`).
- Os rótulos do botão de envio já estão como a spec pede ("Enviar versão" / "Enviar versão piloto").
