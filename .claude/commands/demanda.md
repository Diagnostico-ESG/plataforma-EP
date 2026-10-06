---
description: Porta de entrada para qualquer demanda depois da primeira versão ou fora do plano — bug, ajuste, funcionalidade pequena, mudança, funcionalidade nova ou redesenho. Classifica a demanda, explica o caminho e devolve o comando para começar.
---

Com base na demanda que descrevi nesta conversa (e em `.scratch/backlog.md`, se eu pedir para puxar algo de lá), faça o seguinte, sem executar nada antes da minha confirmação:

1. **Se a descrição não bastar para classificar**, faça no máximo duas perguntas antes, uma de cada vez.

2. **Classifique** a demanda em um destes tipos:
   - **Bug** — algo que deveria funcionar de um jeito e funciona de outro.
   - **Ajuste pequeno** — mudança pontual sem nova regra de negócio (um texto, uma cor, um rótulo, um espaçamento).
   - **Funcionalidade pequena** — algo novo que cabe numa entrega, mexe numa tela só, não cria regra de negócio e não muda a estrutura dos dados (um botão de exportar, um filtro a mais, uma coluna nova numa tabela da tela). Se precisar de migração no banco, deixa de ser pequena.
   - **Mudança em funcionalidade existente** — altera um comportamento ou regra já decidida e já construída.
   - **Funcionalidade nova** — algo que ainda não existe no sistema e não cabe na definição de funcionalidade pequena.
   - **Mudança de identidade visual** — redesenho de paleta, tipografia ou estrutura visual do projeto.

3. **Explique em linguagem simples**, sem jargão, por que escolheu esse tipo e qual caminho ele segue. Se a demanda couber em dois tipos, escolha o mais rigoroso e diga por quê. Do menos para o mais rigoroso: ajuste pequeno, bug, funcionalidade pequena, mudança em funcionalidade existente, funcionalidade nova; mudança de identidade visual corre à parte. **Exceção:** na dúvida entre funcionalidade pequena e funcionalidade nova, pergunte em vez de escolher.

4. **Devolva o comando para começar** e aguarde minha confirmação ou correção.

5. **Se a demanda muda uma resposta do resumo do projeto** (passa a ter login, banco, arquivos enviados ou dado pessoal), o primeiro passo é o `/projeto`, para atualizar `.scratch/projeto.md`; só depois vem o caminho do tipo. Quando o login chega a um projeto que já tem telas, o `/planejar` do login lista as telas existentes que passam a ficar atrás dele.

## Caminho de cada tipo

**Bug** (este é o funil do bug, confirmado por mim no passo 4: TDD, revisão e verificação seguem valendo)
1. Crie um marco (`marco/AAAA-MM-DD-antes-correcao-<nome>`) e investigue a causa antes de corrigir (as skills `diagnosing-bugs` e `systematic-debugging` disparam para isso). A correção é feita na branch principal. Se a causa não aparecer na primeira investigação, o bug é difícil: registre no `.scratch/backlog.md` o que já foi descoberto e sugira retomar numa sessão com Opus.
2. Escreva um teste que reproduz o bug e confirme que ele falha (vermelho) antes de qualquer correção.
3. Corrija até o teste passar (verde). Esse teste fica como teste de regressão. Se a causa estiver no banco (estrutura ou política de RLS), o teste é de banco, em `supabase/tests/`, e a correção é uma migração nova, pelas regras de `.claude/regras/banco.md`.
4. Comite e rode `/mattpocock-skills:code-review` sobre o diff da correção (do commit anterior a ela até agora).
5. `/polir`, se a correção mexeu na interface.
6. Se o bug revelou que a spec da funcionalidade estava errada ou incompleta (além do código), atualize a spec e acrescente uma entrada no `desvios.md` da funcionalidade explicando a correção.
7. Rode `/ship` se `package.json` mudou, se a correção criou migração ou mexeu em `supabase/functions/`, ou se tocou em código de login, permissão ou validação de dado que chega de fora. Caso contrário, o commit protegido pelo pre-commit basta.
8. Termine com um relatório curto, em linguagem simples: qual era a causa; o que foi **verificado** (e como: teste, comando, execução); e o que foi **presumido** sem verificação, com o motivo. Se nada foi presumido, diga isso. Se `supabase/AMBIENTES.md` registra produção e a correção criou migração ou mexeu em função, diga com destaque que **a produção continua com o defeito** até a publicação, e aponte o roteiro "Publicar no banco de produção" do `/ship`.

**Ajuste pequeno**
1. `/executar-simples` com a descrição do ajuste — sem passar pelo `/planejar`.
2. `/polir`, se o ajuste foi visual.
3. `/ship` só se `package.json` mudou; caso contrário, o commit protegido pelo pre-commit basta. Ajuste que pede migração deixa de ser ajuste pequeno: reclassifique.

**Funcionalidade pequena**
1. `/planejar` no modo curto: poucas perguntas e uma spec enxuta, sem sabatina completa. Se aparecer regra de negócio, outra tela ou mudança nos dados, o `/planejar` avisa que a demanda subiu para funcionalidade nova.
2. `/executar-simples`.
3. `/polir`, se mexeu na interface.
4. `/ship`.

**Mudança em funcionalidade existente**
1. `/planejar`, informando qual funcionalidade será alterada. A sabatina registra o porquê da mudança num ADR novo.
2. A spec da funcionalidade é **atualizada** para refletir o novo comportamento, no mesmo arquivo, e ganha a linha `Em revisão desde` se já estava entregue.
3. Tickets → execução → `/polir` → `/ship`, como numa funcionalidade nova.

**Funcionalidade nova**
1. Com minha confirmação, acrescente a funcionalidade à lista de `.scratch/projeto.md`.
2. `/planejar` (que tem o passo "Iniciativa grande" para o que não cabe numa sessão).
3. Segue o funil normal a partir daí. Concepção visual e implementação de identidade não se repetem: a identidade do projeto já existe.

**Mudança de identidade visual**
1. `/concepcao-livre` ou `/concepcao-premium` → `/implementar-identidade`, como no início do projeto.
2. Depois, `/polir` para conferir se as telas existentes ficaram consistentes com a identidade nova. O redesenho termina aí: o `/implementar-identidade` já rodou testes e `code-review`, e o `/polir` comita e registra os achados. O `/ship` só roda se `package.json` mudou.
