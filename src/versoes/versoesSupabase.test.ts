import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import type { PedidoDeRelatorio, PedidoDeVersao } from './tipos'
import { criarVersoesSupabase, type EnviarBytes } from './versoesSupabase'

const LINHA = {
  id: 'v3', numero: 3, historica: false, enviada_em: '2026-10-15T13:00:00+00:00', observacao: 'Corrigido',
  autor: { nome: 'Ana Teste' }, etapa: { nome: 'Reunião de modelagem' },
  arquivos_da_versao: [
    { id: 'a1', papel: 'bpmn', nome: 'TSA_V3_Emitir Ofício.bpmn', formato: 'bpmn', tamanho: 10 },
    { id: 'a2', papel: 'png', nome: 'TSA_V3_Emitir Ofício.png', formato: 'png', tamanho: 20 },
    { id: 'a3', papel: 'bpm', nome: 'TSA_V3_Emitir Ofício.bpm', formato: 'bpm', tamanho: 30 },
  ],
}

/** Envio ao Google simulado: guarda os endereços e devolve o id do arquivo, ou falha no endereço pedido. */
class EnvioAoDriveFalso {
  enderecos: string[] = []
  falharEm: string | null = null
  enviar: EnviarBytes = (endereco) => {
    this.enderecos.push(endereco)
    if (endereco === this.falharEm) return Promise.resolve(new Response('erro', { status: 503 }))
    return Promise.resolve(new Response(JSON.stringify({ id: `id-${endereco}` }), { status: 200 }))
  }
}

function criar(cliente: ClienteSupabaseFalso, envio = new EnvioAoDriveFalso()) {
  return criarVersoesSupabase(cliente as unknown as SupabaseClient<Database>, envio.enviar)
}

const PEDIDO: PedidoDeVersao = {
  processoId: 'p1', numero: 3, observacao: 'Corrigido',
  arquivos: [{ papel: 'bpmn', arquivo: new File(['<x/>'], 'fluxo.bpmn') }, { papel: 'png', arquivo: new File(['png'], 'fluxo.png') }],
}

function comSessoes(cliente: ClienteSupabaseFalso) {
  // Cada iniciar_envio devolve o mesmo endereço no falso; a ordem das chamadas mostra a sequência.
  cliente.respostasDaFuncao['funcao.iniciar_envio'] = { data: { upload_url: 'sessao', nome: 'x' }, error: null }
  cliente.respostasDaFuncao['funcao.registrar'] = { data: { versao_id: 'v3' }, error: null }
}

function recusa(codigo: string, mensagem = '', status = 409) {
  return { data: null, error: { message: 'Edge Function returned a non-2xx status code', context: new Response(JSON.stringify({ codigo, mensagem }), { status }) } }
}

test('lista as versões do processo com autor, etapa e os arquivos na ordem de exibição (.png, .bpm, relatório, .bpmn)', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['versoes.select'] = { data: [LINHA], error: null }
  expect(await criar(cliente).listarVersoes('p1')).toEqual([{
    id: 'v3', numero: 3, historica: false, enviadaEm: '2026-10-15T13:00:00+00:00', autor: 'Ana Teste',
    etapa: 'Reunião de modelagem', observacao: 'Corrigido',
    arquivos: [
      { id: 'a2', papel: 'png', nome: 'TSA_V3_Emitir Ofício.png', formato: 'png', tamanho: 20 },
      { id: 'a3', papel: 'bpm', nome: 'TSA_V3_Emitir Ofício.bpm', formato: 'bpm', tamanho: 30 },
      { id: 'a1', papel: 'bpmn', nome: 'TSA_V3_Emitir Ofício.bpmn', formato: 'bpmn', tamanho: 10 },
    ],
  }])
  expect(cliente.pedidos[0]).toMatchObject({ tabela: 'versoes', filtro: ['processo_id', 'p1'], ordem: [['numero', false]] })
})

test('a versão com aprovação sai marcada como aprovada', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['versoes.select'] = { data: [{ ...LINHA, aprovacao: [{ id: 'ap1' }] }, { ...LINHA, id: 'v2', aprovacao: [] }], error: null }
  const [aprovada, outra] = await criar(cliente).listarVersoes('p1')
  expect(aprovada.aprovada).toBe(true)
  expect(outra.aprovada).toBeUndefined()
})

test('falha na leitura vira erro com o motivo', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['versoes.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).listarVersoes('p1')).rejects.toThrow('Falha ao ler as versões do processo p1: sem conexão')
})

