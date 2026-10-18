import { expect, test } from 'vitest'
import { paisPossiveis } from './paisPossiveis'
import type { ProcessoDaLista, TipoDeProcesso } from './tipos'

function item(id: string, tipo: TipoDeProcesso): ProcessoDaLista {
  return {
    id, nome: id, tipo, setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1', macroprocessoNome: 'Macro',
    processoPaiId: null, situacao: 'em_andamento', etapaAtual: null, responsavel: null,
  }
}

test('só processos do tipo Processo, sem o próprio item', () => {
  const lista = [item('p1', 'processo'), item('p2', 'subprocesso'), item('p3', 'a_classificar'), item('p4', 'processo')]
  expect(paisPossiveis(lista).map((pai) => pai.id)).toEqual(['p1', 'p4'])
  expect(paisPossiveis(lista, 'p4').map((pai) => pai.id)).toEqual(['p1'])
})
