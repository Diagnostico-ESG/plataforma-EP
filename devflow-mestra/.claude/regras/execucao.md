# Receitas de execução — DevFlow v3.2

Leia quando o comando mandar ("receitas de execução") ou quando topar com um destes casos. São práticas que já falharam em projeto real. Ambiente padrão: Windows.

## Edições e scripts

- **Arquivos se gravam com a ferramenta de arquivo.** Nunca com heredoc nem com `echo >`: no Windows o texto muda de codificação e de fim de linha.
- **Edição em lote: Node.** Scripts de apoio usam `node` (o projeto já o tem), nunca Python (`python3` pode não existir) nem heredoc grande. Depois de qualquer edição em lote, confira o diff.
- **Caixas do plano** (`- [x]`) se marcam com a ferramenta de edição, linha a linha, e no mesmo commit da tarefa.
- **Fim de linha.** O `/setup` cria `.gitattributes` com `* text=auto eol=lf`; sem ele, o Git avisa "LF will be replaced by CRLF" a cada commit e edições por script que procuram `\n` não acham o texto. Comparar arquivos: `--ignore-space-at-eol`.
- **Copiar linhas de outro arquivo:** `sed -n 'a,bp'`, não substituição de texto por script.
- **Passar uma propriedade obrigatória nova** pelo componente raiz: filtre a troca para `*.test.tsx` e `src/testes/` também.

## Git

- **Branch de ticket (`/executar-complexo`).** Antes do `git branch -d`, envie a branch (`git push -u origin <branch>`) se o projeto tem repositório remoto, ou rode o `-d` só depois de a principal estar enviada: o `-d` recusa quando a branch tem commits que o remoto ainda não viu. Branch que já foi ao remoto: apague também a remota depois (comando meu). Retomada de outra máquina: confira `git branch -r` e `git log main..origin/<branch>` antes do passo 1.
- **Pre-commit barrou o commit:** confira `git status` antes do próximo `git add`; o arquivo que falhou pode ter ficado só parcialmente preparado.
- **Interrupção durante `git commit`:** o primeiro sintoma é erro do lint-staged ou arquivo de trava em `.git`; o conserto é meu (arquivos da pasta `.git`).
- **Mudança só de fim de linha não conta** como alteração para decidir se um passo roda.
- **Pre-commit lento.** O pre-commit roda o lint nos arquivos do commit, os tipos e **só os testes ligados a esses arquivos** (`vitest related`). A suíte inteira roda no `/ship`, no CI e quando o ticket mexe em código compartilhado. Rode `npx eslint src` antes de comitar tarefas pequenas em sequência, ou junte tarefas pequenas em menos commits.
- **Migração + código de interface no mesmo commit:** ajuste de teste que muda tipos compartilhados vai antes, em commit próprio, para o pre-commit não pegar o código pela metade.

## Workflow do GitHub (CI) disparado à mão

Vale para os workflows "Testes de banco" e "Migrar banco de desenvolvimento" (`.claude/modelos/github-workflows/`).

- **Com o `gh` instalado** (`gh --version`; confira `gh auth status` no começo do ticket): `gh workflow run "Testes de banco" --ref <branch>` e `gh run watch`. Instalar o `gh` e autenticar é pedido do `/setup`.
- **Sem o `gh`:** dispare pelo navegador da sessão. Espere uns 5 s depois de abrir `actions/workflows/<arquivo>.yml`, escolha a branch **antes** de preencher o campo, confira os dois por JavaScript antes de apertar o botão verde, e depois confirme que a página foi para a execução nova (número `#N`). O botão "Run workflow" fecha sozinho quando a página se atualiza (a cada 30 s).
- O log do passo `Run npm run test:db` mostra "N ok" por arquivo de teste; leia o resultado ali.
- Um workflow só roda se o arquivo dele estiver na branch padrão do repositório.

## Banco: ordem do ciclo

Com o Docker local, a ordem está em `banco.md`. Com os testes e as migrações pelo GitHub Actions: **teste que falha → migração (commit e push) → workflow de migração → tipos (`db:types`, commit)**; código de interface que lê a tabela nova só se escreve **depois dos tipos**. Evite deixar tela pela metade esperando o workflow: o `git stash` é o caminho aceito.

- **Ensaio da migração.** A bateria de testes (`testar-banco.mjs`) roda as migrações ainda não aplicadas dentro da transação de cada teste, que se desfaz no fim. Erro de SQL aparece sem custar uma migração de correção. Para controlar o ponto onde as migrações entram, use a marca `-- ensaio: migrações pendentes aqui` no teste.
- **Antes da migração**, procure nos testes antigos tudo que a muda: `grep` do nome da coluna, da tabela e da função em `supabase/tests/` (contagens da tabela inteira, comparações exatas do registro de histórico). Planos de teste pgTAP: conte as asserções (`grep -c "^insert into _tap"` ou equivalente) antes de enviar.
- **Gatilho que reage a uma mudança:** o plano lista o estado que já existe antes da migração ("quem já está no banco quando o gatilho nasce") como caso de teste. Função com parâmetro opcional declara `default null`.
- **Migração nova fica por último** na pasta (confira o horário do nome, que às vezes é escolhido à mão).

## Vitrine e servidores

- Servidor da vitrine (e da pré-visualização) é encerrado ao fim da conferência da tela, e a pré-visualização fecha antes do commit.
- Para ver a tela de uma worktree, suba o Vite dela numa porta própria e encerre depois.

## Testes de interface

- Testes de foco e de elementos nativos do navegador (`dialog`, `popover`) no jsdom: o plano lista de antemão o que o jsdom não suporta.
- Teste instável: reproduza o vermelho por repetição sob carga, compare pela mensagem de erro e trate como bug (caminho de bug do `/demanda`).
