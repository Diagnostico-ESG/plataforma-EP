import { expect, test } from 'vitest'
import { ImportacaoFalso } from './ImportacaoFalso'
import type { ProcessoParaImportar } from './tipos'

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