test('envia cada arquivo pela sessão devolvida, avisa o progresso e só então registra com os ids do Drive', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const envio = new EnvioAoDriveFalso()
  const progresso: string[] = []
  await criar(cliente, envio).enviarVersao(PEDIDO, (enviados, total) => progresso.push(`${enviados}/${total}`))
  expect(cliente.chamadasDaFuncao).toEqual([
    { acao: 'iniciar_envio', processo_id: 'p1', papel: 'bpmn', nome_original: 'fluxo.bpmn', tamanho: 4, numero: 3, historica: false },
    { acao: 'iniciar_envio', processo_id: 'p1', papel: 'png', nome_original: 'fluxo.png', tamanho: 3, numero: 3, historica: false },
    {
      acao: 'registrar', processo_id: 'p1', numero: 3, observacao: 'Corrigido', historica: false,
      arquivos: [{ papel: 'bpmn', drive_id: 'id-sessao' }, { papel: 'png', drive_id: 'id-sessao' }],
    },
  ])
  expect(envio.enderecos).toEqual(['sessao', 'sessao'])
  expect(progresso).toEqual(['1/2', '2/2'])
})

const PEDIDO_HISTORICO: PedidoDeVersao = {
  processoId: 'p1', numero: 5, observacao: null, arquivos: [{ papel: 'bpm', arquivo: new File(['bizagi'], 'fonte.bpm') }],
}

test('a versão histórica abre a sessão e registra com historica verdadeiro e o número digitado', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const envio = new EnvioAoDriveFalso()
  const progresso: string[] = []
  await criar(cliente, envio).registrarVersaoHistorica(PEDIDO_HISTORICO, (enviados, total) => progresso.push(enviados + '/' + total))
  expect(cliente.chamadasDaFuncao).toEqual([
    { acao: 'iniciar_envio', processo_id: 'p1', papel: 'bpm', nome_original: 'fonte.bpm', tamanho: 6, numero: 5, historica: true },
    { acao: 'registrar', processo_id: 'p1', numero: 5, observacao: null, historica: true, arquivos: [{ papel: 'bpm', drive_id: 'id-sessao' }] },
  ])
  expect(progresso).toEqual(['1/1'])
})

test('se o arquivo da histórica não chega ao Drive, ela não é registrada', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const envio = new EnvioAoDriveFalso()
  envio.falharEm = 'sessao'
  await expect(criar(cliente, envio).registrarVersaoHistorica(PEDIDO_HISTORICO, () => {}))
    .rejects.toThrow('o arquivo fonte.bpm não chegou ao Drive')
  expect(cliente.chamadasDaFuncao.map((corpo) => corpo.acao)).toEqual(['iniciar_envio'])
})

test.each([
  ['numero_historico_repetido', '5', 'O processo já tem a versão histórica V5F. Use outro número.'],
  ['historica_depois_de_versao_nova', '', 'O processo já tem versão nova; versões históricas só podem ser registradas antes dela.'],
])('a recusa %s do banco no registro da histórica vira a frase da tela', async (codigo, valor, frase) => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  cliente.respostasDaFuncao['funcao.registrar'] = recusa(codigo, valor)
  const falha = await criar(cliente).registrarVersaoHistorica(PEDIDO_HISTORICO, () => {}).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe(frase)
})

test('se um arquivo não chega ao Drive, a versão não é registrada', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const envio = new EnvioAoDriveFalso()
  envio.falharEm = 'sessao'
  await expect(criar(cliente, envio).enviarVersao(PEDIDO, () => {})).rejects.toThrow('o arquivo fluxo.bpmn não chegou ao Drive')
  expect(cliente.chamadasDaFuncao.map((corpo) => corpo.acao)).toEqual(['iniciar_envio'])
})

test('a recusa da função ao abrir a sessão vira a frase da tela', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostasDaFuncao['funcao.iniciar_envio'] = recusa('sem_espaco_no_drive', 'Não há espaço no Drive.', 507)
  const falha = await criar(cliente).enviarVersao(PEDIDO, () => {}).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('Não há espaço no Drive. Avise o administrador.')
})

test('a recusa do banco no registro vira a frase da tela, com o valor', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  cliente.respostasDaFuncao['funcao.registrar'] = recusa('numero_da_versao_mudou', '4')
  await expect(criar(cliente).enviarVersao(PEDIDO, () => {}))
    .rejects.toThrow('Outra pessoa enviou uma versão enquanto você enviava; esta seria a V4. Envie de novo.')
})

test('falha sem resposta da função (sem conexão) vira erro com o motivo', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostasDaFuncao['funcao.iniciar_envio'] = { data: null, error: { message: 'Failed to send a request to the Edge Function' } }
  await expect(criar(cliente).enviarVersao(PEDIDO, () => {})).rejects.toThrow('não foi possível falar com o servidor (sem conexão?)')
})

const ARQUIVO_PNG = { id: 'a2', papel: 'png', nome: 'TSA_V3_Emitir Ofício.png', formato: 'png', tamanho: 4 } as const

