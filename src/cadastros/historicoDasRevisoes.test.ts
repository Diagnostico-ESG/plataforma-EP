import { expect, test } from 'vitest'
import { descreverEstadoDoCadastro, nomeDoItem, textoDaAcaoDoCadastro } from './historicoDosCadastros'
import type { EventoDoCadastro } from './tipos'

// O evento que o gatilho do banco grava ao registrar a revisão (migração revisao_interna).
const REVISAO: EventoDoCadastro = {
  id: 1, ocorridoEm: '2026-10-13T15:00:00Z', autor: 'Bia Teste', acao: 'registrar', entidade: 'revisao_interna', entidadeRef: 'p1',
  antes: null,
  depois: {
    processo_nome: 'Emitir Ofício', setor_sigla: 'TSA', versao_revisada: 'V7', versao_corrigida: 'V8', resultado: 'corrigida',
    escopo: 'ambos', comentario: 'Ajustei', revisor_nome: 'Bia Teste', revisada_em: '2026-10-13',
  },
}

test('o registro da revisão tem texto próprio', () => {
  expect(textoDaAcaoDoCadastro('registrar', 'revisao_interna')).toBe('Registrou a revisão interna')
})

test('o item é a versão revisada com o processo', () => {
  expect(nomeDoItem(REVISAO)).toBe('V7 — Emitir Ofício')
})

test('o estado traz as versões, o resultado e o escopo como a tela os escreve, o revisor e a data', () => {
  expect(descreverEstadoDoCadastro(REVISAO.depois)).toBe(
    'Processo: Emitir Ofício; Setor: TSA; Versão revisada: V7; Versão corrigida: V8; Resultado: Corrigida; '
    + 'Escopo: Fluxograma e relatório; Comentário: Ajustei; Revisor: Bia Teste; Data da revisão: 13/10/2026',
  )
})

test('"sem alteração" não tem versão corrigida nem escopo: aparecem como "—"', () => {
  const semAlteracao = { ...REVISAO.depois, versao_corrigida: null, resultado: 'sem_alteracao', escopo: null, comentario: null }
  expect(descreverEstadoDoCadastro(semAlteracao)).toBe(
    'Processo: Emitir Ofício; Setor: TSA; Versão revisada: V7; Versão corrigida: —; Resultado: Sem alteração; '
    + 'Escopo: —; Comentário: —; Revisor: Bia Teste; Data da revisão: 13/10/2026',
  )
})
