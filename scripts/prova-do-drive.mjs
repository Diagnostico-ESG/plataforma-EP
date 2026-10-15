// Prova de ponta a ponta da função arquivos-no-drive (documentos-versoes, ticket 01), rodada pelo usuário
// no terminal dele, contra o projeto de DESENVOLVIMENTO. Pede e-mail e senha dos usuários inventados na hora,
// não grava nem imprime nenhum dos dois, nem token, nem endereço da sessão de envio. Imprime só OK/FALHOU e códigos.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'

const PROJETO_DEV = 'yclkzyoebpsxmgpbcbus'
const ORIGEM = 'http://localhost:5173'
// BPMN inventado, mínimo, só para a prova.
const CONTEUDO = new TextEncoder().encode(
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" id="prova"><process id="p"/></definitions>\n',
)

function lerEnvLocal() {
  const linhas = readFileSync('.env.local', 'utf8').split(/\r?\n/)
  const valores = Object.fromEntries(linhas.filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
  const url = valores.VITE_SUPABASE_URL
  const chave = valores.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !chave) throw new Error('VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY ausente no .env.local')
  if (!url.includes(PROJETO_DEV)) throw new Error(`o .env.local não aponta para o desenvolvimento (${PROJETO_DEV}); prova interrompida`)
  return { url, chave }
}

function relatar(passo, ok, detalhe) {
  console.log(`${ok ? 'OK     ' : 'FALHOU '} ${passo}${detalhe ? ` (${detalhe})` : ''}`)
}

async function entrar(config, leitor, rotulo) {
  const email = await leitor.question(`E-mail do usuário inventado ${rotulo}: `)
  const senha = await leitor.question(`Senha do usuário inventado ${rotulo}: `)
  console.clear()
  const cliente = createClient(config.url, config.chave, { auth: { persistSession: false } })
  const { data, error } = await cliente.auth.signInWithPassword({ email: email.trim(), password: senha })
  if (error) throw new Error(`entrada do ${rotulo} recusada (${error.status ?? 'sem status'})`)
  return { cliente, token: data.session.access_token }
}

async function chamarFuncao(config, token, corpo) {
  const headers = { apikey: config.chave, 'Content-Type': 'application/json', Origin: ORIGEM }
  if (token) headers.Authorization = `Bearer ${token}`
  return await fetch(`${config.url}/functions/v1/arquivos-no-drive`, { method: 'POST', headers, body: JSON.stringify(corpo) })
}

async function codigoDe(resposta) {
  const corpo = await resposta.json().catch(() => ({}))
  return `${resposta.status} ${corpo.codigo ?? ''}`.trim()
}

async function escolherProcesso(cliente) {
  const { data, error } = await cliente.from('processos_com_andamento').select('id').eq('situacao', 'em_andamento').limit(1)
  if (error || data.length === 0) throw new Error('nenhum processo em andamento visível no desenvolvimento')
  return data[0].id
}

function pedidoDeEnvio(processoId) {
  return { acao: 'iniciar_envio', processo_id: processoId, papel: 'bpmn', nome_original: 'prova.bpmn', tamanho: CONTEUDO.length, numero: 99, historica: false }
}

async function enviarComoIntegrante(config, integrante) {
  const processoId = await escolherProcesso(integrante.cliente)
  const sessao = await chamarFuncao(config, integrante.token, pedidoDeEnvio(processoId))
  if (sessao.status !== 200) return relatar('integrante abre a sessão de envio', false, await codigoDe(sessao))
  const { upload_url: endereco, nome } = await sessao.json()
  relatar('integrante abre a sessão de envio', true, nome)
  const envio = await fetch(endereco, { method: 'PUT', headers: { 'Content-Type': 'application/xml', Origin: ORIGEM }, body: CONTEUDO })
  if (!envio.ok) return relatar('bytes enviados direto ao Drive', false, String(envio.status))
  const arquivo = await envio.json()
  relatar('bytes enviados direto ao Drive', true, `tamanho ${arquivo.size}, md5 ${arquivo.md5Checksum ? 'informado' : 'ausente'}`)
  return { processoId, driveId: arquivo.id }
}

async function conferirDownload(config, token, driveId, passo) {
  const resposta = await chamarFuncao(config, token, { acao: 'baixar', drive_id: driveId })
  if (resposta.status !== 200) return relatar(passo, false, await codigoDe(resposta))
  const bytes = new Uint8Array(await resposta.arrayBuffer())
  const iguais = bytes.length === CONTEUDO.length && bytes.every((byte, i) => byte === CONTEUDO[i])
  relatar(passo, iguais, iguais ? 'bytes iguais aos enviados' : 'bytes diferentes')
}

async function esperarRecusa(resposta, passo, esperado) {
  const codigo = await codigoDe(resposta)
  relatar(passo, codigo === esperado, codigo)
}

async function provar() {
  const config = lerEnvLocal()
  const leitor = createInterface({ input: stdin, output: stdout })
  const integrante = await entrar(config, leitor, 'Integrante')
  const enviado = await enviarComoIntegrante(config, integrante)
  if (!enviado) return leitor.close()
  await conferirDownload(config, integrante.token, enviado.driveId, 'integrante baixa o arquivo de volta')
  const consulta = await entrar(config, leitor, 'Consulta')
  leitor.close()
  await esperarRecusa(await chamarFuncao(config, consulta.token, pedidoDeEnvio(enviado.processoId)), 'consulta é recusada no envio', '403 sem_permissao')
  await conferirDownload(config, consulta.token, enviado.driveId, 'consulta baixa o arquivo')
  await esperarRecusa(await chamarFuncao(config, null, { acao: 'baixar', drive_id: enviado.driveId }), 'sem login é recusado', '401 sem_login')
}

provar().catch((erro) => {
  console.log(`FALHOU  prova interrompida: ${erro.message}`)
  process.exitCode = 1
})
