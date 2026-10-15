import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import type { PedidoDeVersao } from './tipos'
import { criarVersoesSupabase, type EnviarBytes } from './versoesSupabase'

const LINHA = {
  id: 'v3', numero: 3, historica: false, enviada_em: '2026-10-15T13:00:00+00:00', observacao: 'Corrigido',
  autor: { nome: 'Ana Teste' }, etapa: { nome: 'Reunião de modelagem' },
  arquivos_da_versao: [
    { id: 'a2', papel: 'png', nome: 'TSA_V3_Emitir Ofício.png', formato: 'png', tamanho: 20 },
    { id: 'a1', papel: 'bpmn', nome: 'TSA_V3_Emitir Ofício.bpmn', formato: 'bpmn', tamanho: 10 },
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

test('lista as versões do processo com autor, etapa e os arquivos na ordem dos papéis', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['versoes.select'] = { data: [LINHA], error: null }
  expect(await criar(cliente).listarVersoes('p1')).toEqual([{
    id: 'v3', numero: 3, historica: false, enviadaEm: '2026-10-15T13:00:00+00:00', autor: 'Ana Teste',
    etapa: 'Reunião de modelagem', observacao: 'Corrigido',
    arquivos: [
      { id: 'a1', papel: 'bpmn', nome: 'TSA_V3_Emitir Ofício.bpmn', formato: 'bpmn', tamanho: 10 },
      { id: 'a2', papel: 'png', nome: 'TSA_V3_Emitir Ofício.png', formato: 'png', tamanho: 20 },
    ],
  }])
  expect(cliente.pedidos[0]).toMatchObject({ tabela: 'versoes', filtro: ['processo_id', 'p1'], ordem: [['numero', false]] })
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
      acao: 'registrar', processo_id: 'p1', numero: 3, observacao: 'Corrigido',
      arquivos: [{ papel: 'bpmn', drive_id: 'id-sessao' }, { papel: 'png', drive_id: 'id-sessao' }],
    },
  ])
  expect(envio.enderecos).toEqual(['sessao', 'sessao'])
  expect(progresso).toEqual(['1/2', '2/2'])
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
