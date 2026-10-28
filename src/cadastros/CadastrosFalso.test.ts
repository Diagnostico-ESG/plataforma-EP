import { describe, expect, test } from 'vitest'
import { CadastrosFalso } from './CadastrosFalso'

function setor(sigla: string, cor?: number, ativo = true) {
  return { id: `id-${sigla}`, sigla, nome: `Setor ${sigla}`, observacoes: null, ativo, cor }
}

async function corDoNovo(cadastros: CadastrosFalso): Promise<number | undefined> {
  await cadastros.criarSetor({ nome: 'Setor Novo', sigla: 'NOV', observacoes: null })
  return cadastros.setores.at(-1)?.cor
}

describe('CadastrosFalso: cor do setor novo', () => {
  test('com as cores 1 e 2 em uso, recebe a 3', async () => {
    const cadastros = new CadastrosFalso()
    cadastros.setores = [setor('AAA', 1), setor('BBB', 2)]
    expect(await corDoNovo(cadastros)).toBe(3)
  })

  test('com as cores 1 e 3 em uso, recebe a 2', async () => {
    const cadastros = new CadastrosFalso()
    cadastros.setores = [setor('AAA', 1), setor('CCC', 3)]
    expect(await corDoNovo(cadastros)).toBe(2)
  })

  test('o setor inativo continua ocupando a cor', async () => {
    const cadastros = new CadastrosFalso()
    cadastros.setores = [setor('AAA', 1, false)]
    expect(await corDoNovo(cadastros)).toBe(2)
  })

  test('com as 30 em uso, recebe a 1', async () => {
    const cadastros = new CadastrosFalso()
    cadastros.setores = Array.from({ length: 30 }, (_, i) => setor(`S${i + 1}`, i + 1))
    expect(await corDoNovo(cadastros)).toBe(1)
  })

  test('o setor da fixture sem cor é lido com a cor 1', async () => {
    const cadastros = new CadastrosFalso()
    cadastros.setores = [setor('AAA')]
    expect((await cadastros.listarSetores())[0].cor).toBe(1)
    expect((await cadastros.lerSetor('id-AAA'))?.cor).toBe(1)
  })
})
