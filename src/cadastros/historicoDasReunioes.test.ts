import { describe, expect, test } from 'vitest'
import { descreverEstadoDoCadastro, itensDoFiltro, nomeDoItem, textoDaAcaoDoCadastro } from './historicoDosCadastros'
import type { EventoDoCadastro } from './tipos'

const REUNIAO = {
  tipo: 'modelagem', setor_id: 's1', setor_sigla: 'TSA', data: '2026-10-14', hora: '09:30', local: 'Sala 1', anotacoes: null,
  outros_participantes: ['Ana'], processos: [{ id: 'p1', nome: 'Emitir Ofício' }, { id: 'p2', nome: 'Arquivar Pasta' }],
}

function evento(parcial: Partial<EventoDoCadastro>): EventoDoCadastro {
  return {
    id: 1, ocorridoEm: '2026-10-14T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'criar', entidade: 'reuniao', entidadeRef: 'r1',
    antes: null, depois: REUNIAO, ...parcial,
  }
}

describe('eventos de reunião no histórico', () => {
  test.each([['criar', 'Criou'], ['editar', 'Editou'], ['excluir', 'Excluiu']])('a ação %s aparece como "%s"', (acao, texto) => {
    expect(textoDaAcaoDoCadastro(acao, 'reuniao')).toBe(texto)
  })

  test('o item é a reunião, com tipo, data e setor (o depois, ou o antes quando foi excluída)', () => {
    expect(nomeDoItem(evento({}))).toBe('Reunião de modelagem de 14/10/2026 — TSA')
    expect(nomeDoItem(evento({ acao: 'excluir', antes: REUNIAO, depois: null }))).toBe('Reunião de modelagem de 14/10/2026 — TSA')
  })

  test('o estado aparece legível: tipo pelo rótulo da tela, data em dia/mês/ano, listas por nome e sem ids', () => {
    expect(descreverEstadoDoCadastro(REUNIAO)).toBe(
      'Tipo: Modelagem; Setor: TSA; Data: 14/10/2026; Hora: 09:30; Local: Sala 1; Anotações: —; '
      + 'Outros participantes: Ana; Processos: Emitir Ofício, Arquivar Pasta')
  })

  test('o tipo de reunião e o de processo não se confundem', () => {
    expect(descreverEstadoDoCadastro({ tipo: 'sensibilizacao' })).toBe('Tipo: Sensibilização')
    expect(descreverEstadoDoCadastro({ tipo: 'subprocesso' })).toBe('Tipo: Subprocesso')
  })

  test('a reunião excluída continua no filtro pelo nome', () => {
    expect(itensDoFiltro([evento({ acao: 'excluir', antes: REUNIAO, depois: null })]))
      .toEqual([{ id: 'r1', nome: 'Reunião de modelagem de 14/10/2026 — TSA' }])
  })
})
