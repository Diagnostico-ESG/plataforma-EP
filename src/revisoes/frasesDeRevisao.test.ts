import { expect, test } from 'vitest'
import {
  FRASE_DA_CORRIGIDA_SEM_ENVIO_NA_PASSAGEM, FRASE_DA_REVISAO_FORA_DA_ETAPA, FRASE_DA_REVISAO_JA_REGISTRADA, FRASE_SEM_RELATORIO,
  fraseDoProcessoComRevisoes, rotuloDoResultado,
} from './frasesDeRevisao'

test('as recusas de registrar a revisão dizem onde o processo precisa estar e o que fazer', () => {
  expect(FRASE_DA_REVISAO_FORA_DA_ETAPA).toBe('Registre a revisão com o processo na Revisão do fluxograma ou na Revisão do relatório.')
  expect(FRASE_DA_REVISAO_JA_REGISTRADA).toBe('Já há uma revisão registrada nesta passagem; edite-a.')
  expect(FRASE_DA_CORRIGIDA_SEM_ENVIO_NA_PASSAGEM).toBe("Para 'corrigida', envie a versão ou o relatório corrigido com o processo nesta etapa.")
  expect(FRASE_SEM_RELATORIO).toBe('O processo ainda não tem relatório para revisar.')
})

test('a exclusão diz quantas revisões o processo tem', () => {
  expect(fraseDoProcessoComRevisoes('1')).toBe('Não é possível excluir: processo tem 1 revisão registrada. Cancele o processo em vez de excluí-lo.')
  expect(fraseDoProcessoComRevisoes(3)).toBe('Não é possível excluir: processo tem 3 revisões registradas. Cancele o processo em vez de excluí-lo.')
})

test('o resultado da corrigida cita o que ela gerou: a versão, o relatório ou os dois', () => {
  const sem = { versaoCorrigida: null, relatorioCorrigido: null }
  expect(rotuloDoResultado({ ...sem, resultado: 'sem_alteracao' })).toBe('Sem alteração')
  expect(rotuloDoResultado({ ...sem, resultado: 'corrigida', versaoCorrigida: 8 })).toBe('Corrigida, gerou a V8')
  expect(rotuloDoResultado({ ...sem, resultado: 'corrigida', relatorioCorrigido: 2 })).toBe('Corrigida, gerou o Relatório R2')
  expect(rotuloDoResultado({ resultado: 'corrigida', versaoCorrigida: 8, relatorioCorrigido: 2 })).toBe('Corrigida, gerou a V8 e o Relatório R2')
})
