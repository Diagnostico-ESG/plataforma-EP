import { describe, expect, test } from 'vitest'
import {
  ROTULO_DO_STATUS, acoesDaEtapa, concluidoEm, formatarData, indiceDaEtapaAtual, opcoesDeResponsavel, podeAssumir, proximaPendente, responsavelMarcado, rotuloDoAgora, sinalDaEtapa, usuariosParaAEtapa,
} from './caminhoDeEtapas'
import type { EtapaDoCaminho, EtapaDoProcesso, StatusDaEtapa, UltimaVersao } from './tipos'

function etapa(ordem: number, status: StatusDaEtapa, obrigatoria = false): EtapaDoCaminho {
  return {
    id: `a${ordem}`, codigo: `etapa_${ordem}`, nome: `Etapa ${ordem}`, ordem, obrigatoria, status,
    nota: null, iniciadaEm: null, resolvidaEm: null,
  }
}

describe('etapa atual', () => {
  test('é a primeira não resolvida', () => {
    expect(indiceDaEtapaAtual([etapa(1, 'dispensada'), etapa(2, 'pendente'), etapa(3, 'pendente')])).toBe(1)
    expect(indiceDaEtapaAtual([etapa(1, 'concluida'), etapa(2, 'em_andamento'), etapa(3, 'pendente')])).toBe(1)
  })

  test('com todas resolvidas, não há etapa atual', () => {
    expect(indiceDaEtapaAtual([etapa(1, 'realizada_anteriormente'), etapa(2, 'concluida')])).toBe(-1)
  })
})

describe('ações da etapa', () => {
  test('a atual pendente e opcional: iniciar, dispensar e realizada anteriormente', () => {
    expect(acoesDaEtapa([etapa(1, 'pendente'), etapa(2, 'pendente')], 0)).toEqual(['iniciar', 'dispensar', 'realizada'])
  })

  test('a atual em andamento e obrigatória: concluir e realizada anteriormente, sem dispensar', () => {
    expect(acoesDaEtapa([etapa(1, 'concluida'), etapa(2, 'em_andamento', true)], 1)).toEqual(['concluir', 'realizada'])
  })

  test('a Publicação, opcional, não oferece dispensar (ADR 0020)', () => {
    const publicacao = { ...etapa(2, 'em_andamento'), codigo: 'publicacao' }
    expect(acoesDaEtapa([etapa(1, 'concluida'), publicacao], 1)).toEqual(['concluir', 'realizada'])
  })

  test('a pendente depois da atual não tem ação', () => {
    const etapas = [etapa(1, 'concluida'), etapa(2, 'pendente'), etapa(3, 'pendente')]
    expect(acoesDaEtapa(etapas, 2)).toEqual([])
  })

  test('a resolvida anterior à atual pode ser voltada', () => {
    const etapas = [etapa(1, 'concluida'), etapa(2, 'dispensada'), etapa(3, 'em_andamento'), etapa(4, 'pendente')]
    expect(acoesDaEtapa(etapas, 0)).toEqual(['voltar'])
    expect(acoesDaEtapa(etapas, 1)).toEqual(['voltar'])
  })

  test('com todas resolvidas (processo concluído), qualquer uma pode ser voltada', () => {
    const etapas = [etapa(1, 'concluida'), etapa(2, 'realizada_anteriormente')]
    expect(acoesDaEtapa(etapas, 0)).toEqual(['voltar'])
    expect(acoesDaEtapa(etapas, 1)).toEqual(['voltar'])
  })
})

test('rótulos de status com o texto da tela', () => {
  expect(ROTULO_DO_STATUS).toEqual({
    pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída',
    realizada_anteriormente: 'Realizada anteriormente', dispensada: 'Dispensada',
  })
})

test('a data do banco (AAAA-MM-DD) aparece como DD/MM/AAAA; sem data, um traço', () => {
  expect(formatarData('2026-10-13')).toBe('13/10/2026')
  expect(formatarData(null)).toBe('—')
})

describe('próxima pendente', () => {
  test('é a primeira pendente depois da etapa, pulando as resolvidas', () => {
    const etapas = [etapa(1, 'em_andamento'), etapa(2, 'concluida'), etapa(3, 'pendente'), etapa(4, 'pendente')]
    expect(proximaPendente(etapas, 0)?.id).toBe('a3')
    expect(proximaPendente(etapas, 2)?.id).toBe('a4')
  })

  test('sem pendente depois, não há próxima', () => {
    expect(proximaPendente([etapa(1, 'pendente'), etapa(2, 'concluida')], 0)).toBeNull()
    expect(proximaPendente([etapa(1, 'em_andamento')], 0)).toBeNull()
  })
})

describe('responsável marcado ao abrir a janela de avanço', () => {
  const usuarios = [{ id: 'u1', nome: 'Ana' }, { id: 'u2', nome: 'Bia' }]
  const proxima = (responsavelId: string | null) => ({ ...etapa(2, 'pendente'), responsavelId, responsavelNome: null, responsavelInativo: false })

  test('o que a próxima já tem, se ele está na lista', () => {
    expect(responsavelMarcado(proxima('u2'), 'u1', usuarios)).toBe('u2')
  })

  test('sem ele (ou fora da lista), quem está na tela, se está na lista', () => {
    expect(responsavelMarcado(proxima(null), 'u1', usuarios)).toBe('u1')
    expect(responsavelMarcado(proxima('u9'), 'u1', usuarios)).toBe('u1')
  })

  test('sem nenhum dos dois na lista, ninguém', () => {
    expect(responsavelMarcado(proxima('u9'), 'u8', usuarios)).toBeNull()
    expect(responsavelMarcado(etapa(2, 'pendente'), 'u1', [])).toBeNull()
  })
})

