import { expect, test } from 'vitest'
import type { EventoDoCadastro } from '../cadastros/tipos'
import type { PedidoDeAcrescimo, PedidoDeVersao } from './tipos'
import { VersoesFalso } from './VersoesFalso'

const PEDIDO: PedidoDeVersao = {
  processoId: 'p1', numero: 1,
  arquivos: [{ papel: 'bpm', arquivo: new File(['x'], 'a.bpm') }, { papel: 'png', arquivo: new File(['y'], 'a.png') }],
}

const HISTORICA: PedidoDeVersao = {
  processoId: 'p1', numero: 5, arquivos: [{ papel: 'bpm', arquivo: new File(['z'], 'fonte.bpm') }],
}

function falso(): VersoesFalso {
  const versoes = new VersoesFalso()
  versoes.processos.p1 = { sigla: 'TSA', nome: 'Emitir Ofício', etapa: 'Reunião de modelagem' }
  return versoes
}

const PILOTO = (numero: number): PedidoDeVersao => ({
  processoId: 'p1', numero, piloto: true, arquivos: [{ papel: 'bpm', arquivo: new File(['p'], 'piloto.bpm') }],
})

test('a piloto guarda o número digitado, com o P nos nomes, e gera o evento próprio; a em sequência continua depois dela', async () => {
  const versoes = falso()
  const eventos: EventoDoCadastro[] = []
  versoes.aoRegistrar = (_processoId, evento) => eventos.push(evento)
  await versoes.registrarVersaoHistorica(HISTORICA, () => {})
  await versoes.enviarVersao(PILOTO(6), () => {})
  await versoes.enviarVersao(PILOTO(7), () => {})
  await versoes.enviarVersao({ ...PEDIDO, numero: 8 }, () => {})
  const lidas = await versoes.listarVersoes('p1')
  expect(lidas.map((versao) => [versao.numero, versao.historica, versao.piloto])).toEqual([
    [8, false, false], [7, false, true], [6, false, true], [5, true, false],
  ])
  expect(lidas[2].arquivos[0].nome).toBe('TSA_V6P_Emitir Ofício.bpm')
  expect(eventos.map((evento) => [evento.acao, evento.depois && (evento.depois as { rotulo: string }).rotulo])).toEqual([
    ['registrar_historica', 'V5F'], ['enviar_piloto', 'V6P'], ['enviar_piloto', 'V7P'], ['enviar', 'V8'],
  ])
})

test('a piloto sem versão começa de qualquer número; recusa número que não é maior e piloto depois da em sequência', async () => {
  const versoes = falso()
  await versoes.enviarVersao(PILOTO(3), () => {})
  await expect(versoes.enviarVersao(PILOTO(3), () => {})).rejects.toThrow('O número da versão piloto precisa ser maior que 3.')
  await expect(versoes.enviarVersao(PILOTO(1), () => {})).rejects.toThrow('O número da versão piloto precisa ser maior que 3.')
  await versoes.enviarVersao(PEDIDO, () => {})
  await expect(versoes.enviarVersao(PILOTO(9), () => {}))
    .rejects.toThrow('O processo já tem versão em sequência; a versão piloto só pode ser enviada antes dela.')
  expect(await versoes.listarVersoes('p1')).toHaveLength(2)
})

const acrescimo = (mudancas: Partial<PedidoDeAcrescimo> = {}): PedidoDeAcrescimo => ({
  processoId: 'p1', versaoId: 'v1', numero: 1, piloto: false, papel: 'png', arquivo: new File(['n'], 'novo.png'), ...mudancas,
})

async function comVersaoSoBpm(): Promise<VersoesFalso> {
  const versoes = falso()
  await versoes.enviarVersao({ ...PEDIDO, arquivos: [{ papel: 'bpm', arquivo: new File(['x'], 'a.bpm') }] }, () => {})
  return versoes
}

test('acrescentar o .png e o .bpmn entra na versão, com o nome padrão e o evento, e recusa o que a versão já tem', async () => {
  const versoes = await comVersaoSoBpm()
  const eventos: EventoDoCadastro[] = []
  versoes.aoRegistrar = (_processoId, evento) => eventos.push(evento)
  const progresso: string[] = []
  const id = (await versoes.listarVersoes('p1'))[0].id
  await versoes.acrescentarArquivo(acrescimo({ versaoId: id }), (enviados, total) => progresso.push(`${enviados}/${total}`))
  await versoes.acrescentarArquivo(acrescimo({ versaoId: id, papel: 'bpmn', arquivo: new File(['n'], 'novo.bpmn') }), () => {})
  const [versao] = await versoes.listarVersoes('p1')
  expect(versao.arquivos.map((arquivo) => arquivo.nome)).toEqual([
    'TSA_V1_Emitir Ofício.bpm', 'TSA_V1_Emitir Ofício.png', 'TSA_V1_Emitir Ofício.bpmn',
  ])
  expect(progresso).toEqual(['1/1'])
  expect(eventos.map((evento) => [evento.acao, (evento.depois as { papel: string }).papel])).toEqual([
    ['acrescentar_arquivo', 'png'], ['acrescentar_arquivo', 'bpmn'],
  ])
  await expect(versoes.acrescentarArquivo(acrescimo({ versaoId: id }), () => {})).rejects.toThrow('A versão já tem esse arquivo.')
})

test('acrescentar recusa a versão histórica e a versão aprovada, com as frases do módulo real', async () => {
  const historica = falso()
  await historica.registrarVersaoHistorica(HISTORICA, () => {})
  const [versaoHistorica] = await historica.listarVersoes('p1')
  await expect(historica.acrescentarArquivo(acrescimo({ versaoId: versaoHistorica.id, numero: 5 }), () => {}))
    .rejects.toThrow('A versão histórica é somente leitura: não recebe arquivos.')
  const aprovada = await comVersaoSoBpm()
  const [versao] = await aprovada.listarVersoes('p1')
  aprovada.aprovadas.p1 = versao.numero
  await expect(aprovada.acrescentarArquivo(acrescimo({ versaoId: versao.id }), () => {}))
    .rejects.toThrow('A versão V1 foi aprovada e seus arquivos não podem ser substituídos.')
})

test('as falhas programadas valem também para acrescentar, e nada muda quando falha', async () => {
  const versoes = await comVersaoSoBpm()
  const id = (await versoes.listarVersoes('p1'))[0].id
  versoes.falharNoArquivo = 1
  await expect(versoes.acrescentarArquivo(acrescimo({ versaoId: id }), () => {})).rejects.toThrow('o arquivo novo.png não chegou ao Drive')
  versoes.falharNoArquivo = null
  versoes.falhaNoRegistro = 'sem conexão'
  await expect(versoes.acrescentarArquivo(acrescimo({ versaoId: id }), () => {})).rejects.toThrow('sem conexão')
  expect((await versoes.listarVersoes('p1'))[0].arquivos).toHaveLength(1)
})

