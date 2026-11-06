// Trava do DevFlow: impede que o Claude rode comandos git que apagam histórico
// ou descartam trabalho não comitado. A lista segue a seção "Segurança e
// Recuperação" do CLAUDE.md.
//
// O hook olha só o comando que vai rodar. Texto entre aspas simples, mensagem de
// commit e corpo de heredoc são ignorados, exceto quando alimentam um shell
// (bash -c "...", eval, bash <<EOF). Substituições $(...) e `...` são analisadas.
//
// Uso pelo Claude Code: lê o JSON do evento na entrada padrão e sai com código 2
// (bloqueia, com a mensagem em stderr) ou 0 (libera).
// Teste manual: node .claude/hooks/bloquear-git-destrutivo.mjs --testar "git reset --hard"
//
// Cobre também: opção abreviada do git (--har), checkout de arquivo, alias do git,
// PowerShell, cmd, wsl, caminho do Windows com barra invertida, tag/stash/worktree/
// ramo remoto apagados, rm da pasta .git, redirecionamento antes do comando,
// texto entregue a um shell por pipe e commit que pula o pre-commit.
//
// Não cobre, porque o hook só enxerga o texto do comando: script em arquivo
// (node script.js), variável ou função que monta o comando ($CMD, g() { git "$@"; }),
// texto codificado (base64) e alias já gravado no ~/.gitconfig ou no .git/config.
// A trava reduz acidentes; quem garante a regra é o CLAUDE.md.
import { execFileSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const POWERSHELLS = new Set(['powershell', 'pwsh'])
const SHELLS = new Set([
  'bash', 'sh', 'zsh', 'dash', 'ksh', 'fish', 'busybox', 'eval', 'cmd',
  'iex', 'invoke-expression', ...POWERSHELLS,
])
const WRAPPERS = new Set([
  'env', 'command', 'sudo', 'doas', 'nohup', 'time', 'exec', 'nice', 'builtin',
  'xargs', 'then', 'do', 'else', '!', '{', 'timeout', 'stdbuf', 'setsid', 'ionice',
  'taskset', 'watch', 'find', 'wsl', 'start', 'call', 'script', 'flock', 'parallel',
  'invoke-command', 'icm', 'coproc', 'trap', 'su', 'npx', 'strace', 'chronic', 'unbuffer', 'ssh',
  'if', 'while', 'until', 'elif', 'function', 'try', 'catch', 'finally',
])
// Nestes, o comando a executar vem inteiro numa palavra entre aspas.
const WRAPPERS_DE_TEXTO = new Set(['trap', 'script', 'su', 'ssh', 'watch', 'parallel', 'coproc'])
// Comandos que só mostram texto: "echo git reset --hard" não executa nada.
const IMPRESSORES = new Set(['echo', 'printf', 'write-output', 'write-host', 'grep', 'rg', 'select-string'])
const LEITORES_DE_SCRIPT = new Set(['source', '.'])
const OPCOES_GLOBAIS_COM_VALOR = new Set([
  '-C', '-c', '--git-dir', '--work-tree', '--namespace', '--super-prefix', '--config-env',
  '--attr-source',
])
const OPCOES_DE_CONFIG = new Set(['-c', '--config-env'])
const INTERPRETADORES = /^(python[\d.]*|py|node|nodejs|deno|bun|perl|ruby|php|lua)$/
const REMOVEDORES = new Set([
  'rm', 'rmdir', 'rd', 'del', 'erase', 'remove-item', 'ri', 'mv', 'move', 'move-item', 'ren', 'rename-item',
  'shred', 'rimraf', 'unlink', 'truncate',
  // escrevem por cima do que há na pasta do git
  'tee', 'dd', 'sed', 'set-content', 'out-file', 'add-content', 'chmod',
])
const MAX_PROFUNDIDADE = 4

const nomeBase = (palavra) => palavra.split(/[\\/]/).pop().toLowerCase().replace(/\.exe$/, '')
const ehAtribuicao = (palavra) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(palavra)

// ---------- leitura do comando (aspas, substituições e heredocs) ----------

// Ligada quando um $(...) ou `...` termina sem fechar: a leitura não é confiável.
let leituraIncompleta = false

function lerAteFechar(texto, inicio, abre, fecha) {
  let nivel = 1
  let i = inicio
  while (i < texto.length && nivel > 0) {
    const c = texto[i]
    if (c === "'") {
      const f = texto.indexOf("'", i + 1)
      i = f < 0 ? texto.length : f + 1
      continue
    }
    if (c === '\\') { i += 2; continue }
    if (c === '<' && texto[i + 1] === '<' && texto[i + 2] !== '<') {
      // Corpo de heredoc dentro de $(...): pulado inteiro, para um apóstrofo solto
      // na mensagem de commit não engolir o resto da linha.
      const comTabs = texto[i + 2] === '-'
      let j = i + (comTabs ? 3 : 2)
      while (texto[j] === ' ' || texto[j] === '\t') j++
      const [delim, depois] = lerDelimitador(texto, j)
      const fimLinha = texto.indexOf('\n', depois)
      if (delim && fimLinha >= 0) {
        i = lerCorpoHeredoc(texto, fimLinha + 1, delim, comTabs)[1]
        continue
      }
    }
    if (c === abre && abre !== fecha) nivel++
    if (c === fecha) nivel--
    i++
  }
  if (nivel !== 0) leituraIncompleta = true
  const fim = nivel === 0 ? i - 1 : i
  return [texto.slice(inicio, fim), i]
}

function lerDelimitador(texto, inicio) {
  let j = inicio
  let delim = ''
  while (j < texto.length && !/[\s;&|()<>]/.test(texto[j])) {
    const ch = texto[j]
    if (ch === "'" || ch === '"') {
      const f = texto.indexOf(ch, j + 1)
      const fim = f < 0 ? texto.length : f
      delim += texto.slice(j + 1, fim)
      j = fim + 1
    } else if (ch === '\\') {
      delim += texto[j + 1] ?? ''
      j += 2
    } else {
      delim += ch
      j++
    }
  }
  return [delim, j]
}

function lerCorpoHeredoc(texto, inicio, delim, aceitaTabs) {
  const linhas = []
  let i = inicio
  while (i < texto.length) {
    const fimLinha = texto.indexOf('\n', i)
    const linha = texto.slice(i, fimLinha < 0 ? texto.length : fimLinha)
    i = fimLinha < 0 ? texto.length : fimLinha + 1
    if ((aceitaTabs ? linha.replace(/^\t+/, '') : linha) === delim) break
    linhas.push(linha)
  }
  return [linhas.join('\n'), i]
}

function lerAspasDuplas(texto, inicio, aninhados) {
  let i = inicio
  let valor = ''
  while (i < texto.length && texto[i] !== '"') {
    const c = texto[i]
    if (c === '\\') {
      // Entre aspas duplas, a barra só escapa $ ` " \ e quebra de linha; nos demais
      // casos ela fica (caminho do Windows, como "C:\Program Files\Git\cmd\git.exe").
      const prox = texto[i + 1] ?? ''
      valor += '$`"\\\n'.includes(prox) ? prox : `\\${prox}`
      i += 2
      continue
    }
    if (c === '$' && texto[i + 1] === '(') {
      const [corpo, prox] = lerAteFechar(texto, i + 2, '(', ')')
      aninhados.push(corpo)
      i = prox
      continue
    }
    if (c === '`') {
      const [corpo, prox] = lerAteFechar(texto, i + 1, '`', '`')
      aninhados.push(corpo)
      i = prox
      continue
    }
    valor += c
    i++
  }
  return [valor, i + 1]
}

function alimentaShell(comandos) {
  return comandos.some((palavras) => {
    const alvo = localizarAlvo(palavras)
    return alvo >= 0 && SHELLS.has(nomeBase(palavras[alvo]))
  })
}

// Separa o texto em comandos simples (listas de palavras, já sem aspas) e em
// trechos aninhados que também precisam ser analisados.
function lexar(texto) {
  const comandos = []
  const aninhados = []
  const pendentes = []
  let palavras = []
  let atual = ''
  let temPalavra = false
  let inicioLinha = 0
  let i = 0

  const fecharPalavra = () => {
    if (temPalavra) palavras.push(atual)
    atual = ''
    temPalavra = false
  }
  const fecharComando = () => {
    fecharPalavra()
    if (palavras.length) comandos.push(palavras)
    palavras = []
  }

  while (i < texto.length) {
    const c = texto[i]
    if (c === '#' && !temPalavra) {
      const fimLinha = texto.indexOf('\n', i)
      i = fimLinha < 0 ? texto.length : fimLinha
    } else if (c === '\\' && /^[A-Za-z]:/.test(atual)) {
      atual += c
      i++
    } else if (c === '\\') {
      if (texto[i + 1] !== '\n') { atual += texto[i + 1] ?? ''; temPalavra = true }
      i += 2
    } else if (c === "'") {
      const f = texto.indexOf("'", i + 1)
      const fim = f < 0 ? texto.length : f
      atual += texto.slice(i + 1, fim)
      temPalavra = true
      i = fim + 1
    } else if (c === '"') {
      const [valor, prox] = lerAspasDuplas(texto, i + 1, aninhados)
      atual += valor
      temPalavra = true
      i = prox
    } else if (c === '$' && texto[i + 1] === "'") {
      i++ // $'...' do bash: lido como aspas simples
    } else if (c === '&' && /[<>]$/.test(atual)) {
      atual += c // 2>&1 e >&2 são redirecionamento, não fim de comando
      i++
    } else if (c === '$' && texto[i + 1] === '(') {
      const [corpo, prox] = lerAteFechar(texto, i + 2, '(', ')')
      aninhados.push(corpo)
      i = prox
    } else if (c === '`') {
      const [corpo, prox] = lerAteFechar(texto, i + 1, '`', '`')
      aninhados.push(corpo)
      i = prox
    } else if (c === '<' && texto[i + 1] === '<' && texto[i + 2] === '<') {
      atual += '<<<' // here-string: fica na palavra e sai junto com os redirecionamentos
      temPalavra = true
      i += 3
    } else if (c === '<' && texto[i + 1] === '<' && texto[i + 2] !== '<') {
      fecharPalavra()
      const aceitaTabs = texto[i + 2] === '-'
      let j = i + (aceitaTabs ? 3 : 2)
      while (texto[j] === ' ' || texto[j] === '\t') j++
      const [delim, prox] = lerDelimitador(texto, j)
      pendentes.push({ delim, aceitaTabs })
      i = prox
    } else if (c === '\n') {
      fecharComando()
      i++
      for (const { delim, aceitaTabs } of pendentes.splice(0)) {
        const [corpo, prox] = lerCorpoHeredoc(texto, i, delim, aceitaTabs)
        if (alimentaShell(comandos.slice(inicioLinha))) aninhados.push(corpo)
        i = prox
      }
      inicioLinha = comandos.length
    } else if (/[;&|()]/.test(c)) {
      fecharComando()
      i++
    } else if (c === ' ' || c === '\t' || c === '\r' || c === '\u00a0') {
      fecharPalavra()
      i++
    } else {
      atual += c
      temPalavra = true
      i++
    }
  }
  fecharComando()
  return { comandos, aninhados }
}

// ---------- regras ----------

// Tira os redirecionamentos (>/dev/null, 2>&1, < arquivo, <<<texto), que podem
// vir antes do comando e não fazem parte dele.
function semRedirecionamentos(palavras) {
  const limpas = []
  for (let k = 0; k < palavras.length; k++) {
    const p = palavras[k]
    if (/^(\d*|&)(>>?|<)(&\d*-?)?$/.test(p)) { if (!/&\d/.test(p)) k++; continue }
    if (p === '<<<') { k++; continue }
    if (/^(\d*|&)(>>?|<<<|<)./.test(p)) continue
    limpas.push(p)
  }
  return limpas
}

const ehGit = (palavra) => {
  const nome = nomeBase(palavra)
  return nome === 'git' || nome.startsWith('git-')
}

function localizarAlvo(palavras) {
  let k = 0
  while (k < palavras.length && ehAtribuicao(palavras[k])) k++
  if (k >= palavras.length) return -1
  const primeiro = nomeBase(palavras[k])
  if (ehGit(palavras[k]) || SHELLS.has(primeiro)) return k
  if (WRAPPERS.has(primeiro)) {
    for (let j = k + 1; j < palavras.length; j++) {
      if (ehGit(palavras[j]) || SHELLS.has(nomeBase(palavras[j]))) return j
    }
    return -1
  }
  if (IMPRESSORES.has(primeiro)) return k
  // "$out = git reset --hard", "linux64 git ...", "ForEach-Object { git tag -d $_ }":
  // o git pode vir depois de qualquer coisa. Procura a primeira palavra "git".
  const g = palavras.findIndex((p, idx) => idx > k && ehGit(p))
  return g >= 0 ? g : k
}

// --{hard,soft} do bash vira --hard e --soft.
function expandirChaves(arg) {
  const m = /^(.*?)\{([^{}]*)\}(.*)$/.exec(arg)
  return m ? m[2].split(',').map((alt) => m[1] + alt + m[3]) : [arg]
}

const COM_VALOR_COLADO = new Set(['m', 'e', 'F', 'S'])

function separarOpcoes(args) {
  const curtas = new Set()
  const longas = new Set()
  const posicionais = []
  let fimDasOpcoes = false
  for (const arg of args.flatMap(expandirChaves)) {
    if (fimDasOpcoes) posicionais.push(arg)
    else if (arg === '--') { fimDasOpcoes = true; longas.add('--') }
    else if (arg.startsWith('--')) longas.add(arg.split('=')[0])
    else if (arg.startsWith('-') && arg.length > 1) {
      // -m"texto", -e.env, -uno: depois de uma opção que leva valor, o resto é o valor.
      for (const ch of arg.slice(1)) {
        if (!/[A-Za-z]/.test(ch)) break
        curtas.add(ch)
        if (COM_VALOR_COLADO.has(ch)) break
      }
    }
    else posicionais.push(arg)
  }
  return { curtas, longas, posicionais, todos: args }
}

// O git aceita opção longa abreviada (--h vale --hard). Aqui, qualquer prefixo
// de pelo menos uma letra depois dos traços conta como a opção inteira, o que
// pode bloquear a mais, nunca a menos.
const casa = (longas, ...nomes) =>
  [...longas].some((l) => l.length >= 3 && nomes.some((n) => n.startsWith(l)))

// Se o texto é um ramo, uma tag ou um commit que existe. Trocável nos testes.
function ehReferenciaDoGit(nome) {
  if (nome.startsWith('-')) return false
  // O ramo pode existir só no remoto (o git o criaria a partir de origin/<nome>).
  return [`${nome}^{commit}`, `refs/remotes/origin/${nome}^{commit}`].some((ref) => {
    try {
      execFileSync('git', ['rev-parse', '--verify', '--quiet', ref], { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  })
}
let resolverReferencia = ehReferenciaDoGit
export function usarResolvedor(funcao) {
  resolverReferencia = funcao ?? ehReferenciaDoGit
}

const DESCARTA = 'descarta mudanças que ainda não foram comitadas'
const MOTIVO_PRE_COMMIT = 'o commit pularia o pre-commit (lint, typecheck e testes); se o pre-commit barrar, corrija a causa'
const MOTIVO_ALIAS = 'um alias do git pode esconder um comando destrutivo, e o hook não enxerga o que ele executa'

const regraCheckout = ({ curtas, longas, posicionais, todos }) => {
  // "git checkout main --": o -- no fim não traz caminho nenhum.
  if (todos.at(-1) === '--' && posicionais.length === 1 && resolverReferencia(posicionais[0])) return false
  const motivo = `\`git checkout\` com caminho de arquivo, ponto ou -f ${DESCARTA} (para trocar de ramo, use \`git switch <ramo>\`)`
  if (longas.has('--') || curtas.has('f') || casa(longas, '--force', '--pathspec-from-file')) return motivo
  if (curtas.has('B')) return '`git checkout -B` move um ramo que já existe e descarta os commits dele'
  if (curtas.has('b') || curtas.has('t') || casa(longas, '--orphan', '--track')) return false
  if (posicionais.length === 0) return false
  const [primeiro] = posicionais
  const voltaAoRamoAnterior = primeiro === '-' || /^@\{-\d+\}$/.test(primeiro)
  return (posicionais.length > 1 || !(voltaAoRamoAnterior || resolverReferencia(primeiro))) && motivo
}

const REGRAS = {
  reset: ({ longas, todos }) =>
    (casa(longas, '--hard') || todos.some((a) => a.includes('$'))) &&
    '`git reset --hard` apaga mudanças não comitadas e descarta commits (com variável no comando, a trava não tem como saber o modo e bloqueia)',
  clean: ({ curtas, longas }) =>
    !(curtas.has('n') || casa(longas, '--dry-run')) &&
    '`git clean` apaga arquivos que o git ainda não acompanha (para só ver o que seria apagado, use `git clean -n`)',
  push: ({ curtas, longas, posicionais }) =>
    (curtas.has('f') || curtas.has('d') ||
      casa(longas, '--force', '--force-with-lease', '--force-if-includes', '--mirror', '--delete', '--prune') ||
      posicionais.some((p) => p.startsWith('+') || p.startsWith(':'))) &&
    'push forçado ou que apaga ramo ou tag reescreve o histórico no repositório remoto',
  branch: ({ curtas, longas }) =>
    (curtas.has('D') || curtas.has('M') || curtas.has('C') || curtas.has('f') || casa(longas, '--force')) &&
    '`git branch -D`, `-M` ou `-f` apaga ou move a branch mesmo com trabalho não integrado (se ela já foi integrada, `git branch -d`, com d minúsculo, basta)',
  checkout: regraCheckout,
  restore: ({ curtas, longas }) => {
    const soIndice = (curtas.has('S') || casa(longas, '--staged')) && !(curtas.has('W') || casa(longas, '--worktree'))
    return !soIndice && `\`git restore\` ${DESCARTA}`
  },
  switch: ({ curtas, longas }) =>
    (curtas.has('f') || curtas.has('C') || casa(longas, '--force', '--force-create', '--discard-changes')) &&
    `\`git switch\` forçado ${DESCARTA}`,
  tag: ({ curtas, longas }) =>
    (curtas.has('d') || curtas.has('f') || casa(longas, '--delete', '--force')) &&
    '`git tag -d` ou `-f` apaga ou move um marco, e os marcos são o ponto de volta do projeto',
  worktree: ({ curtas, longas, posicionais }) =>
    posicionais[0] === 'remove' && (curtas.has('f') || casa(longas, '--force')) &&
    '`git worktree remove --force` apaga a pasta de trabalho mesmo com mudanças não comitadas',
  stash: ({ posicionais }) =>
    ['drop', 'clear'].includes(posicionais[0]) && '`git stash drop` e `clear` apagam trabalho guardado',
  reflog: ({ posicionais }) =>
    ['expire', 'delete'].includes(posicionais[0]) && '`git reflog expire` e `delete` apagam o registro que permite recuperar commits',
  gc: ({ longas }) => casa(longas, '--prune') && '`git gc --prune` apaga objetos que ainda poderiam ser recuperados',
  'update-ref': () => '`git update-ref` move ou apaga uma referência (ramo ou tag) sem passar pelas proteções do git',
  'checkout-index': ({ curtas, longas }) =>
    (curtas.has('f') || casa(longas, '--force')) && `\`git checkout-index -f\` ${DESCARTA}`,
  'read-tree': ({ longas }) => casa(longas, '--reset') && `\`git read-tree --reset\` ${DESCARTA}`,
  rm: ({ curtas, longas }) =>
    (curtas.has('f') || casa(longas, '--force')) && `\`git rm -f\` apaga o arquivo e ${DESCARTA}`,
  fetch: ({ curtas, longas }) =>
    (curtas.has('P') || longas.has('--prune-tags')) && '`git fetch --prune-tags` apaga marcos locais que não estão no remoto',
  commit: ({ curtas, longas }) =>
    (curtas.has('n') || casa(longas, '--no-verify')) && MOTIVO_PRE_COMMIT,
  'filter-branch': () => '`git filter-branch` reescreve todo o histórico',
  'filter-repo': () => '`git filter-repo` reescreve todo o histórico',
  config: ({ longas, curtas, posicionais }) =>
    !(casa(longas, '--get', '--get-all', '--list') || curtas.has('l')) &&
    ((posicionais.some((p) => /^alias\./i.test(p)) && MOTIVO_ALIAS) ||
      (posicionais.length > 1 && posicionais.some((p) => /^core\.hookspath$/i.test(p)) && MOTIVO_PRE_COMMIT)),
}

function avaliarGit(args) {
  let i = 0
  while (i < args.length && args[i].startsWith('-')) {
    if (OPCOES_DE_CONFIG.has(args[i]) && /^alias\./i.test(args[i + 1] ?? '')) return MOTIVO_ALIAS
    if (/^(--config-env=|-c)alias\./i.test(args[i])) return MOTIVO_ALIAS
    if (/^--config-env=core\.hookspath/i.test(args[i])) return MOTIVO_PRE_COMMIT
    if (args[i] === '-c' && /^core\.hookspath/i.test(args[i + 1] ?? '')) return MOTIVO_PRE_COMMIT
    i += OPCOES_GLOBAIS_COM_VALOR.has(args[i]) ? 2 : 1
  }
  const resto = args.slice(i + 1)
  const soAjuda = resto.length === 1 && (resto[0] === '--help' || resto[0] === '-h')
  const regra = Object.hasOwn(REGRAS, args[i]) ? REGRAS[args[i]] : null
  if (!regra || soAjuda) return null
  return regra(separarOpcoes(resto)) || null
}

const COMANDO_POWERSHELL = /^-c(o(m(m(a(n(d)?)?)?)?)?)?$/i
const COMANDO_CODIFICADO = /^-e(n(c(o(d(e(d(c(o(m(m(a(n(d)?)?)?)?)?)?)?)?)?)?)?)?)?$/i

// Devolve o texto que o shell vai executar, ou null se não houver como ler.
function textoDoShell(nome, args) {
  if (nome === 'eval') return args.join(' ')
  if (nome === 'iex' || nome === 'invoke-expression') {
    return args.filter((a) => !COMANDO_POWERSHELL.test(a)).join(' ')
  }
  if (nome === 'cmd') {
    const k = args.findIndex((a) => /^\/[ck]/i.test(a))
    return k < 0 ? null : [args[k].slice(2), ...args.slice(k + 1)].join(' ')
  }
  if (POWERSHELLS.has(nome)) {
    const k = args.findIndex((a) => COMANDO_POWERSHELL.test(a))
    if (k >= 0) return args.slice(k + 1).join(' ')
    const c = args.findIndex((a) => COMANDO_CODIFICADO.test(a))
    if (c >= 0 && args[c + 1]) return Buffer.from(args[c + 1], 'base64').toString('utf16le')
    const soltos = args.filter((a) => !a.startsWith('-'))
    return soltos.length ? soltos.join(' ') : null
  }
  const k = args.findIndex((a) => /^-[a-zA-Z]*c[a-zA-Z]*$/.test(a))
  return k < 0 || k + 1 >= args.length ? null : args[k + 1]
}

function avaliarShell(nome, args, profundidade) {
  const texto = textoDoShell(nome, args)
  return texto === null ? null : motivoDoBloqueio(texto, profundidade + 1)
}

// Shell sem texto próprio (sh lendo de um pipe, bash <<< "...", source <(...),
// "..." | iex): o que ele executa vem de outro ponto da linha.
function shellLendoDeFora(palavras) {
  const limpas = semRedirecionamentos(palavras)
  const alvo = localizarAlvo(limpas)
  if (alvo < 0) return false
  const nome = nomeBase(limpas[alvo])
  if (LEITORES_DE_SCRIPT.has(nome)) return !limpas.slice(alvo + 1).some((a) => !a.startsWith('-'))
  if (!SHELLS.has(nome)) return false
  const args = limpas.slice(alvo + 1)
  const texto = textoDoShell(nome, args)
  if (texto !== null) return texto.trim() === ''
  return !args.some((a) => !a.startsWith('-')) // "bash script.sh" lê do arquivo, não da linha
}

const casaGlob = (padrao, nome) => {
  if (!/[*?[{]/.test(padrao)) return padrao === nome
  // No shell, * e ? não casam nome começado por ponto: "dist/*" não alcança ".git".
  if (!padrao.startsWith('.')) return false
  const fonte = padrao
    .replace(/[.+^$()|\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
    .replace(/\[!/g, '[^')
    .replace(/\{([^{}]*)\}/g, (_, alts) => `(${alts.split(',').join('|')})`)
  try { return new RegExp(`^${fonte}$`).test(nome) } catch { return false }
}

// O caminho aponta para a pasta .git ou para algo dentro dela (menos arquivos .lock).
function tocaPastaGit(caminho) {
  const c = caminho.replace(/^(of|if)=/, '').toLowerCase() // dd of=.git/HEAD; no Windows, .GIT é a mesma pasta
  if (/\.lock$/.test(c)) return false
  if (/(^|\.)\.git$/.test(c)) return true // ".\.git" do PowerShell chega aqui como "..git"
  if (/^\.?\.git(head|config|hooks|refs|objects|index|packed-refs)/.test(c)) return true // ".git\HEAD" sem a barra
  return c.split(/[\\/]/).some((segmento) => casaGlob(segmento, '.git'))
}

// "> .git/config" ou ">> .git/HEAD": escrita direta dentro da pasta do git.
function escreveNaPastaGit(palavras) {
  return palavras.some((p, k) => {
    const m = /^(\d*|&)>>?(.*)$/.exec(p)
    if (!m) return false
    const destino = m[2] || palavras[k + 1] || ''
    return tocaPastaGit(destino)
  })
}

// Posição do comando de fato: a primeira palavra, pulando atribuições, wrappers e opções.
function indiceDoComando(palavras) {
  let k = 0
  while (k < palavras.length) {
    const nome = nomeBase(palavras[k])
    const pula = ehAtribuicao(palavras[k]) || palavras[k].startsWith('-') || (WRAPPERS.has(nome) && nome !== 'find')
    if (!pula) break
    k++
  }
  return k
}

function findQueApaga(args) {
  const apaga = args.includes('-delete') || (args.some((a) => a === '-exec' || a === '-execdir') && args.some((a) => REMOVEDORES.has(nomeBase(a))))
  if (!apaga) return false
  const primeiraOpcao = args.findIndex((a) => a.startsWith('-') || a === '!' || a === '(')
  const partidas = primeiraOpcao < 0 ? args : args.slice(0, primeiraOpcao)
  if (partidas.some(tocaPastaGit)) return true
  const exclui = args.some((a) => a === '-not' || a === '!' || a === '-prune')
  const nomeado = args.some((a, n) => /^-i?(name|path)$/.test(args[n - 1] ?? '') && tocaPastaGit(a))
  if (nomeado) return !exclui
  const semFiltro = !args.some((a) => /^-i?(name|path|regex|type|newer|mtime|size)$/.test(a))
  return semFiltro && partidas.some((d) => d === '.' || d === './') // "find . -delete" leva tudo, .git inclusive
}

function apagaPastaGit(palavras) {
  const k = indiceDoComando(palavras)
  if (k >= palavras.length) return false
  const nome = nomeBase(palavras[k])
  const args = palavras.slice(k + 1)
  if (nome === 'find') return findQueApaga(args)
  if (nome === 'cd' || nome === 'pushd' || nome === 'set-location') return false
  return REMOVEDORES.has(nome) && args.some(tocaPastaGit)
}

// "find . -name .git | xargs rm -rf", "Get-ChildItem .git -Recurse | Remove-Item",
// "cd .git && rm -rf refs": o alvo e o comando que apaga estão em pedaços diferentes da linha.
function apagaPastaGitEmPedacos(comandos) {
  const remove = comandos.some((p) => {
    const k = indiceDoComando(p)
    return k < p.length && REMOVEDORES.has(nomeBase(p[k]))
  })
  return remove && comandos.some((p) => p.some(tocaPastaGit))
}

// python -c, node -e, perl -e e semelhantes: o código vai como texto, e a busca
// no texto bruto pega "git reset --hard" mesmo dentro de subprocess.run([...]).
function avaliarInterpretador(args) {
  const k = args.findIndex((a) => /^(--eval|--print|-[a-zA-Z]*[cepErR])$/.test(a))
  if (k < 0) return null
  const codigo = args.slice(k + 1).join(' ')
  const mexeEmArquivo = /\b(rmtree|rmSync|rmdirSync|unlink|rmdir|remove|rename|renameSync|writeFileSync|truncate|open)\b/.test(codigo)
  if (mexeEmArquivo && /\.git(['"\\/]|$)/.test(codigo)) return MOTIVO_PASTA_GIT
  return avaliarTextoBruto(codigo)
}

const MOTIVO_PASTA_GIT = 'apagar ou mover a pasta `.git` (ou o que há dentro dela) destrói o histórico ou os marcos do projeto'
const SUBCOMANDOS_QUE_DESCARTAM = new Set(['reset', 'clean', 'checkout', 'restore'])

function avaliarComando(palavrasBrutas, profundidade) {
  const palavras = semRedirecionamentos(palavrasBrutas)
  if (apagaPastaGit(palavras) || escreveNaPastaGit(palavrasBrutas)) return MOTIVO_PASTA_GIT
  if (/(^|\s)(export\s+|set\s+|\$env:)HUSKY\s*=\s*["']?0/i.test(palavras.join(' '))) return MOTIVO_PRE_COMMIT
  // Configuração do git passada por variável de ambiente, na mesma linha ou por export.
  if (palavras.some((p) => /^GIT_CONFIG_(KEY_\d+|PARAMETERS)=.*alias\./i.test(p))) return MOTIVO_ALIAS
  if (palavras.some((p) => /^GIT_CONFIG_(KEY_\d+|PARAMETERS)=.*core\.hookspath/i.test(p))) return MOTIVO_PRE_COMMIT
  const comando = nomeBase(palavras[indiceDoComando(palavras)] ?? '')
  if (comando === 'start-process' || comando === 'saps') {
    const k = indiceDoComando(palavras)
    return motivoDoBloqueio(palavras.slice(k + 1).filter((a) => !/^-[A-Za-z]+$/.test(a)).join(' ').replace(/,/g, ' '), profundidade + 1)
  }
  const primeira = palavras.find((p) => !ehAtribuicao(p))
  if (primeira && WRAPPERS.has(nomeBase(primeira))) {
    // env -S "git reset --hard", script -c "...", trap '...' EXIT: o comando vem numa palavra só.
    const deTexto = WRAPPERS_DE_TEXTO.has(nomeBase(primeira))
    for (const [n, p] of palavras.entries()) {
      const depoisDeOpcao = /^-[a-zA-Z]*[cS]$/.test(palavras[n - 1] ?? '')
      if ((deTexto || depoisDeOpcao) && /\s/.test(p) && /\bgit\b/.test(p)) {
        const motivo = motivoDoBloqueio(p, profundidade + 1)
        if (motivo) return motivo
      }
    }
  }
  const alvo = localizarAlvo(palavras)
  if (alvo < 0) return null
  let nome = nomeBase(palavras[alvo])
  let args = palavras.slice(alvo + 1)
  if (nome.startsWith('git-')) { args = [nome.slice(4), ...args]; nome = 'git' } // /usr/lib/git-core/git-reset
  if (nome === 'git') {
    const antes = palavras.slice(0, alvo)
    if (antes.some((p) => /^HUSKY=0$/.test(p))) return MOTIVO_PRE_COMMIT
    const viaXargs = antes.some((p) => nomeBase(p) === 'xargs')
    if (viaXargs && args.some((a) => SUBCOMANDOS_QUE_DESCARTAM.has(a))) {
      return 'com `xargs`, as opções do git vêm de fora do comando e a trava não tem como conferi-las'
    }
    return avaliarGit(args)
  }
  if (SHELLS.has(nome)) return avaliarShell(nome, args, profundidade)
  if (nome === 'awk' || nome === 'gawk') return avaliarTextoBruto(args.join(' '))
  if (INTERPRETADORES.test(nome)) return avaliarInterpretador(args)
  return null
}

// Se a leitura do comando falhar, vale a busca no texto bruto: pode errar para
// o lado seguro (bloquear a mais), nunca para o lado perigoso.
function avaliarTextoBruto(texto) {
  const MOTIVO = 'o comando parece descartar trabalho ou histórico e não pôde ser analisado com precisão'
  if (texto.length > 4000) {
    // Texto longo: a expressão completa ficaria lenta, e hook que estoura o tempo não bloqueia.
    const suspeito = /\bgit\b/.test(texto) && /\b(reset|clean|push|branch|checkout|restore|switch|tag|stash|worktree|update-ref|filter-branch|reflog)\b/.test(texto)
    return suspeito ? MOTIVO : null
  }
  const perigoso = /\bgit\b[^\n;&|]*\b(reset\b[^\n;&|]*--ha|clean\b|push\b[^\n;&|]*(--(force|delete|mirror)|\s-f\b|\s\+|\s:)|branch\b[^\n;&|]*\s-[DMf]\b|checkout\b[^\n;&|]*(\s--(\s|$)|\s-f\b|\s\.(\s|$))|restore\b|switch\b[^\n;&|]*(\s-f\b|--discard)|tag\b[^\n;&|]*\s-[df]\b|stash\b[^\n;&|]*\b(drop|clear)\b|worktree\b[^\n;&|]*remove|filter-branch|update-ref|reflog\b[^\n;&|]*(expire|delete))/
  return perigoso.test(texto) ? MOTIVO : null
}

export function motivoDoBloqueio(comando, profundidade = 0) {
  // Aninhamento fundo demais para seguir: a busca no texto bruto decide.
  if (profundidade > MAX_PROFUNDIDADE) return avaliarTextoBruto(comando)
  let leitura
  leituraIncompleta = false
  try {
    leitura = lexar(comando)
  } catch {
    return avaliarTextoBruto(comando)
  }
  const incompleta = leituraIncompleta
  for (const palavras of leitura.comandos) {
    const motivo = avaliarComando(palavras, profundidade)
    if (motivo) return motivo
  }
  if (apagaPastaGitEmPedacos(leitura.comandos.map(semRedirecionamentos))) return MOTIVO_PASTA_GIT
  if (incompleta || leitura.comandos.some(shellLendoDeFora)) {
    const motivo = avaliarTextoBruto(comando)
    if (motivo) return motivo
  }
  for (const trecho of leitura.aninhados) {
    const motivo = motivoDoBloqueio(trecho, profundidade + 1)
    if (motivo) return motivo
  }
  return null
}

export function mensagemDeBloqueio(motivo) {
  return [
    `BLOQUEADO pela trava do DevFlow: ${motivo}.`,
    'O CLAUDE.md ("Segurança e Recuperação") exige aprovação explícita do Alex para este tipo de comando.',
    'Não procure outro caminho para contornar o bloqueio. Explique ao Alex o que você queria fazer e por quê.',
    'Se ele aprovar, ele mesmo roda o comando no terminal dele (a trava só vigia o que o Claude executa).',
    'Para desfazer um commit, use `git revert`. Para desfazer uma edição temporária sua num arquivo, guarde uma cópia antes e restaure a cópia.',
  ].join('\n')
}

// ---------- entrada e saída ----------

function bloquearOuLiberar(comando) {
  const motivo = motivoDoBloqueio(comando)
  if (!motivo) return 0
  console.error(mensagemDeBloqueio(motivo))
  return 2
}

function principal() {
  if (process.argv[2] === '--testar') {
    const codigo = bloquearOuLiberar(process.argv[3] ?? '')
    if (codigo === 0) console.log('liberado')
    process.exit(codigo)
  }
  let bruto = ''
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', (parte) => { bruto += parte })
  process.stdin.on('end', () => {
    let comando
    try {
      comando = JSON.parse(bruto)?.tool_input?.command
    } catch {
      // Entrada ilegível: melhor bloquear e avisar do que liberar sem olhar.
      console.error('BLOQUEADO pela trava do DevFlow: o evento chegou ilegível e o comando não pôde ser conferido. Avise o Alex.')
      process.exit(2)
    }
    process.exit(typeof comando === 'string' ? bloquearOuLiberar(comando) : 0)
  })
}

// realpath dos dois lados: por link simbólico, o caminho digitado difere do caminho
// real do arquivo, e a comparação simples deixaria a trava desligada sem aviso.
function chamadoDireto() {
  if (!process.argv[1]) return false
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return true
  }
}

if (chamadoDireto()) principal()
