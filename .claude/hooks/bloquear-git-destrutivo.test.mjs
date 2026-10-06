// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { motivoDoBloqueio, usarResolvedor } from './bloquear-git-destrutivo.mjs'

const hook = fileURLToPath(new URL('./bloquear-git-destrutivo.mjs', import.meta.url))

const bloqueados = [
  'git reset --hard',
  'git reset --hard HEAD~2',
  'git clean -fd',
  'git clean -f',
  'git push --force',
  'git push -f origin main',
  'git push --force-with-lease origin main',
  'git push origin +main',
  'git push -uf origin main',
  'git branch -D funcionalidade',
  'git branch -d -f funcionalidade',
  'git checkout -- src/App.tsx',
  'git checkout .',
  'git checkout -f main',
  'git checkout HEAD -- .claude/launch.json',
  'git restore src/App.tsx',
  'git restore .',
  'git restore --staged --worktree src/App.tsx',
  'git switch -f main',
  'git switch --discard-changes main',
  'git -C ../outra-pasta reset --hard',
  'git -c core.editor=true reset --hard',
  '/usr/bin/git reset --hard',
  'GIT_TRACE=1 git reset --hard',
  'cd projeto && git reset --hard',
  'git status; git push --force origin main',
  'git add -A && git commit -m "ok" && git clean -fd',
  'npm test || git checkout -- .',
  'echo ok | git reset --hard',
  'sudo git reset --hard',
  'env GIT_PAGER=cat git branch -D x',
  'bash -c "git reset --hard"',
  "sh -c 'git clean -fd'",
  'bash -lc "cd x && git push --force"',
  'eval "git reset --hard"',
  'echo "$(git clean -fd)"',
  'echo $(git reset --hard)',
  'echo `git checkout -- .`',
  'bash <<EOF\ngit reset --hard\nEOF',
  'cat <<EOF | bash\ngit clean -fd\nEOF',
  'git commit -m "x"\ngit reset --hard',
  'git status\n\ngit push --force',
  // v1.9: opção longa abreviada
  'git reset --har',
  'git reset --ha HEAD~1',
  'git push --forc origin main',
  'git push --del origin ramo',
  'git clean --forc',
  'git branch --forc ramo HEAD~3',
  // v1.9: checkout de arquivo sem "--"
  'git checkout src/App.tsx',
  'git checkout HEAD src/App.tsx',
  'git checkout main src/App.tsx',
  'git checkout Makefile',
  'git checkout ./',
  'git checkout --ours src/App.tsx',
  // v1.9: alias
  'git -c alias.x="reset --hard" x',
  "git -c alias.x='clean -fd' x",
  'git config alias.nuke "reset --hard"',
  'git config --global alias.nuke "clean -fd"',
  "GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=alias.x GIT_CONFIG_VALUE_0='reset --hard' git x",
  // v1.9: shells do Windows, wsl e interpretadores
  'powershell -Command "git reset --hard"',
  'powershell.exe -NoProfile -Command git reset --hard',
  'pwsh -c "git clean -fd"',
  'cmd /c git reset --hard',
  'cmd.exe /c "git push --force"',
  'wsl git reset --hard',
  'wsl bash -c "git clean -fd"',
  'iex "git reset --hard"',
  'powershell -EncodedCommand ' + Buffer.from('git reset --hard', 'utf16le').toString('base64'),
  'python3 -c "import os; os.system(\'git reset --hard\')"',
  'node -e "require(\'child_process\').execSync(\'git clean -fd\')"',
  'python -c "import subprocess; subprocess.run([\'git\',\'reset\',\'--hard\'])"',
  // v1.9: wrappers
  'timeout 5 git reset --hard',
  'stdbuf -oL git clean -fd',
  'find . -maxdepth 0 -exec git reset --hard \\;',
  // v1.9: caminho do Windows com barra invertida
  '"C:\\Program Files\\Git\\cmd\\git.exe" reset --hard',
  'C:\\Git\\cmd\\git.exe reset --hard',
  '& "C:\\Program Files\\Git\\bin\\git.exe" clean -fd',
  // v1.9: marcos, ramos remotos, trabalho guardado e histórico
  'git tag -d marco/2026-10-01-inicio',
  'git tag --delete marco/2026-10-01-inicio',
  'git tag -f marco/2026-10-01-inicio',
  'git worktree remove --force .claude/worktrees/x',
  'git stash drop',
  'git stash clear',
  'git push origin :main',
  'git push origin --delete ramo',
  'git push -d origin ramo',
  'git branch -f main HEAD~5',
  'git branch -M novo',
  'git filter-branch --tree-filter x',
  'git reflog expire --expire=now --all',
  'git gc --prune=now',
  'git update-ref -d refs/heads/main',
  'rm -rf .git',
  'rm -rf ./.git/',
  'Remove-Item -Recurse -Force .git',
  'rd /s /q .git',
  // v1.9, revisão final: redirecionamento antes do comando
  '>/dev/null git reset --hard',
  '2>&1 git reset --hard',
  '<<<x git reset --hard',
  'git reset --hard > saida.txt 2>&1',
  // abreviação curta e variações de escrita
  'git reset --h',
  'git tag --d marco/x',
  'git checkout --f main',
  "$'git' reset --hard",
  "git reset $'--hard'",
  'git reset --{hard,}',
  'git reset $MODO',
  'g\\it reset --hard',
  'git --attr-source HEAD reset --hard',
  "git -calias.x='reset --hard' x",
  "VAR='reset --hard' git --config-env=alias.x=VAR x",
  '/usr/lib/git-core/git-reset --hard',
  // texto entregue a um shell
  'echo "git reset --hard" | sh',
  'echo git clean -fd | bash',
  'bash <<< "git reset --hard"',
  'source <(echo git reset --hard)',
  '"git reset --hard" | iex',
  'Invoke-Expression -Command "git reset --hard"',
  'powershell "git reset --hard"',
  // wrappers
  'echo --hard | xargs git reset',
  'env -S "git reset --hard"',
  'script -qc "git reset --hard" /dev/null',
  'flock trava.lock git reset --hard',
  "trap 'git reset --hard' EXIT",
  "awk 'BEGIN{system(\"git reset --hard\")}'",
  'Start-Process git -ArgumentList "reset","--hard"',
  'Invoke-Command -ScriptBlock { git reset --hard }',
  // pasta .git por outros caminhos
  'rm -rf .gi*',
  'rm -rf .[g]it',
  'rm -rf .git/refs/tags',
  'rm .git/refs/tags/marco/2026-10-01-inicio',
  'find .git -delete',
  'find . -name .git -exec rm -rf {} +',
  'mv .git /tmp/x',
  'Remove-Item -Recurse -Force .\\.git',
  'python3 -c "import shutil; shutil.rmtree(\'.git\')"',
  "node -e \"require('fs').rmSync('.git',{recursive:true})\"",
  "printf '[alias]\\nx = reset --hard\\n' >> .git/config",
  // subcomandos que descartam trabalho ou movem referências
  'git checkout-index -f -a',
  'git read-tree --reset -u HEAD',
  'git rm -f src/App.tsx',
  'git checkout --pathspec-from-file=lista.txt',
  'git checkout -B main HEAD~1',
  'git switch -C main HEAD~1',
  'git branch -C main copia',
  'git update-ref refs/heads/main HEAD~3',
  'git fetch --prune --prune-tags',
  // commit que pula o pre-commit
  'git commit --no-verify -m "x"',
  'git commit -n -m "x"',
  'HUSKY=0 git commit -m "x"',
  'git -c core.hooksPath=/dev/null commit -m "x"',
  'git config core.hooksPath /dev/null',
  // v1.9, segunda revisão final: comando dentro de if/while/try e atribuição
  'if git reset --hard HEAD~1; then echo ok; fi',
  'while ! git reset --hard; do sleep 1; done',
  'if ! git clean -fd; then echo x; fi',
  'until git push --force origin main; do sleep 1; done',
  '$out = git reset --hard 2>&1',
  '$null = git clean -fd',
  'try { git reset --hard } catch { }',
  'git tag -l | ForEach-Object { git tag -d $_ }',
  'git branch --merged | ForEach-Object { git branch -D $_.Trim() }',
  'linux64 git reset --hard',
  "Start-Process -FilePath git -ArgumentList 'clean','-fd' -Wait",
  // mensagem de commit em heredoc com apóstrofo solto, seguida de comando destrutivo
  "git commit -m \"$(cat <<'EOF'\nfix: don't crash\nEOF\n)\" && git push --force origin main",
  "git commit -m \"$(cat <<'EOF'\nfeat: caixa d'água\nEOF\n)\" && git tag -f marco/x",
  // aninhamento além do limite
  'echo $(echo $(echo $(echo $(echo $(git reset --hard)))))',
  // pre-commit pulado por variável
  'export HUSKY=0; git commit -m x',
  '$env:HUSKY = "0"; git commit -m x',
  'GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null git commit -m x',
  "export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=alias.x GIT_CONFIG_VALUE_0='reset --hard'; git x",
  // valor colado à opção
  'git clean -fd -enode_modules',
  // pasta .git por caminho indireto
  'find . -name ".git" | xargs rm -rf',
  'npx --yes rimraf .git',
  'cd .git && rm -rf refs objects',
  'find . -delete',
  'rm -rf .[!.]*',
  'rm -rf .g{it,}',
  'Get-ChildItem .git -Recurse | Remove-Item -Force -Recurse',
  'Remove-Item -Path .GIT -Recurse -Force',
  'Rename-Item .git .git-old',
  'echo x | tee .git/HEAD',
  'dd if=/dev/null of=.git/HEAD',
  "sed -i 's/main/zz/' .git/HEAD",
  'Set-Content .git\\HEAD "x"',
]

