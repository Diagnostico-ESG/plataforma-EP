import { expect, test } from 'vitest'
import { textoDaAcaoDoCadastro, tituloDoEvento } from './historicoDosCadastros'
import type { EventoDoCadastro } from './tipos'

// A importação dos dados atuais (ADR 0044) grava um único evento "importar" por processo, com a etapa em que ele entrou.
const IMPORTOU: EventoDoCadastro = {
  id: 1, ocorridoEm: '2026-11-06T10:00:00Z', autor: 'Pessoa Fictícia', acao: 'importar', entidade: 'processo', entidadeRef: 'p1',
  antes: null, depois: { nome: 'Exemplo Alfa', setor_sigla: 'XYZ', etapa_codigo: 'modelagem', etapa_nome: 'Modelagem piloto' },
}

test('o título do evento diz de onde veio e em que etapa o processo entrou', () => {
  expect(tituloDoEvento(IMPORTOU)).toBe('Importou da planilha para Modelagem piloto')
})

test('o texto da ação, quando só ele é pedido, é "Importou da planilha"', () => {
  expect(textoDaAcaoDoCadastro('importar', 'processo')).toBe('Importou da planilha')
})

// Ticket 02: cada versão importada da pasta grava um evento "importar" de versão, com quem importou.
test('a versão importada da pasta é "Importou a versão"', () => {
  expect(textoDaAcaoDoCadastro('importar', 'versao')).toBe('Importou a versão')
})
