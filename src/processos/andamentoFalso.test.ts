import { describe, expect, test } from 'vitest'
import {
  avancarEtapas, conferirAutorDaRevisao, conferirDatasDaEtapa, conferirResponsavelEscolhido, mudarEtapaDoProcesso,
  trocarEtapaDoProcesso, voltarEtapas,
} from './andamentoFalso'
import type { EtapaDoProcesso, ProcessoLido, UltimaVersao } from './tipos'

const HOJE = '2026-10-13'

function etapa(ordem: number, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo: `c${ordem}`, nome: `Etapa ${ordem}`, ordem, obrigatoria: true, status: 'pendente',
    nota: null, iniciadaEm: null, resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

const PROCESSO: ProcessoLido = {
  id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
  macroprocessoNome: 'Macro', situacao: 'em_andamento', etapaAtual: { codigo: 'c4', nome: 'Etapa 4', ordem: 4 },
  processoPaiId: null, processoPai: null, subprocessos: [],
  responsavel: null, origem: 'novo', contexto: null, observacoes: null, motivoDaSituacao: null,
  dataDaReuniao: null, ultimaVersao: null, etapasDoProcesso: [etapa(4), etapa(5), etapa(9, { obrigatoria: false })],
}

test('concluir a etapa atual passa a atual para a seguinte', () => {
  const depois = mudarEtapaDoProcesso(PROCESSO, 'a4', { status: 'concluida' })
  expect(depois.etapaAtual).toEqual({ codigo: 'c5', nome: 'Etapa 5', ordem: 5 })
  expect(depois.situacao).toBe('em_andamento')
})

test('com as obrigatórias resolvidas o processo é concluído, mesmo com a opcional pendente, e fica sem etapa atual', () => {
  const quase = mudarEtapaDoProcesso(PROCESSO, 'a4', { status: 'concluida' })
  const depois = mudarEtapaDoProcesso(quase, 'a5', { status: 'realizada_anteriormente' })
  expect(depois.situacao).toBe('concluido')
  expect(depois.etapaAtual).toBeNull()
  expect(depois.responsavel).toBeNull()
})

test('com a Publicação pendente, só conclui com a escolha "não"', () => {
  const comPublicacao = { ...PROCESSO, etapasDoProcesso: [...PROCESSO.etapasDoProcesso.slice(0, 2), etapa(9, { codigo: 'publicacao', obrigatoria: false })] }
  const resolvidas = mudarEtapaDoProcesso(mudarEtapaDoProcesso(comPublicacao, 'a4', { status: 'concluida' }), 'a5', { status: 'concluida' })
  expect(resolvidas.situacao).toBe('em_andamento')
  expect(resolvidas.etapaAtual?.codigo).toBe('publicacao')
  expect(mudarEtapaDoProcesso({ ...resolvidas, vaiParaPublicacao: false }, 'a5', {}).situacao).toBe('concluido')
})

test('etapa de outro processo não muda nada', () => {
  expect(mudarEtapaDoProcesso(PROCESSO, 'x', { status: 'concluida' })).toBe(PROCESSO)
})

describe('voltar', () => {
  const resolvidas = [
    etapa(4, { status: 'concluida', iniciadaEm: '2026-10-10', resolvidaEm: '2026-10-11', nota: null }),
    etapa(5, { status: 'concluida', iniciadaEm: '2026-10-11', resolvidaEm: '2026-10-12' }),
    etapa(6, { status: 'dispensada', nota: 'Não se aplica', resolvidaEm: '2026-10-12' }),
    etapa(7, { status: 'em_andamento', iniciadaEm: '2026-10-13' }),
    etapa(9, { obrigatoria: false }),
  ]

  test('a escolhida volta a em andamento, com o início e sem a conclusão; as seguintes, a pendente sem datas nem nota', () => {
    const depois = voltarEtapas(resolvidas, 'a4', HOJE)
    expect(depois.map((e) => e.status)).toEqual(['em_andamento', 'pendente', 'pendente', 'pendente', 'pendente'])
    expect(depois[0]).toMatchObject({ iniciadaEm: '2026-10-10', resolvidaEm: null })
    expect(depois[2]).toMatchObject({ iniciadaEm: null, resolvidaEm: null, nota: null })
  })

  test('a escolhida sem início (realizada anteriormente) recebe a data de hoje', () => {
    const etapas = [etapa(4, { status: 'realizada_anteriormente', nota: 'Feita antes', resolvidaEm: '2026-10-09' })]
    expect(voltarEtapas(etapas, 'a4', HOJE)[0]).toMatchObject({ iniciadaEm: HOJE, resolvidaEm: null, nota: null })
  })

  test('etapa que não é da lista não muda nada', () => {
    expect(voltarEtapas(resolvidas, 'x', HOJE)).toBe(resolvidas)
  })

  test('voltar uma etapa do processo concluído tira o processo de concluído', () => {
    const concluido = mudarEtapaDoProcesso(
      { ...PROCESSO, etapasDoProcesso: [etapa(4, { status: 'concluida' }), etapa(5, { status: 'concluida' })] },
      'a5', { status: 'concluida' })
    expect(concluido.situacao).toBe('concluido')
    const depois = trocarEtapaDoProcesso(concluido, 'a4', (etapas) => voltarEtapas(etapas, 'a4', HOJE))
    expect(depois.situacao).toBe('em_andamento')
    expect(depois.etapaAtual?.codigo).toBe('c4')
  })
})

describe('datas', () => {
  test('aceita datas até hoje, com a conclusão no dia do início ou depois', () => {
    expect(() => conferirDatasDaEtapa({ iniciadaEm: '2026-10-12', resolvidaEm: HOJE }, HOJE)).not.toThrow()
    expect(() => conferirDatasDaEtapa({ iniciadaEm: null, resolvidaEm: null }, HOJE)).not.toThrow()
  })

  test('recusa data no futuro com o valor em DD/MM/AAAA', () => {
    expect(() => conferirDatasDaEtapa({ iniciadaEm: '2026-10-20', resolvidaEm: null }, HOJE))
      .toThrow('A data 20/10/2026 está no futuro.')
    expect(() => conferirDatasDaEtapa({ iniciadaEm: null, resolvidaEm: '2026-11-01' }, HOJE))
      .toThrow('A data 01/11/2026 está no futuro.')
  })

  test('recusa conclusão antes do início com as duas datas', () => {
    expect(() => conferirDatasDaEtapa({ iniciadaEm: '2026-10-05', resolvidaEm: '2026-10-01' }, HOJE))
      .toThrow('A conclusão (01/10/2026) não pode ser antes do início (05/10/2026).')
  })
})

describe('avançar', () => {
  const ANA = { id: 'u1', nome: 'Ana Teste' }

  test('resolve a escolhida e inicia a primeira pendente depois dela, com o responsável e hoje', () => {
    const etapas = [etapa(4, { status: 'em_andamento' }), etapa(5, { status: 'concluida' }), etapa(6), etapa(7)]
    const depois = avancarEtapas(etapas, 'a4', { status: 'concluida', resolvidaEm: HOJE }, ANA, HOJE)
    expect(depois.map((outra) => outra.status)).toEqual(['concluida', 'concluida', 'em_andamento', 'pendente'])
    expect(depois[2]).toMatchObject({ iniciadaEm: HOJE, responsavelId: 'u1', responsavelNome: 'Ana Teste' })
  })

  test('sem responsável, limpa o que a próxima tinha; sem pendente depois, não inicia nada', () => {
    const limpa = avancarEtapas([etapa(4, { status: 'em_andamento' }), etapa(5, { responsavelId: 'u9', responsavelNome: 'Zé' })],
      'a4', { status: 'concluida' }, null, HOJE)
    expect(limpa[1]).toMatchObject({ status: 'em_andamento', responsavelId: null, responsavelNome: null })
    const ultima = avancarEtapas([etapa(4, { status: 'em_andamento' })], 'a4', { status: 'concluida' }, ANA, HOJE)
    expect(ultima.map((outra) => outra.status)).toEqual(['concluida'])
  })
})

describe('trava do autor e responsável escolhido', () => {
  const ULTIMA: UltimaVersao = { numero: 3, autorId: 'u1', autorNome: 'Ana Teste', papeis: ['bpmn', 'png'] }
  const revisao = (responsavelId: string | null = null) => etapa(6, { codigo: 'revisao_interna', responsavelId })
  const FRASE = 'Ana Teste enviou a versão V3 e não pode ser responsável pela Revisão interna.'

  test('recusa o autor da versão mais recente como responsável da Revisão interna, com a frase do banco', () => {
    expect(() => conferirAutorDaRevisao(ULTIMA, revisao(), 'u1')).toThrow(FRASE)
  })

  test('aceita outro usuário, outra etapa, ninguém, quem já era o responsável e o processo sem versão', () => {
    expect(() => conferirAutorDaRevisao(ULTIMA, revisao(), 'u2')).not.toThrow()
    expect(() => conferirAutorDaRevisao(ULTIMA, etapa(6), 'u1')).not.toThrow()
    expect(() => conferirAutorDaRevisao(ULTIMA, revisao(), null)).not.toThrow()
    expect(() => conferirAutorDaRevisao(ULTIMA, revisao('u1'), 'u1')).not.toThrow()
    expect(() => conferirAutorDaRevisao(null, revisao(), 'u1')).not.toThrow()
  })

  test('o responsável escolhido fora dos possíveis é recusado com a frase do banco', () => {
    expect(() => conferirResponsavelEscolhido('u9', [{ id: 'u1', nome: 'Ana Teste' }])).toThrow(
      'u9 não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.')
    expect(() => conferirResponsavelEscolhido('u1', [{ id: 'u1', nome: 'Ana Teste' }])).not.toThrow()
    expect(() => conferirResponsavelEscolhido(null, [])).not.toThrow()
  })
})
