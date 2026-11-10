import { expect, test } from 'vitest'
import { VersoesFalso } from '../versoes/VersoesFalso'
import { ImportacaoFalso } from './ImportacaoFalso'
import type { PedidoDeImportacaoDeVersao, ProcessoParaImportar } from './tipos'

const PROCESSO: ProcessoParaImportar = {
  setor: 'XYZ', macroprocesso: 'Gestão de exemplos', nome: 'Exemplo Alfa', etapaCodigo: 'modelagem',
  dataDaPublicacao: null, dataDaModelagemPiloto: null, anotacoes: null,
}

test('grava o processo novo e pula o que já existe, sem diferença de caixa e espaços', async () => {
  const falso = new ImportacaoFalso()
  expect(await falso.gravarProcesso(PROCESSO)).toBe('criado')
  expect(await falso.gravarProcesso({ ...PROCESSO, setor: 'xyz', nome: ' exemplo alfa ' })).toBe('ja_existia')
  expect(falso.gravados).toHaveLength(1)
  expect((await falso.listarExistentes()).setores).toEqual(['XYZ'])
})

test('falha programada por nome de processo e leitura que falha', async () => {
  const falso = new ImportacaoFalso()
  falso.falharNoProcesso = 'Exemplo Alfa'
  await expect(falso.gravarProcesso(PROCESSO)).rejects.toThrow('falha de teste ao gravar Exemplo Alfa')
  falso.falharAoListar = true
  await expect(falso.listarExistentes()).rejects.toThrow('falha de teste ao ler o que já existe')
})

// A importação dos arquivos (ticket 02): a versão importada vai para o VersoesFalso, com o nome padrão e o evento "importar".
const BPM = new File(['b'], 'XYZ_V2_Exemplo Alfa.bpm')
const RELATORIO = new File(['r'], 'XYZ_V2_Exemplo Alfa_Relatório.docx')

function comProcesso() {
  const versoes = new VersoesFalso()
  versoes.processos.p1 = { sigla: 'XYZ', nome: 'Exemplo Alfa', etapa: 'Revisão interna' }
  const falso = new ImportacaoFalso(versoes)
  falso.processosDaPasta = [{ id: 'p1', chave: 'XYZ|exemplo alfa', nome: 'Exemplo Alfa' }]
  return { falso, versoes }
}

const PEDIDO: PedidoDeImportacaoDeVersao = {
  processoId: 'p1', numero: 2, tipo: 'sequencia', numeroDoRelatorio: 1,
  arquivos: [{ papel: 'bpm', arquivo: BPM }, { papel: 'relatorio', arquivo: RELATORIO }],
}

test('a versão importada aparece nas versões do processo, com o nome padrão e o evento importar', async () => {
  const { falso, versoes } = comProcesso()
  const eventos: string[] = []
  versoes.aoRegistrar = (_processo, evento) => eventos.push(evento.acao)
  expect(await falso.importarVersao(PEDIDO, () => {})).toBe('criada')
  const [versao] = await versoes.listarVersoes('p1')
  expect(versao.arquivos.map((a) => a.nome)).toEqual(['XYZ_V2_Exemplo Alfa.bpm', 'XYZ_V2_Exemplo Alfa_Relatório V1.docx'])
  expect(eventos).toEqual(['importar'])
  expect(await falso.importarVersao(PEDIDO, () => {})).toBe('ja_existia')
  expect((await falso.listarProcessosDaPasta()).processos[0]).toMatchObject({ versoes: [2], maiorRelatorio: 1 })
})

test('o arquivo programado para falhar interrompe a versão; o anexo e a subpasta não se repetem', async () => {
  const { falso } = comProcesso()
  falso.falharNoArquivo = BPM.name
  await expect(falso.importarVersao(PEDIDO, () => {})).rejects.toThrow(`o arquivo ${BPM.name} não chegou ao Drive`)
  const pdf = new File(['p'], 'XYZ_V2_Exemplo Alfa_Relatório.pdf')
  expect([await falso.importarAnexo('p1', pdf), await falso.importarAnexo('p1', pdf)]).toEqual(['criado', 'ja_existia'])
  await falso.anotarSubpasta('p1', 'Grupo')
  await falso.anotarSubpasta('p1', 'Grupo')
  expect(falso.subpastasAnotadas).toEqual([{ processoId: 'p1', subpasta: 'Grupo' }])
})
