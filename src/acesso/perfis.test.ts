import { expect, test } from 'vitest'
import { PERFIS, rotuloDoPerfil } from './perfis'

test('cada perfil tem o rótulo que a interface mostra', () => {
  expect(rotuloDoPerfil('administrador')).toBe('Administrador')
  expect(rotuloDoPerfil('integrante_ep')).toBe('Integrante do EP')
  expect(rotuloDoPerfil('consulta')).toBe('Consulta')
})

test('os perfis vão do maior para o menor, na ordem do seletor', () => {
  expect(PERFIS).toEqual(['administrador', 'integrante_ep', 'consulta'])
})
