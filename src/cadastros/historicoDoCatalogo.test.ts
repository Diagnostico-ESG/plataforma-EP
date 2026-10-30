import { describe, expect, test } from 'vitest'
import { descreverEstadoDoCadastro, nomeDoItem, textoDaAcaoDoCadastro } from './historicoDosCadastros'
import type { EventoDoCadastro } from './tipos'

const ETAPA = { codigo: 'publicacao', nome: 'Publicação', nivel: 'processo', obrigatoria: false, fase: 'VII', ativa: true, ordem: 9 }

function evento(parcial: Partial<EventoDoCadastro>): EventoDoCadastro {
  return {
    id: 1, ocorridoEm: '2026-10-14T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'acrescentar', entidade: 'etapa',
    entidadeRef: 'e9', antes: null, depois: ETAPA, ...parcial,
  }
}

describe('catálogo de etapas no histórico', () => {
  test.each([
    ['acrescentar', 'Acrescentou a etapa ao catálogo'], ['mudar_ordem', 'Mudou a ordem do catálogo'],
    ['desativar', 'Desativou a etapa'], ['reativar', 'Reativou a etapa'], ['editar', 'Editou'], ['excluir', 'Excluiu'],
  ])('a ação %s', (acao, texto) => {
    expect(textoDaAcaoDoCadastro(acao, 'etapa')).toBe(texto)
  })

  test('o item é o código e o nome da etapa; a excluída usa o antes', () => {
    expect(nomeDoItem(evento({}))).toBe('publicacao — Publicação')
    expect(nomeDoItem(evento({ acao: 'excluir', antes: ETAPA, depois: null }))).toBe('publicacao — Publicação')
  })

  test('o estado mostra nível, obrigatória, situação e posição pelos rótulos da tela', () => {
    expect(descreverEstadoDoCadastro(ETAPA)).toBe(
      'Código: publicacao; Nome: Publicação; Nível: Processo; Obrigatória: Não; Fase: VII; Situação: Ativa; Posição: 9')
    expect(descreverEstadoDoCadastro({ ...ETAPA, nivel: 'setor', obrigatoria: true, ativa: false }))
      .toContain('Nível: Setor; Obrigatória: Sim; Fase: VII; Situação: Inativa')
  })

  test('a mudança de fase aparece no antes e no depois; evento antigo, sem fase, segue legível', () => {
    expect(descreverEstadoDoCadastro({ ...ETAPA, fase: 'V' })).toContain('Fase: V;')
    expect(descreverEstadoDoCadastro({ ...ETAPA, fase: 'VI' })).toContain('Fase: VI;')
    const antigo: Record<string, unknown> = { ...ETAPA }
    delete antigo.fase
    expect(descreverEstadoDoCadastro(antigo)).not.toContain('Fase')
  })
})

describe('responsável inicial da etapa no histórico', () => {
  test('aparece pelo nome, "Ninguém" para o vazio, e o id fica escondido', () => {
    const antes = { ...ETAPA, responsavel_inicial_id: null, responsavel_inicial_nome: null }
    const depois = { ...ETAPA, responsavel_inicial_id: 'u1', responsavel_inicial_nome: 'Ana Teste' }
    expect(descreverEstadoDoCadastro(antes)).toContain('Responsável inicial: Ninguém')
    expect(descreverEstadoDoCadastro(depois)).toContain('Responsável inicial: Ana Teste')
    expect(descreverEstadoDoCadastro(depois)).not.toContain('u1')
  })
})
