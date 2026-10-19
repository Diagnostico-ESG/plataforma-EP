import { describe, expect, test } from 'vitest'
import { selosDoCartao } from './selosDoCartao'
import type { DadosDoCartao, ProcessoDaLista, StatusDaEtapa } from './tipos'

const HOJE = '2026-10-19'
const CODIGOS = ['modelagem', 'relatorio_modelagem_tecnica', 'revisao_interna', 'revisao_do_setor', 'aprovacao', 'eprotocolo']

type Mudancas = {
  cartao?: Partial<DadosDoCartao>
  atual?: string
  situacao?: ProcessoDaLista['situacao']
  semResponsavel?: boolean
  dataDaReuniao?: string | null
}

function processo({ cartao = {}, atual = 'revisao_interna', situacao = 'em_andamento', semResponsavel = false, dataDaReuniao = null }: Mudancas = {}): ProcessoDaLista {
  const caminho = CODIGOS.map((codigo) => ({ codigo, status: 'pendente' as StatusDaEtapa }))
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro', processoPaiId: null, situacao, dataDaReuniao,
    etapaAtual: { codigo: atual, nome: 'Etapa', ordem: 3 },
    responsavel: semResponsavel ? null : { id: 'u1', nome: 'Ana', fotoUrl: null },
    cartao: {
      etapaAtualStatus: 'em_andamento', etapaAtualIniciadaEm: HOJE, responsavelAtivo: true, caminho,
      ultimaVersao: null, subprocessos: 0, ...cartao,
    },
  }
}

const textos = (...argumentos: Parameters<typeof processo>) => selosDoCartao(processo(...argumentos), HOJE).map((selo) => selo.texto)
const tipos = (...argumentos: Parameters<typeof processo>) => selosDoCartao(processo(...argumentos), HOJE).map((selo) => selo.tipo)
const semRelatorio = { ultimaVersao: { numero: 3, historica: false, temRelatorio: false } }

describe('selo de dias', () => {
  test('ausente com 15 dias, presente e âmbar com 16', () => {
    expect(textos({ cartao: { etapaAtualIniciadaEm: '2026-10-04' } })).toEqual([])
    const selos = selosDoCartao(processo({ cartao: { etapaAtualIniciadaEm: '2026-10-03' } }), HOJE)
    expect(selos).toEqual([{ tipo: 'dias', texto: '16 dias nesta etapa', tom: 'alerta' }])
  })

  test('nunca no suspenso nem na etapa atual pendente ou sem início', () => {
    expect(textos({ situacao: 'suspenso', cartao: { etapaAtualIniciadaEm: '2026-09-01' } })).toEqual([])
    expect(textos({ cartao: { etapaAtualStatus: 'pendente', etapaAtualIniciadaEm: '2026-09-01' } })).toEqual([])
    expect(textos({ cartao: { etapaAtualIniciadaEm: null } })).toEqual([])
  })
})

describe('selo de Relatório pendente', () => {
  test('ausente antes da Revisão interna, presente nela e depois', () => {
    expect(textos({ atual: 'relatorio_modelagem_tecnica', cartao: semRelatorio })).toEqual(['V3'])
    expect(selosDoCartao(processo({ atual: 'revisao_interna', cartao: semRelatorio }), HOJE)[0])
      .toEqual({ tipo: 'relatorio', texto: 'Relatório pendente', tom: 'alerta' })
    expect(tipos({ atual: 'aprovacao', cartao: semRelatorio })).toContain('relatorio')
  })

  test('ausente com relatório, na versão histórica, sem versão e sem a Revisão interna no caminho', () => {
    expect(tipos({ cartao: { ultimaVersao: { numero: 3, historica: false, temRelatorio: true } } })).not.toContain('relatorio')
    expect(tipos({ cartao: { ultimaVersao: { numero: 5, historica: true, temRelatorio: false } } })).not.toContain('relatorio')
    expect(tipos({ cartao: {} })).not.toContain('relatorio')
    expect(tipos({ cartao: { ...semRelatorio, caminho: [{ codigo: 'modelagem', status: 'pendente' }] }, atual: 'modelagem' }))
      .not.toContain('relatorio')
  })

  test('o suspenso mantém o selo, que não é de tempo', () => {
    expect(tipos({ situacao: 'suspenso', cartao: semRelatorio })).toContain('relatorio')
  })
})

describe('demais selos', () => {
  test('Sem responsável, neutro, só sem responsável', () => {
    expect(selosDoCartao(processo({ semResponsavel: true }), HOJE)).toEqual([{ tipo: 'sem_responsavel', texto: 'Sem responsável', tom: 'neutro' }])
    expect(tipos()).not.toContain('sem_responsavel')
  })

  test('Reunião hoje, futura e passada', () => {
    expect(textos({ dataDaReuniao: HOJE })).toEqual(['Reunião hoje'])
    expect(textos({ dataDaReuniao: '2026-10-25' })).toEqual(['Reunião 25/10'])
    expect(textos({ dataDaReuniao: '2026-10-18' })).toEqual([])
    expect(textos({ dataDaReuniao: null })).toEqual([])
  })

  test('versão: V3, V5F e ausente sem versão', () => {
    expect(textos({ cartao: { ultimaVersao: { numero: 3, historica: false, temRelatorio: true } } })).toEqual(['V3'])
    expect(textos({ cartao: { ultimaVersao: { numero: 5, historica: true, temRelatorio: false } } })).toEqual(['V5F'])
    expect(textos()).toEqual([])
  })

  test('subprocessos no singular e no plural, e nada com zero', () => {
    expect(textos({ cartao: { subprocessos: 1 } })).toEqual(['1 subprocesso'])
    expect(textos({ cartao: { subprocessos: 3 } })).toEqual(['3 subprocessos'])
    expect(textos({ cartao: { subprocessos: 0 } })).toEqual([])
  })
})

test('a ordem: dias, Relatório pendente, Sem responsável, Reunião, versão, subprocessos', () => {
  const todos = processo({
    semResponsavel: true, dataDaReuniao: HOJE,
    cartao: { etapaAtualIniciadaEm: '2026-09-01', ...semRelatorio, subprocessos: 2 },
  })
  expect(selosDoCartao(todos, HOJE).map((selo) => selo.tipo))
    .toEqual(['dias', 'relatorio', 'sem_responsavel', 'reuniao', 'versao', 'subprocessos'])
})

test('o processo sem cartão não tem selos de cartão', () => {
  const semCartao = { ...processo({ semResponsavel: true }), cartao: undefined }
  expect(selosDoCartao(semCartao, HOJE).map((selo) => selo.tipo)).toEqual(['sem_responsavel'])
})
