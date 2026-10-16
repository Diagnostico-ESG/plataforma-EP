import { describe, expect, test } from 'vitest'
import { descreverEstadoDoCadastro, nomeDoItem, textoDaAcaoDoCadastro } from './historicoDosCadastros'
import type { EventoDoCadastro } from './tipos'

// O evento que o gatilho do banco grava ao enviar uma versão (migração versoes).
const ENVIO: EventoDoCadastro = {
  id: 1, ocorridoEm: '2026-10-15T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'enviar', entidade: 'versao', entidadeRef: 'p1',
  antes: null,
  depois: {
    rotulo: 'V3', processo_nome: 'Emitir Ofício', setor_sigla: 'TSA', etapa: 'Reunião de modelagem', observacao: 'Ajustada',
    arquivos: [{ papel: 'bpmn', nome: 'TSA_V3_Emitir Ofício.bpmn' }, { papel: 'png', nome: 'TSA_V3_Emitir Ofício.png' }],
  },
}

describe('eventos de versão no histórico', () => {
  test('a ação de enviar tem texto próprio', () => {
    expect(textoDaAcaoDoCadastro('enviar', 'versao')).toBe('Enviou a versão')
  })

  test('o item é a versão com o processo', () => {
    expect(nomeDoItem(ENVIO)).toBe('V3 — Emitir Ofício')
  })

  test('o estado traz a versão, o processo, a etapa, a observação e os nomes dos arquivos', () => {
    expect(descreverEstadoDoCadastro(ENVIO.depois)).toBe(
      'Versão: V3; Processo: Emitir Ofício; Setor: TSA; Etapa: Reunião de modelagem; Observação: Ajustada; '
      + 'Arquivos: TSA_V3_Emitir Ofício.bpmn, TSA_V3_Emitir Ofício.png',
    )
  })
})
