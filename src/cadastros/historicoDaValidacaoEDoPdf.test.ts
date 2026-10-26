import { expect, test } from 'vitest'
import { descreverEstadoDoCadastro, nomeDoItem, textoDoEvento, tituloDoEvento } from './historicoDosCadastros'
import type { EventoDoCadastro } from './tipos'

// Os eventos da data da validação e do .pdf da aprovação (migração data_da_validacao_e_pdf_da_aprovacao).

function evento(acao: string, entidade: string, antes: EventoDoCadastro['antes'], depois: EventoDoCadastro['depois']): EventoDoCadastro {
  return { id: 1, ocorridoEm: '2026-10-13T15:00:00Z', autor: 'Bia Teste', acao, entidade, entidadeRef: 'p1', antes, depois }
}

const DATA = { nome: 'Emitir Ofício', setor_sigla: 'TSA', data_da_validacao: '2026-10-10' }

test.each([
  ['registrar_data_da_validacao', 'processo', 'Registrou a data da validação'],
  ['alterar_data_da_validacao', 'processo', 'Alterou a data da validação'],
  ['enviar_pdf', 'aprovacao', 'Enviou o .pdf da aprovação'],
  ['substituir_pdf', 'aprovacao', 'Substituiu o .pdf da aprovação'],
])('a ação %s de %s tem o texto "%s"', (acao, entidade, texto) => {
  expect(textoDoEvento(evento(acao, entidade, null, DATA))).toBe(texto)
  expect(tituloDoEvento(evento(acao, entidade, null, DATA))).toBe(texto)
})

test('a data da validação sai em DD/MM/AAAA, e vazia aparece como traço', () => {
  const apagada = evento('alterar_data_da_validacao', 'processo', DATA, { ...DATA, data_da_validacao: null })
  expect(descreverEstadoDoCadastro(apagada.antes)).toBe('Nome: Emitir Ofício; Setor: TSA; Data da validação: 10/10/2026')
  expect(descreverEstadoDoCadastro(apagada.depois)).toBe('Nome: Emitir Ofício; Setor: TSA; Data da validação: —')
  expect(nomeDoItem(apagada)).toBe('TSA — Emitir Ofício')
})

test('o evento do .pdf nomeia o item pela versão aprovada e o processo', () => {
  const enviado = evento('enviar_pdf', 'aprovacao', null, {
    processo_nome: 'Emitir Ofício', setor_sigla: 'TSA', versao: 'V8', nome: 'TSA_V8_Emitir Ofício_Aprovação.pdf', hash_md5: 'aaaa',
  })
  expect(nomeDoItem(enviado)).toBe('V8 — Emitir Ofício')
})

test('na troca da aprovação, o .pdf guardado aparece pelo nome e o identificador dele não aparece', () => {
  const troca = evento('substituir', 'aprovacao', { versao: 'V7', pdf_id: 'pdf1', pdf_nome: 'TSA_V7_Emitir Ofício_Aprovação.pdf' }, { versao: 'V8' })
  expect(descreverEstadoDoCadastro(troca.antes)).toBe('Versão aprovada: V7; .pdf da aprovação: TSA_V7_Emitir Ofício_Aprovação.pdf')
})
