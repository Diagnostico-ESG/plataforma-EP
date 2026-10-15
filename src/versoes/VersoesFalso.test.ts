import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import type { EventoDoCadastro } from '../cadastros/tipos'
import type { PedidoDeVersao } from './tipos'
import { VersoesFalso } from './VersoesFalso'

const PEDIDO: PedidoDeVersao = {
  processoId: 'p1', numero: 1, observacao: 'Primeira',
  arquivos: [{ papel: 'bpmn', arquivo: new File(['x'], 'a.bpmn') }, { papel: 'png', arquivo: new File(['y'], 'a.png') }],
}

function falso(): VersoesFalso {
  const versoes = new VersoesFalso()
  versoes.processos.p1 = { sigla: 'TSA', nome: 'Emitir Ofício', etapa: 'Reunião de modelagem' }
  return versoes
}

test('o envio registra a versão com o número do banco, os nomes padrão, a etapa e o evento', async () => {
  const versoes = falso()
  const eventos: [string, EventoDoCadastro][] = []
  versoes.aoRegistrar = (processoId, evento) => eventos.push([processoId, evento])
  const progresso: string[] = []
  await versoes.enviarVersao(PEDIDO, (enviados, total) => progresso.push(`${enviados}/${total}`))
  const [versao] = await versoes.listarVersoes('p1')
  expect(versao).toMatchObject({ numero: 1, historica: false, etapa: 'Reunião de modelagem', observacao: 'Primeira', autor: 'Pessoa de Teste' })
  expect(versao.arquivos.map((arquivo) => arquivo.nome)).toEqual(['TSA_V1_Emitir Ofício.bpmn', 'TSA_V1_Emitir Ofício.png'])
  expect(progresso).toEqual(['1/2', '2/2'])
  expect(versoes.envios).toEqual([PEDIDO])
  expect(eventos[0][0]).toBe('p1')
  expect(eventos[0][1]).toMatchObject({ acao: 'enviar', entidade: 'versao', entidadeRef: 'p1', depois: { rotulo: 'V1' } })
})

test('a lista vem da mais recente para a mais antiga', async () => {
  const versoes = falso()
  await versoes.enviarVersao(PEDIDO, () => {})
  await versoes.enviarVersao({ ...PEDIDO, numero: 2 }, () => {})
  expect((await versoes.listarVersoes('p1')).map((versao) => versao.numero)).toEqual([2, 1])
})

test('falha no envio de um arquivo não registra nada', async () => {
  const versoes = falso()
  versoes.falharNoArquivo = 2
  await expect(versoes.enviarVersao(PEDIDO, () => {})).rejects.toThrow('o arquivo a.png não chegou ao Drive')
  expect(await versoes.listarVersoes('p1')).toEqual([])
})

test('a falha programada no registro chega como foi programada', async () => {
  const versoes = falso()
  versoes.falhaNoRegistro = new TravaDoBanco('A versão precisa do .bpmn e do .png.')
  await expect(versoes.enviarVersao(PEDIDO, () => {})).rejects.toBeInstanceOf(TravaDoBanco)
  expect(await versoes.listarVersoes('p1')).toEqual([])
})

test('a leitura com falha programada é recusada', async () => {
  const versoes = falso()
  versoes.falharLeitura = true
  await expect(versoes.listarVersoes('p1')).rejects.toThrow('falha de conexão simulada')
})
