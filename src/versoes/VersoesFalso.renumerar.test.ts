import { beforeEach, describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import type { EventoDoCadastro } from '../cadastros/tipos'
import { VersoesFalso } from './VersoesFalso'
import type { Versao } from './tipos'

const SEQUENCIA: Versao = {
  id: 'v5', numero: 5, historica: false, piloto: false, enviadaEm: '2026-10-20T10:00:00Z', autor: 'Ana', etapa: 'Revisão interna',
  arquivos: [
    { id: 'a1', papel: 'bpm', nome: 'TSA_V5_Compras.bpm', formato: 'bpm', tamanho: 10 },
    { id: 'a2', papel: 'relatorio', nome: 'TSA_V5_Compras_Relatório V2.docx', formato: 'docx', tamanho: 10, numeroDoRelatorio: 2 },
  ],
}
const HISTORICA: Versao = {
  id: 'v3', numero: 3, historica: true, piloto: false, enviadaEm: '2026-10-01T10:00:00Z', autor: 'Ana', etapa: null,
  arquivos: [{ id: 'a3', papel: 'bpm', nome: 'TSA_V3F_Compras.bpm', formato: 'bpm', tamanho: 10 }],
}

let falso: VersoesFalso
let eventos: EventoDoCadastro[]

beforeEach(() => {
  falso = new VersoesFalso()
  falso.versoes.p1 = [SEQUENCIA, HISTORICA]
  falso.processos.p1 = { sigla: 'TSA', nome: 'Compras', etapa: 'Revisão interna' }
  eventos = []
  falso.aoRegistrar = (_, evento) => eventos.push(evento)
})

const numeros = () => falso.versoes.p1.map((versao) => versao.numero)

describe('editarNumero da falsa', () => {
  test('troca o número, renomeia os arquivos e guarda o evento com o antes e o depois; o relatório continua V2', async () => {
    await falso.editarNumero('v5', 5, 7)
    const [versao] = await falso.listarVersoes('p1')
    expect(versao.numero).toBe(7)
    expect(versao.arquivos.map((arquivo) => arquivo.nome)).toEqual(['TSA_V7_Compras.bpm', 'TSA_V7_Compras_Relatório V2.docx'])
    expect(eventos).toHaveLength(1)
    expect(eventos[0]).toMatchObject({ acao: 'alterar_numero', entidade: 'versao', antes: { rotulo: 'V5' }, depois: { rotulo: 'V7' } })
  })

  test('a histórica mantém a letra F no número e no nome', async () => {
    await falso.editarNumero('v3', 3, 2)
    const historica = falso.versoes.p1.find((versao) => versao.id === 'v3')
    expect(historica).toMatchObject({ numero: 2, historica: true })
    expect(historica?.arquivos[0].nome).toBe('TSA_V2F_Compras.bpm')
  })

  test('recusa o número de outra versão, com o rótulo dela, sem mudar nada', async () => {
    await expect(falso.editarNumero('v5', 5, 3)).rejects.toThrow('Este processo já tem a V3F.')
    expect(numeros()).toEqual([5, 3])
    expect(eventos).toEqual([])
  })

  test('recusa quando o número mudou enquanto a janela estava aberta', async () => {
    await expect(falso.editarNumero('v5', 4, 7)).rejects.toThrow('O número desta versão mudou enquanto você editava. Feche e abra de novo.')
    expect(numeros()).toEqual([5, 3])
  })

  test.each([0, -1, 5, 2.5])('recusa o número %s', async (numero) => {
    await expect(falso.editarNumero('v5', 5, numero)).rejects.toThrow('O número da versão precisa ser um inteiro maior que zero')
  })

  test('a falha do Drive deixa o número e os nomes como estavam', async () => {
    falso.falharNaRenomeacao = new TravaDoBanco('Os arquivos não puderam ser renomeados no Drive; a versão continua V5.')
    await expect(falso.editarNumero('v5', 5, 7)).rejects.toThrow('a versão continua V5')
    expect(falso.versoes.p1[0].numero).toBe(5)
    expect(falso.versoes.p1[0].arquivos[0].nome).toBe('TSA_V5_Compras.bpm')
  })

  test('a recusa do registro (processo fora de andamento, perfil) também deixa tudo como estava', async () => {
    falso.falhaNoRegistro = new TravaDoBanco('O processo não está em andamento; não é possível enviar versão.')
    await expect(falso.editarNumero('v5', 5, 7)).rejects.toThrow('não é possível enviar versão')
    expect(numeros()).toEqual([5, 3])
  })

  test('a versão aprovada aceita o número novo, e o selo e o nome do .pdf acompanham', async () => {
    falso.aprovadas.p1 = 5
    falso.pdfsDaAprovacao.p1 = { atual: { id: 'pdf1', papel: 'pdf_da_aprovacao', nome: 'TSA_V5_Compras_Aprovação.pdf', formato: 'pdf', tamanho: 5 }, guardados: [] }
    await falso.editarNumero('v5', 5, 8)
    const [versao] = await falso.listarVersoes('p1')
    expect(versao).toMatchObject({ numero: 8, aprovada: true })
    expect(falso.pdfsDaAprovacao.p1.atual?.nome).toBe('TSA_V8_Compras_Aprovação.pdf')
  })
})