const liberados = [
  'git status',
  'git log --oneline',
  'git diff --stat',
  'git add -A',
  'git commit -m "mensagem simples"',
  'git push',
  'git push origin main',
  'git push -u origin main',
  'git push --tags',
  'git pull --rebase',
  'git reset --soft HEAD~1',
  'git reset HEAD src/App.tsx',
  'git revert abc1234',
  'git clean -n',
  'git clean -nd',
  'git clean --dry-run -fd',
  'git branch',
  'git branch -d funcionalidade',
  'git branch -m novo-nome',
  'git checkout main',
  'git checkout -b funcionalidade',
  'git switch -c funcionalidade',
  'git switch main',
  'git restore --staged src/App.tsx',
  'git stash',
  'git tag marco/2026-10-01-inicio',
  'git worktree list',
  'npm test',
  'grep -r "reset --hard" .',
  'echo "git reset --hard"',
  "echo 'git clean -fd'",
  'git commit -m "documenta que git reset --hard e git clean -fd ficam bloqueados"',
  "git commit -m 'registra o bloqueio de git checkout -- arquivo'",
  'git commit -m "linha 1\nlinha 2: git push --force"',
  'git log --grep="git branch -D"',
  'cat > nota.md <<EOF\nNão rode git reset --hard sem aprovação.\nEOF',
  "cat > nota.md <<'EOF'\ngit checkout -- .\nEOF",
  'git commit -F - <<EOF\nregistro: a trava bloqueou git reset --hard\nEOF',
  'git commit -m "x" && echo "git clean -fd"',
  'echo git',
  '',
  // v1.9: ajuda, comentário e usos comuns que não podem ser bloqueados
  'git restore --help',
  'git clean --help',
  'git reset -h',
  'git status # && git reset --hard',
  'git checkout -',
  'git checkout main',
  'git checkout -b nova main',
  'git checkout --track origin/ramo',
  'git config user.name "Alex"',
  'git config --get alias.x',
  'git tag -l "marco/*"',
  'git tag -a marco/2026-10-01-x -m "marco"',
  'git stash pop',
  'git stash push -m "guardado"',
  'git worktree remove .claude/worktrees/x',
  'git worktree add .claude/worktrees/x',
  'git push --follow-tags origin main',
  'git push --set-upstream origin main',
  'git branch --list',
  'git branch -d integrada',
  'git reflog',
  'git gc',
  'powershell -Command "git status"',
  'cmd /c git status',
  'wsl git log',
  'timeout 5 git status',
  'python3 -c "print(1)"',
  'node -e "console.log(1)"',
  'rm -rf node_modules',
  'rm .gitignore',
  '"C:\\Program Files\\Git\\cmd\\git.exe" status',
  // v1.9, revisão final: o que os comandos do DevFlow mandam usar continua liberado
  'git show marco/2026-10-01-inicio:package.json > package.json',
  'git status > /dev/null 2>&1',
  'npx supabase start > /dev/null 2>&1',
  'git commit -m "explica por que --no-verify é proibido"',
  'git fetch --prune',
  'git rm --cached segredo.txt',
  'git rm arquivo-antigo.txt',
  'git push --follow-tags',
  'git reset --soft HEAD~1',
  'git diff --exit-code src/types/database.ts',
  'git log -S "sb_secret_" --oneline',
  'git revert --no-edit abc1234',
  'git merge funcionalidade',
  'git switch -c login-perfis',
  'rm -rf tmpvite',
  'rm .git/index.lock',
  'rm .gitignore.bak',
  'echo "git reset --hard" > nota.txt',
  'echo "nunca rode git reset --hard" | tee aviso.md',
  'npm test | tail -5',
  'source ~/.nvm/nvm.sh',
  'bash scripts/conferir.sh',
  'find . -name "*.tmp" -delete',
  'mv rascunho.md .scratch/backlog.md',
  'cat .git/HEAD',
  // v1.9, segunda revisão final: falsos positivos corrigidos
  'rm -rf dist/*',
  'rm -rf coverage/*',
  'rm -rf node_modules/.cache/*',
  'mv tmpvite/* .',
  'mv src/components/* src/ui/',
  'find . -name "*.log" -not -path "./node_modules/*" -delete',
  'find . -not -path "./.git/*" -name "*.bak" -delete',
  'find . -name "*.md" -exec grep -l "git reset --hard" {} +',
  'find . -name "*.md" | xargs grep -n "git push --force"',
  'time grep -r "git reset --hard" .',
  'timeout 60 grep -rn "git push --force" .claude/',
  'npx vitest run -t "git reset --hard"',
  'echo rm .git',
  'echo git reset --hard',
  'git commit -m"fix: nova tela"',
  'git tag -a v1.1 -m"fim"',
  'git checkout main --',
  'git config core.hooksPath',
  "node -e \"console.log(process.platform, require('fs').existsSync('.git/hooks'))\"",
  'bash scripts/x.sh "git reset --hard"',
  "git commit -m \"$(cat <<'EOF'\nfix: don't crash\nEOF\n)\"",
  "git commit -m \"$(cat <<'EOF'\nfix: don't crash\nEOF\n)\" && git push origin main",
  'if git diff --quiet; then echo limpo; fi',
  '$status = git status --porcelain',
  'cd git-utils && ls',
  'npm install simple-git',
]

