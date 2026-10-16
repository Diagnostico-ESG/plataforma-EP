// Prova de ponta a ponta da função arquivos-no-drive (documentos-versoes, tickets 01 e 02), rodada pelo usuário
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

// PNG inventado de 1x1 pixel, só para a prova (o par .bpmn e .png é obrigatório na versão).
const PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='),
  (letra) => letra.charCodeAt(0),
)

const ARQUIVO_INEXISTENTE = '00000000-0000-0000-0000-00000000dead'

function pedidoDeEnvio(processoId, numero = 1, papel = 'bpmn', bytes = CONTEUDO, historica = false, extensao = papel) {
  return { acao: 'iniciar_envio', processo_id: processoId, papel, nome_original: `prova.${extensao}`, tamanho: bytes.length, numero, historica }
}

// O número que a versão vai receber: o maior do processo + 1, como a tela calcula na prévia.
async function proximoNumero(cliente, processoId) {
  const { data, error } = await cliente.from('versoes').select('numero').eq('processo_id', processoId)
  if (error) throw new Error('leitura das versões falhou')
  return Math.max(0, ...data.map((versao) => versao.numero)) + 1
}

async function enviarUmArquivo(config, token, pedido, bytes, tipo) {
  const sessao = await chamarFuncao(config, token, pedido)
  if (sessao.status !== 200) return relatar(`sessão de envio do .${pedido.papel}`, false, await codigoDe(sessao))
  const { upload_url: endereco, nome } = await sessao.json()
  relatar(`sessão de envio do .${pedido.papel}`, true, nome)
  const envio = await fetch(endereco, { method: 'PUT', headers: { 'Content-Type': tipo, Origin: ORIGEM }, body: bytes })
  if (!envio.ok) return relatar(`bytes do .${pedido.papel} enviados direto ao Drive`, false, String(envio.status))
  const arquivo = await envio.json()
  relatar(`bytes do .${pedido.papel} enviados direto ao Drive`, true, `tamanho ${arquivo.size}, md5 ${arquivo.md5Checksum ? 'informado' : 'ausente'}`)
  return arquivo.id
}

async function registrarVersao(config, integrante, processoId, numero, ids) {
  const corpo = {
    acao: 'registrar', processo_id: processoId, numero, observacao: 'Prova de ponta a ponta',
    arquivos: [{ papel: 'bpmn', drive_id: ids[0] }, { papel: 'png', drive_id: ids[1] }],
  }
  const resposta = await chamarFuncao(config, integrante.token, corpo)
  if (resposta.status !== 200) return relatar('integrante registra a versão', false, await codigoDe(resposta))
  const { data } = await integrante.cliente.from('versoes').select('numero').eq('processo_id', processoId).eq('numero', numero)
  relatar('integrante registra a versão', data?.length === 1, `V${numero}`)
}

// O download pede o id do arquivo da versão (a linha que a RLS mostra), não o do Drive.
async function arquivoDoDrive(cliente, driveId) {
  const { data } = await cliente.from('arquivos_da_versao').select('id').eq('drive_id', driveId).maybeSingle()
  return data?.id ?? null
}

async function enviarComoIntegrante(config, integrante) {
  const processoId = await escolherProcesso(integrante.cliente)
  const numero = await proximoNumero(integrante.cliente, processoId)
  const bpmn = await enviarUmArquivo(config, integrante.token, pedidoDeEnvio(processoId, numero), CONTEUDO, 'application/xml')
  if (!bpmn) return null
  const png = await enviarUmArquivo(config, integrante.token, pedidoDeEnvio(processoId, numero, 'png', PNG), PNG, 'image/png')
  if (!png) return null
  await registrarVersao(config, integrante, processoId, numero, [bpmn, png])
  const arquivoId = await arquivoDoDrive(integrante.cliente, bpmn)
  if (!arquivoId) return relatar('arquivo registrado visível ao integrante', false, 'sem linha em arquivos_da_versao')
  return { processoId, arquivoId, numero }
}

// Só o processo em andamento sem versão nova aceita versão histórica (regra do banco).
async function escolherProcessoSemVersaoNova(cliente) {
  const { data: novas } = await cliente.from('versoes').select('processo_id').eq('historica', false)
  const { data } = await cliente.from('processos_com_andamento').select('id').eq('situacao', 'em_andamento')
  const comNova = new Set((novas ?? []).map((versao) => versao.processo_id))
  return (data ?? []).find((processo) => !comNova.has(processo.id))?.id ?? null
}

