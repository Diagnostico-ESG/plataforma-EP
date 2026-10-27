import { expect, test } from 'vitest'
import { tituloDoEvento } from './historicoDosCadastros'
import type { EventoDoCadastro } from './tipos'

// A Confirmação de arquivos no histórico (ADR 0028): o evento do movimento guarda em depois.sem_arquivos o que faltava.
const ANTES = { processo_nome: 'Emitir Ofício', etapa_codigo: 'revisao_interna', etapa_nome: 'Revisão interna' }
const PILOTO = { etapa_codigo: 'modelagem', etapa_nome: 'Modelagem piloto', pecas: ['versao_piloto'] }
const tecnica = (...pecas: string[]) => ({ etapa_codigo: 'relatorio_modelagem_tecnica', etapa_nome: 'Relatório e modelagem técnica', pecas })

function titulo(...etapas: object[]): string {
  const evento: EventoDoCadastro = {
    id: 1, ocorridoEm: '2026-10-27T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'mover', entidade: 'passagem', entidadeRef: 'p1', antes: ANTES,
    depois: { processo_nome: 'Emitir Ofício', etapa_codigo: 'revisao_interna', etapa_nome: 'Revisão interna', sem_arquivos: etapas },
  }
  return tituloDoEvento(evento)
}

test('uma etapa: diz para onde foi e o que faltou, sem repetir o nome da etapa', () => {
  expect(titulo(tecnica('relatorio'))).toBe('Moveu para Revisão interna sem o relatório')
  expect(titulo(tecnica('versao'))).toBe('Moveu para Revisão interna sem a versão')
  expect(titulo(tecnica('versao', 'relatorio'))).toBe('Moveu para Revisão interna sem a versão e o relatório')
  expect(titulo(PILOTO)).toBe('Moveu para Revisão interna sem a versão piloto')
})

test('as duas etapas: a lista traz o nome de cada uma', () => {
  expect(titulo(PILOTO, tecnica('versao', 'relatorio'))).toBe(
    'Moveu para Revisão interna sem a versão piloto (Modelagem piloto) e sem a versão e o relatório (Relatório e modelagem técnica)',
  )
})

test('lista vazia ou ausente: o título de sempre', () => {
  expect(titulo()).toBe('Moveu de Revisão interna para Revisão interna')
})