test('baixa o arquivo pela função e devolve os bytes intactos, com o tipo do formato', async () => {
  const cliente = new ClienteSupabaseFalso()
  const bytes = new Uint8Array([0x89, 0x50, 0xff, 0x00])
  cliente.respostasDaFuncao['funcao.baixar'] = { data: new Blob([bytes], { type: 'application/octet-stream' }), error: null }
  const arquivo = await criar(cliente).baixarArquivo(ARQUIVO_PNG)
  expect(cliente.chamadasDaFuncao).toEqual([{ acao: 'baixar', arquivo_id: 'a2' }])
  expect(arquivo.type).toBe('image/png')
  expect(new Uint8Array(await arquivo.arrayBuffer())).toEqual(bytes)
})

test('a recusa da função no download vira a frase do download', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostasDaFuncao['funcao.baixar'] = recusa('nao_encontrado_no_drive', 'Arquivo não encontrado no Drive.', 404)
  const falha = await criar(cliente).baixarArquivo(ARQUIVO_PNG).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('O arquivo não foi encontrado no Drive. Avise o administrador.')
})

test('download sem resposta da função (sem conexão) vira erro com o motivo', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostasDaFuncao['funcao.baixar'] = { data: null, error: { message: 'Failed to send a request to the Edge Function' } }
  await expect(criar(cliente).baixarArquivo(ARQUIVO_PNG)).rejects.toThrow('não foi possível falar com o servidor (sem conexão?)')
})

test('resposta que não são bytes (texto) vira erro com o recebido e o esperado', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostasDaFuncao['funcao.baixar'] = { data: 'texto', error: null }
  await expect(criar(cliente).baixarArquivo(ARQUIVO_PNG))
    .rejects.toThrow('a função devolveu string; esperado: os bytes do arquivo (Blob)')
})

test('o relatório copiado vem da lista com o id do arquivo de origem', async () => {
  const cliente = new ClienteSupabaseFalso()
  const copia = { id: 'a9', papel: 'relatorio', nome: 'TSA_V3_Emitir Ofício_Relatório.pdf', formato: 'pdf', tamanho: 5, copiado_de: 'a4' }
  cliente.respostas['versoes.select'] = { data: [{ ...LINHA, arquivos_da_versao: [copia] }], error: null }
  const [versao] = await criar(cliente).listarVersoes('p1')
  expect(versao.arquivos).toEqual([
    { id: 'a9', papel: 'relatorio', nome: 'TSA_V3_Emitir Ofício_Relatório.pdf', formato: 'pdf', tamanho: 5, copiadoDe: 'a4' },
  ])
})

const PEDIDO_DE_RELATORIO: PedidoDeRelatorio = { processoId: 'p1', versaoId: 'v3', numero: 3, arquivo: new File(['pdf'], 'relatorio.pdf') }

test('o relatório depois abre a sessão com o número da versão, envia, avisa o progresso e registra na versão', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const envio = new EnvioAoDriveFalso()
  const progresso: string[] = []
  await criar(cliente, envio).acrescentarRelatorio(PEDIDO_DE_RELATORIO, (enviados, total) => progresso.push(`${enviados}/${total}`))
  expect(cliente.chamadasDaFuncao).toEqual([
    { acao: 'iniciar_envio', processo_id: 'p1', papel: 'relatorio', nome_original: 'relatorio.pdf', tamanho: 3, numero: 3, historica: false },
    {
      acao: 'registrar', processo_id: 'p1', numero: 3, observacao: null, historica: false, versao_id: 'v3',
      arquivos: [{ papel: 'relatorio', drive_id: 'id-sessao' }],
    },
  ])
  expect(progresso).toEqual(['1/1'])
})

test('se o relatório não chega ao Drive, nada é registrado', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const envio = new EnvioAoDriveFalso()
  envio.falharEm = 'sessao'
  await expect(criar(cliente, envio).acrescentarRelatorio(PEDIDO_DE_RELATORIO, () => {}))
    .rejects.toThrow('o arquivo relatorio.pdf não chegou ao Drive')
  expect(cliente.chamadasDaFuncao.map((corpo) => corpo.acao)).toEqual(['iniciar_envio'])
})

test.each([
  ['relatorio_ja_existe', '', 'Esta versão já tem relatório.'],
  ['versao_historica_somente_leitura', '', 'A versão histórica é somente leitura: não recebe arquivos.'],
])('a recusa %s do banco no relatório depois vira a frase da tela', async (codigo, valor, frase) => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  cliente.respostasDaFuncao['funcao.registrar'] = recusa(codigo, valor)
  const falha = await criar(cliente).acrescentarRelatorio(PEDIDO_DE_RELATORIO, () => {}).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe(frase)
})

