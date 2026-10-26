import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import type { EventoDoCadastro } from '../cadastros/tipos'
import type { PedidoDeRelatorio, PedidoDeVersao } from './tipos'
import { VersoesFalso } from './VersoesFalso'

// O relatório com numeração própria na falsa (ADR 0026): imita as regras do banco e as frases do módulo real.
const BPM = { papel: 'bpm' as const, arquivo: new File(['x'], 'a.bpm') }
const PEDIDO: PedidoDeVersao = { processoId: 'p1', numero: 1, arquivos: [BPM] }
const COM_RELATORIO: PedidoDeVersao = {
  ...PEDIDO, arquivos: [BPM, { papel: 'relatorio', arquivo: new File(['r'], 'rel.docx') }],
}
const HISTORICA: PedidoDeVersao = { processoId: 'p1', numero: 5, arquivos: [BPM] }
const RELATORIO = (mudancas: Partial<PedidoDeRelatorio> = {}): PedidoDeRelatorio => ({
  processoId: 'p1', numeroDaVersao: 1, piloto: false, numeroDoRelatorio: 1, arquivo: new File(['rel'], 'depois.docx'), ...mudancas,
})

function falso(): VersoesFalso {
  const versoes = new VersoesFalso()
  versoes.processos.p1 = { sigla: 'TSA', nome: 'Emitir Ofício', etapa: 'Relatório e modelagem técnica' }
  return versoes
}

test('o relatório sozinho entra na versão mais recente com o próximo número, o nome padrão e o evento', async () => {
  const versoes = falso()
  await versoes.enviarVersao(PEDIDO, () => {})
  const eventos: EventoDoCadastro[] = []
  versoes.aoRegistrar = (_processoId, evento) => eventos.push(evento)
  const progresso: string[] = []
  await versoes.enviarRelatorio(RELATORIO(), (enviados, total) => progresso.push(`${enviados}/${total}`))
  const [versao] = await versoes.listarVersoes('p1')
  expect(versao.arquivos.at(-1)).toMatchObject({ papel: 'relatorio', nome: 'TSA_V1_Emitir Ofício_Relatório V1.docx', numeroDoRelatorio: 1 })
  expect(progresso).toEqual(['1/1'])
  expect(eventos[0]).toMatchObject({
    acao: 'enviar_relatorio', entidade: 'versao', entidadeRef: 'p1', depois: { rotulo: 'V1', numero_do_relatorio: 1 },
  })
})

test('dois relatórios na mesma versão: o segundo é o Relatório V2; a versão nova liga o seguinte a ela', async () => {
  const versoes = falso()
  await versoes.enviarVersao(PEDIDO, () => {})
  await versoes.enviarRelatorio(RELATORIO(), () => {})
  await versoes.enviarRelatorio(RELATORIO({ numeroDoRelatorio: 2 }), () => {})
  await versoes.enviarVersao({ ...PEDIDO, numero: 2 }, () => {})
  await versoes.enviarRelatorio(RELATORIO({ numeroDaVersao: 2, numeroDoRelatorio: 3 }), () => {})
  const [v2, v1] = await versoes.listarVersoes('p1')
  expect(v1.arquivos.filter((arquivo) => arquivo.papel === 'relatorio').map((arquivo) => arquivo.numeroDoRelatorio)).toEqual([1, 2])
  expect(v2.arquivos.map((arquivo) => arquivo.numeroDoRelatorio)).toEqual([undefined, 3])
})

test('o relatório que entra junto com a versão recebe o próximo número; o da histórica não é numerado', async () => {
  const versoes = falso()
  await versoes.registrarVersaoHistorica({ ...HISTORICA, arquivos: [BPM, { papel: 'relatorio', arquivo: new File(['r'], 'rel.pdf') }] }, () => {})
  await versoes.enviarVersao({ ...COM_RELATORIO, numero: 6 }, () => {})
  const [nova, historica] = await versoes.listarVersoes('p1')
  expect(historica.arquivos.find((arquivo) => arquivo.papel === 'relatorio')).toMatchObject({ nome: 'TSA_V5F_Emitir Ofício_Relatório.pdf' })
  expect(historica.arquivos.find((arquivo) => arquivo.papel === 'relatorio')?.numeroDoRelatorio).toBeUndefined()
  expect(nova.arquivos.find((arquivo) => arquivo.papel === 'relatorio')).toMatchObject({ nome: 'TSA_V6_Emitir Ofício_Relatório V1.docx', numeroDoRelatorio: 1 })
})

test('recusa o .pdf no relatório novo, sozinho ou junto', async () => {
  const versoes = falso()
  await versoes.enviarVersao(PEDIDO, () => {})
  await expect(versoes.enviarRelatorio(RELATORIO({ arquivo: new File(['r'], 'rel.pdf') }), () => {}))
    .rejects.toThrow('O relatório precisa ser um arquivo .docx.')
  const junto: PedidoDeVersao = { ...PEDIDO, numero: 2, arquivos: [BPM, { papel: 'relatorio', arquivo: new File(['r'], 'rel.pdf') }] }
  await expect(versoes.enviarVersao(junto, () => {})).rejects.toThrow('O relatório precisa ser um arquivo .docx.')
})

test('recusa o relatório sem versão para recebê-lo (nem a histórica serve) e a prévia que mudou', async () => {
  const versoes = falso()
  await expect(versoes.enviarRelatorio(RELATORIO(), () => {})).rejects.toThrow('Não há versão para receber o relatório')
  await versoes.registrarVersaoHistorica(HISTORICA, () => {})
  await expect(versoes.enviarRelatorio(RELATORIO({ numeroDaVersao: 5 }), () => {})).rejects.toThrow('Não há versão para receber o relatório')
  await versoes.enviarVersao({ ...PEDIDO, numero: 6 }, () => {})
  await expect(versoes.enviarRelatorio(RELATORIO({ numeroDaVersao: 3 }), () => {}))
    .rejects.toThrow('Outra pessoa enviou uma versão enquanto você enviava; esta seria a V6.')
  await expect(versoes.enviarRelatorio(RELATORIO({ numeroDaVersao: 6, numeroDoRelatorio: 9 }), () => {}))
    .rejects.toThrow('este seria o Relatório V1')
})

test('o relatório pode acompanhar a versão piloto', async () => {
  const versoes = falso()
  await versoes.enviarVersao({ ...PEDIDO, numero: 6, piloto: true }, () => {})
  await versoes.enviarRelatorio(RELATORIO({ numeroDaVersao: 6, piloto: true }), () => {})
  const [piloto] = await versoes.listarVersoes('p1')
  expect(piloto.arquivos.at(-1)?.nome).toBe('TSA_V6P_Emitir Ofício_Relatório V1.docx')
})

test('as falhas programadas valem também para o relatório sozinho', async () => {
  const versoes = falso()
  await versoes.enviarVersao(PEDIDO, () => {})
  versoes.falharNoArquivo = 1
  await expect(versoes.enviarRelatorio(RELATORIO(), () => {})).rejects.toThrow('o arquivo depois.docx não chegou ao Drive')
  versoes.falharNoArquivo = null
  versoes.falhaNoRegistro = 'sem espaço'
  await expect(versoes.enviarRelatorio(RELATORIO(), () => {})).rejects.toThrow('sem espaço')
  versoes.falhaNoRegistro = new TravaDoBanco('Seu perfil não permite enviar versões.')
  await expect(versoes.enviarRelatorio(RELATORIO(), () => {})).rejects.toThrow('Seu perfil não permite enviar versões.')
  expect((await versoes.listarVersoes('p1'))[0].arquivos).toHaveLength(1)
})
