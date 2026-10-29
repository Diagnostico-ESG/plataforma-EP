import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import { EnvioAoDriveFalso, comSessoes, criar, recusa } from '../testes/versoesSupabaseDeTeste'
import type { PedidoDePdfDaAprovacao, PedidoDeSubstituicao } from './tipos'

// O .pdf protocolado da aprovação no módulo real de versões (revisoes-aprovacao, ticket 06).

const PEDIDO: PedidoDePdfDaAprovacao = { processoId: 'p1', numero: 8, arquivo: new File(['pdf'], 'protocolo.pdf') }

test('envia o .pdf pela sessão, avisa o progresso e só então registra com o id do Drive', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const envio = new EnvioAoDriveFalso()
  const progresso: string[] = []
  await criar(cliente, envio).enviarPdfDaAprovacao(PEDIDO, (enviados, total) => progresso.push(`${enviados}/${total}`))
  expect(cliente.chamadasDaFuncao).toEqual([
    { acao: 'iniciar_envio', processo_id: 'p1', papel: 'pdf_da_aprovacao', nome_original: 'protocolo.pdf', tamanho: 3, numero: 8, historica: false, piloto: false },
    { acao: 'registrar', processo_id: 'p1', numero: 8, historica: false, piloto: false, arquivos: [{ papel: 'pdf_da_aprovacao', drive_id: 'id-sessao' }] },
  ])
  expect(envio.enderecos).toEqual(['sessao'])
  expect(progresso).toEqual(['1/1'])
})

test('o que o pedido manda fazer antes de registrar roda depois de o .pdf chegar ao Drive e antes do registro', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const ordem: string[] = []
  const envio = new EnvioAoDriveFalso()
  const aoEnviar = envio.enviar
  envio.enviar = (endereco, arquivo) => {
    ordem.push('bytes')
    return aoEnviar(endereco, arquivo)
  }
  const antesDeRegistrar = () => {
    ordem.push(`antes (chamadas: ${cliente.chamadasDaFuncao.length})`)
    return Promise.resolve()
  }
  await criar(cliente, envio).enviarPdfDaAprovacao({ ...PEDIDO, antesDeRegistrar }, () => {})
  expect(ordem).toEqual(['bytes', 'antes (chamadas: 1)'])
  expect(cliente.chamadasDaFuncao.map((corpo) => corpo.acao)).toEqual(['iniciar_envio', 'registrar'])
})

test('se o .pdf não chega ao Drive, nada roda depois: nem o que o pedido mandava fazer, nem o registro', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const envio = new EnvioAoDriveFalso()
  envio.falharEm = 'sessao'
  let rodou = false
  const pedido = { ...PEDIDO, antesDeRegistrar: () => { rodou = true; return Promise.resolve() } }
  await expect(criar(cliente, envio).enviarPdfDaAprovacao(pedido, () => {})).rejects.toThrow('o arquivo protocolo.pdf não chegou ao Drive')
  expect(rodou).toBe(false)
  expect(cliente.chamadasDaFuncao.map((corpo) => corpo.acao)).toEqual(['iniciar_envio'])
})

test('se o que o pedido mandava fazer antes falha, o .pdf não é registrado', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const pedido = { ...PEDIDO, antesDeRegistrar: () => Promise.reject(new TravaDoBanco('recusa da aprovação')) }
  await expect(criar(cliente).enviarPdfDaAprovacao(pedido, () => {})).rejects.toThrow('recusa da aprovação')
  expect(cliente.chamadasDaFuncao.map((corpo) => corpo.acao)).toEqual(['iniciar_envio'])
})

test.each([
  ['sem_aprovacao_para_o_pdf', '', 'Registre a aprovação antes de enviar o .pdf.'],
  ['pdf_ja_enviado', '', 'A aprovação já tem um .pdf; use Substituir.'],
  ['pdf_nome_sem_versao', 'a.pdf', 'O nome do .pdf não tem a versão aprovada. Envie de novo.'],
  ['processo_parado', 'suspenso', 'Este processo está suspenso; retome-o para mudar a etapa, a etiqueta ou o responsável.'],
])('a recusa %s do registro do .pdf vira a frase pronta', async (codigo, valor, frase) => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  cliente.respostasDaFuncao['funcao.registrar'] = recusa(codigo, valor)
  const falha = await criar(cliente).enviarPdfDaAprovacao(PEDIDO, () => {}).catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe(frase)
})

test('substituir o .pdf manda o papel do .pdf e o id dele, e o registro leva o arquivo_id', async () => {
  const cliente = new ClienteSupabaseFalso()
  comSessoes(cliente)
  const pedido: PedidoDeSubstituicao = {
    processoId: 'p1', numero: 8, novo: new File(['novo'], 'outro.pdf'),
    arquivo: { id: 'pdf2', papel: 'pdf_da_aprovacao', nome: 'TSA_V8_Emitir_Aprovação.pdf', formato: 'pdf', tamanho: 99 },
  }
  await criar(cliente).substituirArquivo(pedido, () => {})
  expect(cliente.chamadasDaFuncao).toEqual([
    { acao: 'iniciar_envio', processo_id: 'p1', papel: 'pdf_da_aprovacao', nome_original: 'outro.pdf', tamanho: 4, numero: 8, historica: false, piloto: false, arquivo_id: 'pdf2' },
    { acao: 'registrar', processo_id: 'p1', numero: 8, historica: false, piloto: false, arquivo_id: 'pdf2', arquivos: [{ papel: 'pdf_da_aprovacao', drive_id: 'id-sessao' }] },
  ])
})