// A V{n}F só com o .bpm (basta o .bpm, história 16): o nome volta com o F e a versão aparece com historica verdadeiro.
async function registrarHistorica(config, integrante) {
  const processoId = await escolherProcessoSemVersaoNova(integrante.cliente)
  if (!processoId) return relatar('integrante registra a versão histórica', true, 'passo pulado: todo processo em andamento já tem versão nova')
  const numero = await proximoNumero(integrante.cliente, processoId)
  const bpm = await enviarUmArquivo(config, integrante.token, pedidoDeEnvio(processoId, numero, 'bpm', CONTEUDO, true), CONTEUDO, 'application/octet-stream')
  if (!bpm) return null
  const corpo = { acao: 'registrar', processo_id: processoId, numero, historica: true, observacao: null, arquivos: [{ papel: 'bpm', drive_id: bpm }] }
  const resposta = await chamarFuncao(config, integrante.token, corpo)
  if (resposta.status !== 200) return relatar('integrante registra a versão histórica', false, await codigoDe(resposta))
  const { data } = await integrante.cliente.from('versoes').select('numero').eq('processo_id', processoId).eq('numero', numero).eq('historica', true)
  relatar('integrante registra a versão histórica', data?.length === 1, `V${numero}F`)
}

async function versaoDoProcesso(cliente, processoId, numero) {
  const { data } = await cliente.from('versoes').select('id').eq('processo_id', processoId).eq('numero', numero).maybeSingle()
  return data?.id ?? null
}

// A versão seguinte, sem relatório, copia o da anterior pela ação sem_alteracao: o arquivo novo fica ligado ao original.
async function provarSemAlteracao(config, integrante, processoId) {
  const numero = await proximoNumero(integrante.cliente, processoId)
  const bpmn = await enviarUmArquivo(config, integrante.token, pedidoDeEnvio(processoId, numero), CONTEUDO, 'application/xml')
  const png = await enviarUmArquivo(config, integrante.token, pedidoDeEnvio(processoId, numero, 'png', PNG), PNG, 'image/png')
  if (!bpmn || !png) return
  await registrarVersao(config, integrante, processoId, numero, [bpmn, png])
  const versaoId = await versaoDoProcesso(integrante.cliente, processoId, numero)
  const resposta = await chamarFuncao(config, integrante.token, { acao: 'sem_alteracao', processo_id: processoId, versao_id: versaoId })
  if (resposta.status !== 200) return relatar('integrante marca sem alteração de conteúdo', false, await codigoDe(resposta))
  const { data } = await integrante.cliente.from('arquivos_da_versao').select('copiado_de').eq('versao_id', versaoId).eq('papel', 'relatorio').maybeSingle()
  relatar('integrante marca sem alteração de conteúdo', Boolean(data?.copiado_de), `V${numero} copiou o relatório da V${numero - 1}`)
}

// O relatório que ficou pendente entra depois (registrar com versao_id); só então a próxima versão pode copiá-lo.
async function provarRelatorioDepois(config, integrante, { processoId, numero }) {
  const versaoId = await versaoDoProcesso(integrante.cliente, processoId, numero)
  const pedido = pedidoDeEnvio(processoId, numero, 'relatorio', CONTEUDO, false, 'pdf')
  const relatorio = await enviarUmArquivo(config, integrante.token, pedido, CONTEUDO, 'application/pdf')
  if (!relatorio) return
  const corpo = { acao: 'registrar', processo_id: processoId, numero, versao_id: versaoId, historica: false, observacao: null, arquivos: [{ papel: 'relatorio', drive_id: relatorio }] }
  const resposta = await chamarFuncao(config, integrante.token, corpo)
  if (resposta.status !== 200) return relatar('integrante acrescenta o relatório depois', false, await codigoDe(resposta))
  relatar('integrante acrescenta o relatório depois', true, `V${numero}`)
  await provarSemAlteracao(config, integrante, processoId)
}

async function conferirDownload(config, token, arquivoId, passo) {
  const resposta = await chamarFuncao(config, token, { acao: 'baixar', arquivo_id: arquivoId })
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
  await conferirDownload(config, integrante.token, enviado.arquivoId, 'integrante baixa o arquivo de volta')
  await registrarHistorica(config, integrante)
  await provarRelatorioDepois(config, integrante, enviado)
  const consulta = await entrar(config, leitor, 'Consulta')
  leitor.close()
  await esperarRecusa(await chamarFuncao(config, consulta.token, pedidoDeEnvio(enviado.processoId)), 'consulta é recusada no envio', '403 sem_permissao')
  await conferirDownload(config, consulta.token, enviado.arquivoId, 'consulta baixa o arquivo enviado pelo integrante')
  await esperarRecusa(await chamarFuncao(config, consulta.token, { acao: 'baixar', arquivo_id: ARQUIVO_INEXISTENTE }), 'arquivo que não existe é recusado', '403 sem_permissao')
  await esperarRecusa(await chamarFuncao(config, null, { acao: 'baixar', arquivo_id: enviado.arquivoId }), 'sem login é recusado', '401 sem_login')
}

provar().catch((erro) => {
  console.log(`FALHOU  prova interrompida: ${erro.message}`)
  process.exitCode = 1
})