describe('motivoDoBloqueio', () => {
  // O checkout só é liberado para nomes que existem como ramo, tag ou commit.
  // Aqui o git real é trocado por uma lista fixa, para o teste valer em qualquer pasta.
  beforeAll(() => usarResolvedor((nome) => ['main', 'HEAD', 'origin/ramo'].includes(nome)))
  afterAll(() => usarResolvedor(null))

  it.each(bloqueados)('bloqueia: %s', (comando) => {
    expect(motivoDoBloqueio(comando)).toBeTruthy()
  })

  it.each(liberados)('libera: %s', (comando) => {
    expect(motivoDoBloqueio(comando)).toBeNull()
  })

  it('devolve o motivo em português', () => {
    expect(motivoDoBloqueio('git reset --hard')).toMatch(/apaga mudanças não comitadas/)
    expect(motivoDoBloqueio('git push --force')).toMatch(/reescreve o histórico/)
  })

  it('responde rápido a texto longo e repetitivo', () => {
    const inicio = Date.now()
    expect(motivoDoBloqueio(`python3 -c "${'git reset '.repeat(3000)}"`)).toBeTruthy()
    expect(Date.now() - inicio).toBeLessThan(1000)
  })

  it('não trava com aninhamento muito fundo', () => {
    let comando = 'git reset --hard'
    for (let i = 0; i < 8; i++) comando = `bash -c ${JSON.stringify(comando)}`
    expect(() => motivoDoBloqueio(comando)).not.toThrow()
  })

  it('não trava com aspas sem fechar', () => {
    expect(() => motivoDoBloqueio('echo "aberta $(git status')).not.toThrow()
    expect(() => motivoDoBloqueio("echo 'aberta")).not.toThrow()
  })
})

