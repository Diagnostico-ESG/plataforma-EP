import { describe, expect, test } from 'vitest'
import { descreverEstadoDoCadastro, nomeDoItem, textoDaAcaoDoCadastro, textoDoEvento, tituloDoEvento } from './historicoDosCadastros'
import type { EventoDoCadastro } from './tipos'

// O evento que o gatilho do banco grava ao enviar um anexo (migração anexos).
const ENVIO: EventoDoCadastro = {
  id: 1, ocorridoEm: '2026-10-26T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'enviar', entidade: 'anexo', entidadeRef: 'p1',
  antes: null,
  depois: { nome: 'resposta.eml', formato: 'eml', etapa: 'Modelagem piloto', processo_nome: 'Emitir Ofício', setor_sigla: 'TSA' },
}

describe('eventos de anexo no histórico', () => {
  test('o envio diz o nome do anexo e a etapa em que o processo estava', () => {
    expect(textoDoEvento(ENVIO)).toBe("Enviou o anexo 'resposta.eml' (Modelagem piloto)")
    expect(tituloDoEvento(ENVIO)).toBe('Enviou o anexo')
  })

  test('sem a etapa no evento, o texto fica sem os parênteses', () => {
    expect(textoDoEvento({ ...ENVIO, depois: { ...ENVIO.depois, etapa: null } })).toBe("Enviou o anexo 'resposta.eml'")
  })

  test('o texto da ação sozinha é "Enviou o anexo"; ação desconhecida aparece pelo código', () => {
    expect(textoDaAcaoDoCadastro('enviar', 'anexo')).toBe('Enviou o anexo')
    expect(textoDaAcaoDoCadastro('coisa_nova', 'anexo')).toBe('coisa_nova')
  })

  test('o item é o processo dono dos anexos', () => {
    expect(nomeDoItem(ENVIO)).toBe('Anexos — Emitir Ofício')
  })

  test('o estado descrito traz o nome, o formato, a etapa e o processo, com rótulos de tela', () => {
    const texto = descreverEstadoDoCadastro(ENVIO.depois)
    for (const parte of ['Nome: resposta.eml', 'Formato: eml', 'Etapa: Modelagem piloto', 'Processo: Emitir Ofício']) {
      expect(texto).toContain(parte)
    }
  })
})
