import { describe, expect, test } from 'vitest'
import { CATALOGO_DE_TESTE, etapaAtualDe, umProcesso } from '../testes/processoDaLista'
import { selosDoCartao } from './selosDoCartao'
import type { ProcessoDaLista } from './tipos'

const HOJE = '2026-10-19'

const selos = (processo: ProcessoDaLista) => selosDoCartao(processo, HOJE, CATALOGO_DE_TESTE)
const textos = (processo: ProcessoDaLista) => selos(processo).map((selo) => selo.texto)
const tipos = (processo: ProcessoDaLista) => selos(processo).map((selo) => selo.tipo)
const semRelatorio = { ultimaVersao: { numero: 3, historica: false, temRelatorio: false }, responsavelAtivo: true, subprocessos: 0 }

describe('selo de dias (processo parado)', () => {
  test('ausente com 7 dias, presente e âmbar com 8', () => {
    expect(textos(umProcesso('A', { entrouNaEtapaEm: '2026-10-12' }))).toEqual([])
    expect(selos(umProcesso('A', { entrouNaEtapaEm: '2026-10-11' })))
      .toEqual([{ tipo: 'dias', texto: '8 dias nesta etapa', tom: 'alerta' }])
  })

  test('mudar só a etiqueta não zera a contagem: o selo vem da entrada na etapa', () => {
    expect(textos(umProcesso('A', { entrouNaEtapaEm: '2026-10-01', etiqueta: 'concluido' }))).toEqual(['18 dias nesta etapa'])
  })

  test('nunca em Não iniciados, em Concluídos, no suspenso, no cancelado nem sem entrada', () => {
    const antigo = '2026-09-01'
    expect(textos(umProcesso('A', { entrouNaEtapaEm: antigo }, 'nao_iniciados'))).toEqual([])
    expect(tipos(umProcesso('A', { entrouNaEtapaEm: antigo, situacao: 'concluido', publicadoEm: '2026-09-02' }, 'concluidos'))).toEqual([])
    expect(tipos(umProcesso('A', { entrouNaEtapaEm: antigo, situacao: 'suspenso' }))).not.toContain('dias')
    expect(tipos(umProcesso('A', { entrouNaEtapaEm: antigo, situacao: 'cancelado' }))).not.toContain('dias')
    expect(tipos(umProcesso('A', { entrouNaEtapaEm: null }))).not.toContain('dias')
  })
})

describe('selo de Relatório pendente', () => {
  const com = (etapa: string) => umProcesso('A', { cartao: semRelatorio }, etapa)

  test('ausente antes da Revisão interna, presente nela e depois, e ausente em Concluídos', () => {
    expect(tipos(com('relatorio_modelagem_tecnica'))).not.toContain('relatorio')
    expect(tipos(com('nao_iniciados'))).not.toContain('relatorio')
    expect(selos(com('revisao_interna'))[0]).toEqual({ tipo: 'relatorio', texto: 'Relatório pendente', tom: 'alerta' })
    expect(tipos(com('aprovacao_setor'))).toContain('relatorio')
    expect(tipos(com('publicacao'))).toContain('relatorio')
    expect(tipos({ ...com('concluidos'), publicadoEm: '2026-10-01' })).not.toContain('relatorio')
  })

  test('ausente com relatório, na versão histórica e sem versão', () => {
    const com2 = (versao: NonNullable<ProcessoDaLista['cartao']>['ultimaVersao']) =>
      tipos(umProcesso('A', { cartao: { ...semRelatorio, ultimaVersao: versao } }))
    expect(com2({ numero: 3, historica: false, temRelatorio: true })).not.toContain('relatorio')
    expect(com2({ numero: 5, historica: true, temRelatorio: false })).not.toContain('relatorio')
    expect(com2(null)).not.toContain('relatorio')
  })

  test('o suspenso mantém o selo, que não é de tempo', () => {
    expect(tipos({ ...com('revisao_interna'), situacao: 'suspenso' })).toContain('relatorio')
  })
})

describe('Sem publicação', () => {
  test('em Concluídos sem a data da publicação, neutro e antes dos outros; com a data, não', () => {
    const concluido = umProcesso('A', { situacao: 'concluido', entrouNaEtapaEm: '2026-10-19' }, 'concluidos')
    expect(selos(concluido)).toEqual([{ tipo: 'sem_publicacao', texto: 'Sem publicação', tom: 'neutro' }])
    expect(selos({ ...concluido, publicadoEm: '2026-10-10' })).toEqual([])
  })

  test('fora de Concluídos o selo não existe', () => {
    expect(tipos(umProcesso('A'))).not.toContain('sem_publicacao')
  })
})

describe('demais selos', () => {
  test('sem responsável não há selo', () => {
    expect(selos(umProcesso('A', { responsavel: null }))).toEqual([])
  })

  test.each(['nao_iniciados', 'modelagem'])('a data da modelagem piloto, no passado, hoje ou no futuro, não vira selo em %s', (etapa) => {
    const com = (data: string | null) => textos(umProcesso('A', { dataDaModelagemPiloto: data }, etapa))
    for (const data of [HOJE, '2026-10-25', '2026-10-18', null]) expect(com(data)).toEqual([])
  })

  test('versão: V3, V5F e ausente sem versão', () => {
    const versao = (numero: number, historica: boolean) =>
      umProcesso('A', { cartao: { responsavelAtivo: true, subprocessos: 0, ultimaVersao: { numero, historica, temRelatorio: true } } })
    expect(textos(versao(3, false))).toEqual(['V3'])
    expect(textos(versao(5, true))).toEqual(['V5F'])
    expect(textos(umProcesso('A'))).toEqual([])
  })

  test('subprocessos no singular e no plural, e nada com zero', () => {
    const subs = (subprocessos: number) => umProcesso('A', { cartao: { responsavelAtivo: true, ultimaVersao: null, subprocessos } })
    expect(textos(subs(1))).toEqual(['1 subprocesso'])
    expect(textos(subs(3))).toEqual(['3 subprocessos'])
    expect(textos(subs(0))).toEqual([])
  })
})

test('a ordem: dias, Relatório pendente, versão, subprocessos', () => {
  const todos = umProcesso('A', { responsavel: null, entrouNaEtapaEm: '2026-09-01', cartao: { ...semRelatorio, subprocessos: 2 } })
  expect(tipos(todos)).toEqual(['dias', 'relatorio', 'versao', 'subprocessos'])
})

test('o processo sem cartão não tem selos de cartão', () => {
  expect(tipos({ ...umProcesso('A', { responsavel: null }), cartao: undefined })).toEqual([])
})

test('a etapa atual vem do catálogo de teste', () => {
  expect(etapaAtualDe('concluidos').posicao).toBe(8)
})