function rodarHook(entrada) {
  return spawnSync(process.execPath, [hook], { input: entrada, encoding: 'utf8' })
}

const evento = (comando, ferramenta = 'Bash') =>
  JSON.stringify({ tool_name: ferramenta, tool_input: { command: comando } })

describe('hook (entrada e saída)', () => {
  it('sai com código 2 e explica o bloqueio', () => {
    const resultado = rodarHook(evento('git reset --hard'))
    expect(resultado.status).toBe(2)
    expect(resultado.stderr).toMatch(/BLOQUEADO pela trava do DevFlow/)
    expect(resultado.stderr).toMatch(/git revert/)
  })

  it('sai com código 0 quando o comando é liberado', () => {
    expect(rodarHook(evento('git status')).status).toBe(0)
  })

  it('libera registro que só cita o comando proibido', () => {
    const comando = 'git commit -m "trava bloqueou git reset --hard"'
    expect(rodarHook(evento(comando)).status).toBe(0)
  })

  it('libera evento sem comando', () => {
    expect(rodarHook('{"tool_name":"Read","tool_input":{"file_path":"a"}}').status).toBe(0)
  })

  it('bloqueia quando o evento chega ilegível', () => {
    const invalido = rodarHook('isto não é JSON')
    expect(invalido.status).toBe(2)
    expect(invalido.stderr).toMatch(/ilegível/)
    expect(rodarHook('').status).toBe(2)
  })

  it('aceita o teste manual por --testar', () => {
    const bloqueado = spawnSync(process.execPath, [hook, '--testar', 'git clean -fd'], { encoding: 'utf8' })
    const liberado = spawnSync(process.execPath, [hook, '--testar', 'git status'], { encoding: 'utf8' })
    expect(bloqueado.status).toBe(2)
    expect(liberado.status).toBe(0)
    expect(liberado.stdout).toMatch(/liberado/)
  })
})