describe('trava do autor da versão mais recente na Revisão interna', () => {
  const ULTIMA: UltimaVersao = { numero: 3, autorId: 'u1', autorNome: 'Ana', papeis: ['bpmn', 'png'] }
  const usuarios = [{ id: 'u1', nome: 'Ana' }, { id: 'u2', nome: 'Bia' }]
  const doProcesso = (codigo: string, status: StatusDaEtapa, responsavelId: string | null = null): EtapaDoProcesso => ({
    ...etapa(5, status), codigo, responsavelId, responsavelNome: null, responsavelInativo: false,
  })

  test('na Revisão interna a lista não traz o autor; nas outras etapas e sem versão, traz todos', () => {
    expect(usuariosParaAEtapa(doProcesso('revisao_interna', 'pendente'), usuarios, ULTIMA)).toEqual([{ id: 'u2', nome: 'Bia' }])
    expect(usuariosParaAEtapa(doProcesso('modelagem', 'pendente'), usuarios, ULTIMA)).toEqual(usuarios)
    expect(usuariosParaAEtapa(doProcesso('revisao_interna', 'pendente'), usuarios, null)).toEqual(usuarios)
  })

  test('assume a etapa pendente ou em andamento sem responsável', () => {
    expect(podeAssumir(doProcesso('modelagem', 'pendente'), 'u1', ULTIMA)).toBe(true)
    expect(podeAssumir(doProcesso('modelagem', 'em_andamento'), 'u1', null)).toBe(true)
  })

  test('não assume etapa resolvida, com responsável ou sem os dados do processo', () => {
    expect(podeAssumir(doProcesso('modelagem', 'concluida'), 'u1', null)).toBe(false)
    expect(podeAssumir(doProcesso('modelagem', 'dispensada'), 'u1', null)).toBe(false)
    expect(podeAssumir(doProcesso('modelagem', 'em_andamento', 'u2'), 'u1', null)).toBe(false)
    expect(podeAssumir(etapa(5, 'pendente'), 'u1', null)).toBe(false)
  })

  test('na Revisão interna, o autor da versão mais recente não assume, mas outro usuário assume', () => {
    expect(podeAssumir(doProcesso('revisao_interna', 'em_andamento'), 'u1', ULTIMA)).toBe(false)
    expect(podeAssumir(doProcesso('revisao_interna', 'em_andamento'), 'u2', ULTIMA)).toBe(true)
  })
})

const etapaDe = (nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso => ({
  id: nome, codigo: nome, nome, ordem: 1, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
  resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
})

test('concluidoEm é a data da última etapa obrigatória resolvida, e a opcional não conta', () => {
  const etapas = [
    etapaDe('a', { status: 'concluida', resolvidaEm: '2026-10-10' }),
    etapaDe('b', { status: 'realizada_anteriormente', resolvidaEm: '2026-10-12' }),
    etapaDe('c', { status: 'dispensada', obrigatoria: false, resolvidaEm: '2026-10-15' }),
  ]
  expect(concluidoEm(etapas)).toBe('2026-10-12')
  expect(concluidoEm([etapaDe('a')])).toBeNull()
})

test('o Trocar põe quem está na tela primeiro, com (você), e Ninguém por enquanto no fim', () => {
  const eu = { id: 'u1', nome: 'Ana Teste' }
  const bia = { id: 'u2', nome: 'Bia Teste' }
  const opcoes = opcoesDeResponsavel(etapaDe('x'), [bia, eu], 'u1')
  expect(opcoes.map((opcao) => opcao.rotulo)).toEqual(['Ana Teste (você)', 'Bia Teste', 'Ninguém por enquanto'])
  expect(opcoes.at(-1)?.valor).toBe('')
})

test('o responsável atual que saiu da lista continua à vista; o inativo fica desabilitado', () => {
  const inativo = etapaDe('x', { responsavelId: 'u9', responsavelNome: 'Caio Teste', responsavelInativo: true })
  const opcoes = opcoesDeResponsavel(inativo, [{ id: 'u1', nome: 'Ana Teste' }], 'u1')
  expect(opcoes.map((opcao) => opcao.rotulo)).toEqual(['Ana Teste (você)', 'Caio Teste (Inativo)', 'Ninguém por enquanto'])
  expect(opcoes[1].desabilitada).toBe(true)
})

test('o sinal de cada etapa: atual, concluída, anterior, dispensada, pendente e opcional', () => {
  const etapas = [
    etapaDe('a', { status: 'concluida' }), etapaDe('b', { status: 'realizada_anteriormente' }),
    etapaDe('c', { status: 'em_andamento' }), etapaDe('d'), etapaDe('e', { obrigatoria: false }),
    etapaDe('f', { status: 'dispensada', obrigatoria: false }),
  ]
  expect(etapas.map((_, indice) => sinalDaEtapa(etapas, indice))).toEqual(
    ['concluida', 'anterior', 'atual', 'pendente', 'opcional', 'dispensada'])
})

test('o rótulo do Agora diz a posição da etapa atual, e só "Agora" sem etapa atual', () => {
  expect(rotuloDoAgora(1, 6)).toBe('Agora · etapa 2 de 6')
  expect(rotuloDoAgora(-1, 6)).toBe('Agora')
})
