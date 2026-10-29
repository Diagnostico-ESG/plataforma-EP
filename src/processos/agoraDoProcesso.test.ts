import { describe, expect, test } from 'vitest'
import { etapaAtualDe } from '../testes/processoDaLista'
import { avisoDoRevisor, fraseDaSituacaoParada, nomeDoResponsavel, ondeEstaOProcesso, opcoesDeResponsavel, podeAssumir, rotuloDoAgora } from './agoraDoProcesso'
import type { ProcessoLido, UltimaVersao, UsuarioResponsavel } from './tipos'

const ANA: UsuarioResponsavel = { id: 'u1', nome: 'Ana Teste', fotoUrl: 'https://fotos.exemplo/ana.png' }
const BIA: UsuarioResponsavel = { id: 'u2', nome: 'Bia Teste' }

function lido(mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro',
    processoPaiId: null, situacao: 'em_andamento', etapaAtual: etapaAtualDe('revisao_interna'), etiqueta: 'em_andamento',
    entrouNaEtapaEm: '2026-10-10', responsavel: { id: 'u1', nome: 'Ana Teste', fotoUrl: null },
    motivoDaSituacao: null, processoPai: null, subprocessos: [], etapasDoVerso: [], dataDaModelagemPiloto: null,
    ultimaVersao: null, ...mudancas,
  }
}

const versao = (autorId: string): UltimaVersao => ({ numero: 4, autorId, autorNome: 'Ana Teste', papeis: [] })

test('o rótulo do Agora diz a posição entre as etapas ativas', () => {
  expect(rotuloDoAgora(4, 8)).toBe('Agora · etapa 4 de 8')
})

describe('opcoesDeResponsavel', () => {
  test('quem está na tela primeiro, com "(você)"; os demais; Ninguém por último', () => {
    const opcoes = opcoesDeResponsavel(lido(), [ANA, BIA], 'u2')
    expect(opcoes.map((opcao) => opcao.rotulo)).toEqual(['Bia Teste (você)', 'Ana Teste', 'Ninguém por enquanto'])
    expect(opcoes.at(-1)?.valor).toBe('')
  })

  test('cada pessoa leva o nome sem o "(você)" e a foto para o Avatar; Ninguém não leva', () => {
    const opcoes = opcoesDeResponsavel(lido(), [ANA, BIA], 'u1')
    expect(opcoes[0].pessoa).toEqual({ nome: 'Ana Teste', fotoUrl: 'https://fotos.exemplo/ana.png' })
    expect(opcoes[1].pessoa).toEqual({ nome: 'Bia Teste', fotoUrl: null })
    expect(opcoes.at(-1)?.pessoa).toBeUndefined()
  })

  test('o responsável desativado aparece marcado "(Inativo)" e não se escolhe de novo', () => {
    const inativo = lido({ responsavel: { id: 'u9', nome: 'Caio Antigo', fotoUrl: null }, cartao: { responsavelAtivo: false, ultimaVersao: null, subprocessos: 0 } })
    const opcao = opcoesDeResponsavel(inativo, [ANA], 'u1').find((o) => o.valor === 'u9')
    expect(opcao).toEqual({ valor: 'u9', rotulo: 'Caio Antigo (Inativo)', desabilitada: true, pessoa: { nome: 'Caio Antigo', fotoUrl: null } })
  })

  test('sem responsável não há opção extra', () => {
    expect(opcoesDeResponsavel(lido({ responsavel: null }), [ANA], 'u1')).toHaveLength(2)
  })
})

test('[Assumir] aparece sempre que quem está na tela não é o responsável', () => {
  expect(podeAssumir(lido(), 'u2')).toBe(true)
  expect(podeAssumir(lido({ responsavel: null }), 'u1')).toBe(true)
  expect(podeAssumir(lido(), 'u1')).toBe(false)
})

describe('avisoDoRevisor', () => {
  test('na Revisão interna, com o responsável que enviou a versão mais recente', () => {
    expect(avisoDoRevisor(lido({ ultimaVersao: versao('u1') }))).toBe('Ana Teste enviou a V4; a revisão interna deveria ser de outra pessoa.')
  })

  test('some quando o responsável é outro, quando não há versão ou fora da Revisão interna', () => {
    expect(avisoDoRevisor(lido({ ultimaVersao: versao('u2') }))).toBeNull()
    expect(avisoDoRevisor(lido({ ultimaVersao: null }))).toBeNull()
    expect(avisoDoRevisor(lido({ ultimaVersao: versao('u1'), responsavel: null }))).toBeNull()
    expect(avisoDoRevisor(lido({ ultimaVersao: versao('u1'), etapaAtual: etapaAtualDe('modelagem') }))).toBeNull()
  })
})

describe('fraseDaSituacaoParada', () => {
  test('etapa, etiqueta, responsável e dias', () => {
    expect(fraseDaSituacaoParada(lido(), '2026-10-16')).toBe('Em Revisão interna · Iniciado · com Ana Teste há 6 dias')
  })

  test('depois de 7 dias a frase não repete os dias (o selo âmbar os diz)', () => {
    expect(fraseDaSituacaoParada(lido({ entrouNaEtapaEm: '2026-10-01' }), '2026-10-16')).toBe('Em Revisão interna · Iniciado · com Ana Teste')
  })

  test('sem responsável', () => {
    expect(fraseDaSituacaoParada(lido({ responsavel: null, etiqueta: 'a_fazer' }), '2026-10-16')).toBe('Em Revisão interna · A fazer · sem responsável')
  })

  test('em Não iniciados e em Concluídos não há dias', () => {
    const fixa = lido({ etapaAtual: etapaAtualDe('nao_iniciados') })
    expect(fraseDaSituacaoParada(fixa, '2026-10-16')).toBe('Em Não iniciados · Iniciado · com Ana Teste')
  })
})

test('ondeEstaOProcesso: só a etapa e a etiqueta, sem o responsável', () => {
  expect(ondeEstaOProcesso(lido())).toBe('Em Revisão interna · Iniciado')
  expect(ondeEstaOProcesso(lido({ etiqueta: undefined, responsavel: null }))).toBe('Em Revisão interna · A fazer')
})

describe('nomeDoResponsavel', () => {
  test('o nome, "(Inativo)" para quem foi desativado, e null sem ninguém', () => {
    expect(nomeDoResponsavel(lido())).toBe('Ana Teste')
    expect(nomeDoResponsavel(lido({ cartao: { responsavelAtivo: false, ultimaVersao: null, subprocessos: 0 } }))).toBe('Ana Teste (Inativo)')
    expect(nomeDoResponsavel(lido({ responsavel: null }))).toBeNull()
  })
})
