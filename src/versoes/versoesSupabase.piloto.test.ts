import { expect, test } from 'vitest'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import { EnvioAoDriveFalso, LINHA, comSessoes, criar, recusa } from '../testes/versoesSupabaseDeTeste'
import type { PedidoDeAcrescimo, PedidoDeVersao } from './tipos'

const PEDIDO_PILOTO: PedidoDeVersao = {
  processoId: 'p1', numero: 6, piloto: true, arquivos: [{ papel: 'bpm', arquivo: new File(['bizagi'], 'piloto.bpm') }],
}

test('a versão piloto abre a sessão e registra com piloto verdadeiro e o número digitado', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  await criar(cliente).enviarVersao(PEDIDO_PILOTO, () => {})
  expect(cliente.chamadasDaFuncao).toEqual([
    { acao: 'iniciar_envio', processo_id: 'p1', papel: 'bpm', nome_original: 'piloto.bpm', tamanho: 6, numero: 6, historica: false, piloto: true },
    { acao: 'registrar', processo_id: 'p1', numero: 6, historica: false, piloto: true, arquivos: [{ papel: 'bpm', drive_id: 'id-sessao' }] },
  ])
})

test('a recusa do número da piloto chega com a frase e o mínimo', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  cliente.respostasDaFuncao['funcao.registrar'] = recusa('numero_da_piloto_nao_maior', '6')
  await expect(criar(cliente).enviarVersao(PEDIDO_PILOTO, () => {})).rejects.toThrow('O número da versão piloto precisa ser maior que 6.')
})

test('a versão piloto sai da lista com o campo piloto', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['versoes.select'] = { data: [{ ...LINHA, piloto: true }], error: null }
  const [versao] = await criar(cliente).listarVersoes('p1')
  expect(versao.piloto).toBe(true)
})

const PEDIDO_DE_ACRESCIMO: PedidoDeAcrescimo = {
  processoId: 'p1', versaoId: 'v3', numero: 3, piloto: true, papel: 'png', arquivo: new File(['png'], 'fluxo.png'),
}

test('acrescentar o .png abre a sessão com o número e o P da versão, envia, avisa o progresso e registra na versão', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const progresso: string[] = []
  await criar(cliente).acrescentarArquivo(PEDIDO_DE_ACRESCIMO, (enviados, total) => progresso.push(`${enviados}/${total}`))
  expect(cliente.chamadasDaFuncao).toEqual([
    { acao: 'iniciar_envio', processo_id: 'p1', papel: 'png', nome_original: 'fluxo.png', tamanho: 3, numero: 3, historica: false, piloto: true },
    {
      acao: 'registrar', processo_id: 'p1', numero: 3, historica: false, piloto: true, versao_id: 'v3',
      arquivos: [{ papel: 'png', drive_id: 'id-sessao' }],
    },
  ])
  expect(progresso).toEqual(['1/1'])
})

test('se o arquivo acrescentado não chega ao Drive, nada é registrado; a recusa do banco chega com a frase', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const envio = new EnvioAoDriveFalso()
  envio.falharEm = 'sessao'
  await expect(criar(cliente, envio).acrescentarArquivo(PEDIDO_DE_ACRESCIMO, () => {}))
    .rejects.toThrow('o arquivo fluxo.png não chegou ao Drive')
  expect(cliente.chamadasDaFuncao.map((corpo) => corpo.acao)).toEqual(['iniciar_envio'])
  const outro = new ClienteSupabaseFalso()
  comSessoes(outro)
  outro.respostasDaFuncao['funcao.registrar'] = recusa('arquivo_ja_existe')
  await expect(criar(outro).acrescentarArquivo(PEDIDO_DE_ACRESCIMO, () => {})).rejects.toThrow('A versão já tem esse arquivo.')
})

