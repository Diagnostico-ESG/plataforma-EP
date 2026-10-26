import { describe, expect, test } from 'vitest'
import { descreverEstadoDoCadastro, nomeDoItem, textoDaAcaoDoCadastro, textoDoEvento } from './historicoDosCadastros'
import type { EventoDoCadastro } from './tipos'

// O evento que o gatilho do banco grava ao enviar uma versão (migração versoes).
const ENVIO: EventoDoCadastro = {
  id: 1, ocorridoEm: '2026-10-15T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'enviar', entidade: 'versao', entidadeRef: 'p1',
  antes: null,
  depois: {
    rotulo: 'V3', processo_nome: 'Emitir Ofício', setor_sigla: 'TSA', etapa: 'Reunião de modelagem',
    arquivos: [{ papel: 'bpmn', nome: 'TSA_V3_Emitir Ofício.bpmn' }, { papel: 'png', nome: 'TSA_V3_Emitir Ofício.png' }],
  },
}

describe('eventos de versão no histórico', () => {
  test('a ação de enviar tem texto próprio', () => {
    expect(textoDaAcaoDoCadastro('enviar', 'versao')).toBe('Enviou a versão')
  })

  test('o envio da piloto tem texto próprio e traz o rótulo V6P', () => {
    expect(textoDaAcaoDoCadastro('enviar_piloto', 'versao')).toBe('Enviou a versão piloto')
    const piloto: EventoDoCadastro = { ...ENVIO, acao: 'enviar_piloto', depois: { ...ENVIO.depois, rotulo: 'V6P' } }
    expect(nomeDoItem(piloto)).toBe('V6P — Emitir Ofício')
  })

  test('o arquivo acrescentado depois diz qual é, e traz o papel no estado', () => {
    const relatorio: EventoDoCadastro = { ...ENVIO, acao: 'enviar_relatorio', depois: { ...ENVIO.depois, rotulo: 'V8', numero_do_relatorio: 3 } }
    expect(textoDoEvento(relatorio)).toBe('Enviou o Relatório V3 (acompanha a V8)')
    expect(textoDaAcaoDoCadastro('acrescentar_relatorio', 'versao')).toBe('Acrescentou o relatório à versão')
    expect(textoDaAcaoDoCadastro('sem_alteracao', 'versao')).toBe('Marcou sem alteração de conteúdo na versão')
    const acrescentou: EventoDoCadastro = { ...ENVIO, acao: 'acrescentar_arquivo', depois: { ...ENVIO.depois, papel: 'png' } }
    expect(textoDoEvento(acrescentou)).toBe('Acrescentou o .png à versão')
    expect(textoDoEvento({ ...acrescentou, depois: { ...ENVIO.depois, papel: 'bpmn' } })).toBe('Acrescentou o .bpmn à versão')
    expect(textoDoEvento(ENVIO)).toBe('Enviou a versão')
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
      depois: { rotulo: 'V5F', processo_nome: 'Emitir Ofício', setor_sigla: 'TSA', etapa: null,
        arquivos: [{ papel: 'bpm', nome: 'TSA_V5F_Emitir Ofício.bpm' }] },
    }
    expect(nomeDoItem(historica)).toBe('V5F — Emitir Ofício')
    expect(descreverEstadoDoCadastro(historica.depois)).toBe(
      'Versão: V5F; Processo: Emitir Ofício; Setor: TSA; Etapa: —; Arquivos: TSA_V5F_Emitir Ofício.bpm',
    )
  })

  test('o estado traz a versão, o processo, a etapa e os nomes dos arquivos', () => {
    expect(descreverEstadoDoCadastro(ENVIO.depois)).toBe(
      'Versão: V3; Processo: Emitir Ofício; Setor: TSA; Etapa: Reunião de modelagem; '
      + 'Arquivos: TSA_V3_Emitir Ofício.bpmn, TSA_V3_Emitir Ofício.png',
    )
  })
})

describe('evento de substituição no histórico', () => {
  const SUBSTITUICAO: EventoDoCadastro = {
    ...ENVIO, acao: 'substituir',
    antes: { nome: 'TSA_V3_Emitir Ofício.png', hash_md5: '0123456789abcdef0123456789abcdef' },
    depois: {
      rotulo: 'V3', processo_nome: 'Emitir Ofício', setor_sigla: 'TSA', nome: 'TSA_V3_Emitir Ofício.png',
      hash_md5: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    },
  }

  test('a ação de substituir tem texto próprio', () => {
    expect(textoDaAcaoDoCadastro('substituir', 'versao')).toBe('Substituiu o arquivo da versão')
  })

  test('o antes mostra o nome e o hash do que saiu, e o depois, a versão e o hash novo', () => {
    expect(descreverEstadoDoCadastro(SUBSTITUICAO.antes)).toBe(
      'Nome: TSA_V3_Emitir Ofício.png; Impressão digital (MD5): 0123456789abcdef0123456789abcdef',
    )
    expect(descreverEstadoDoCadastro(SUBSTITUICAO.depois)).toBe(
      'Versão: V3; Processo: Emitir Ofício; Setor: TSA; Nome: TSA_V3_Emitir Ofício.png; '
      + 'Impressão digital (MD5): bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    )
  })

  test('o item é a versão com o processo', () => {
    expect(nomeDoItem(SUBSTITUICAO)).toBe('V3 — Emitir Ofício')
  })
})