test('"sem alteração" chama a ação da função com o processo e a versão', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostasDaFuncao['funcao.sem_alteracao'] = { data: { arquivo_id: 'a9' }, error: null }
  await criar(cliente).semAlteracaoDeConteudo('p1', 'v3')
  expect(cliente.chamadasDaFuncao).toEqual([{ acao: 'sem_alteracao', processo_id: 'p1', versao_id: 'v3' }])
})

test.each([
  ['versao_anterior_sem_relatorio', 'A versão anterior não tem relatório para copiar. Envie o relatório.'],
  ['processo_fora_de_andamento', 'O processo não está em andamento; não é possível enviar versão.'],
])('a recusa %s no "sem alteração" vira a frase da tela', async (codigo, frase) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostasDaFuncao['funcao.sem_alteracao'] = recusa(codigo)
  const falha = await criar(cliente).semAlteracaoDeConteudo('p1', 'v3').catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe(frase)
})

test('"sem alteração" sem resposta da função (sem conexão) vira erro com o motivo', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostasDaFuncao['funcao.sem_alteracao'] = { data: null, error: { message: 'Failed to send a request' } }
  await expect(criar(cliente).semAlteracaoDeConteudo('p1', 'v3')).rejects.toThrow('sem conexão')
})

const ARQUIVO_A_TROCAR = { id: 'a3', papel: 'relatorio' as const, nome: 'TSA_V3_Emitir Ofício_Relatório.pdf', formato: 'pdf', tamanho: 5 }
const PEDIDO_DE_SUBSTITUICAO = { processoId: 'p1', numero: 3, arquivo: ARQUIVO_A_TROCAR, novo: new File(['novo'], 'outro.pdf') }

test('a substituição abre a sessão do arquivo, envia, avisa o progresso e registra no mesmo arquivo', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const envio = new EnvioAoDriveFalso()
  const progresso: string[] = []
  await criar(cliente, envio).substituirArquivo(PEDIDO_DE_SUBSTITUICAO, (enviados, total) => progresso.push(`${enviados}/${total}`))
  expect(cliente.chamadasDaFuncao).toEqual([
    {
      acao: 'iniciar_envio', processo_id: 'p1', papel: 'relatorio', nome_original: 'outro.pdf', tamanho: 4, numero: 3, historica: false,
      arquivo_id: 'a3',
    },
    {
      acao: 'registrar', processo_id: 'p1', numero: 3, observacao: null, historica: false, arquivo_id: 'a3',
      arquivos: [{ papel: 'relatorio', drive_id: 'id-sessao' }],
    },
  ])
  expect(envio.enderecos).toEqual(['sessao'])
  expect(progresso).toEqual(['1/1'])
})

test('se o arquivo novo não chega ao Drive, a troca não é registrada', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const envio = new EnvioAoDriveFalso()
  envio.falharEm = 'sessao'
  await expect(criar(cliente, envio).substituirArquivo(PEDIDO_DE_SUBSTITUICAO, () => {}))
    .rejects.toThrow('o arquivo outro.pdf não chegou ao Drive')
  expect(cliente.chamadasDaFuncao.map((corpo) => corpo.acao)).toEqual(['iniciar_envio'])
})

test.each([
  ['tipo_de_arquivo_diferente', 'pdf', 'O arquivo novo precisa ser do mesmo tipo do que sai.'],
  ['versao_historica_somente_leitura', '', 'A versão histórica é somente leitura: não recebe arquivos.'],
  ['processo_fora_de_andamento', 'suspenso', 'O processo não está em andamento; não é possível enviar versão.'],
])('a recusa %s na substituição vira a frase da tela', async (codigo, valor, frase) => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  cliente.respostasDaFuncao['funcao.iniciar_envio'] = recusa(codigo, valor)
  const falha = await criar(cliente).substituirArquivo(PEDIDO_DE_SUBSTITUICAO, () => {}).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe(frase)
})

test('a conferência pergunta à função pelo processo e devolve a situação de cada arquivo', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostasDaFuncao['funcao.conferir'] = { data: { arquivos: { a1: 'ok', a2: 'alterado' } }, error: null }
  expect(await criar(cliente).conferirArquivos('p1')).toEqual({ a1: 'ok', a2: 'alterado' })
  expect(cliente.chamadasDaFuncao).toEqual([{ acao: 'conferir', processo_id: 'p1' }])
})

test('a falha da função na conferência vira rejeição', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostasDaFuncao['funcao.conferir'] = recusa('drive_indisponivel', '', 502)
  await expect(criar(cliente).conferirArquivos('p1')).rejects.toBeInstanceOf(Error)
})
