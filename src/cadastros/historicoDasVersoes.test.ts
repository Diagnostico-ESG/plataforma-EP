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

  test('o registro da histórica tem texto próprio', () => {
    expect(textoDaAcaoDoCadastro('registrar_historica', 'versao')).toBe('Registrou a versão histórica')
  })

  test('o relatório depois e o "sem alteração" têm texto próprio', () => {
    expect(textoDaAcaoDoCadastro('acrescentar_relatorio', 'versao')).toBe('Acrescentou o relatório à versão')
    expect(textoDaAcaoDoCadastro('sem_alteracao', 'versao')).toBe('Marcou sem alteração de conteúdo na versão')
  })

  test('o estado do "sem alteração" diz de qual versão veio o relatório', () => {
    const semAlteracao = { ...ENVIO.depois, rotulo: 'V3', relatorio_de: 'V2' }
    expect(descreverEstadoDoCadastro(semAlteracao)).toMatch(/; Relatório copiado da versão: V2$/)
  })

  test('o item é a versão com o processo', () => {
    expect(nomeDoItem(ENVIO)).toBe('V3 — Emitir Ofício')
  })

  test('o item da histórica é a V5F com o processo, e o estado mostra "—" na etapa, que ela não tem', () => {
    const historica: EventoDoCadastro = {
      ...ENVIO, acao: 'registrar_historica',
      depois: { rotulo: 'V5F', processo_nome: 'Emitir Ofício', setor_sigla: 'TSA', etapa: null, observacao: null,
        arquivos: [{ papel: 'bpm', nome: 'TSA_V5F_Emitir Ofício.bpm' }] },
    }
    expect(nomeDoItem(historica)).toBe('V5F — Emitir Ofício')
    expect(descreverEstadoDoCadastro(historica.depois)).toBe(
      'Versão: V5F; Processo: Emitir Ofício; Setor: TSA; Etapa: —; Observação: —; Arquivos: TSA_V5F_Emitir Ofício.bpm',
    )
  })

  test('o estado traz a versão, o processo, a etapa, a observação e os nomes dos arquivos', () => {
    expect(descreverEstadoDoCadastro(ENVIO.depois)).toBe(
      'Versão: V3; Processo: Emitir Ofício; Setor: TSA; Etapa: Reunião de modelagem; Observação: Ajustada; '
      + 'Arquivos: TSA_V3_Emitir Ofício.bpmn, TSA_V3_Emitir Ofício.png',
    )
  })
})
