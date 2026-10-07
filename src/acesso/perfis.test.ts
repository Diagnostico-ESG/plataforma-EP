import { expect, test } from 'vitest'
import { rotuloDoPerfil } from './perfis'

test('cada perfil tem o rótulo que a interface mostra', () => {
  expect(rotuloDoPerfil('administrador')).toBe('Administrador')
  expect(rotuloDoPerfil('integrante_ep')).toBe('Integrante do EP')
  expect(rotuloDoPerfil('consulta')).toBe('Consulta')
})
