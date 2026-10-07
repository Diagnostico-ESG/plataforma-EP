import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { Avatar } from './Avatar'

afterEach(cleanup)

test('sem foto mostra as iniciais com o nome completo como rótulo', () => {
  render(<Avatar nome="Pessoa de Teste" />)
  const avatar = screen.getByRole('img', { name: 'Pessoa de Teste' })
  expect(avatar.textContent).toBe('PT')
})

test('com foto mostra a imagem com o nome como texto alternativo', () => {
  render(<Avatar nome="Pessoa de Teste" fotoUrl="/foto.png" />)
  const foto = screen.getByRole('img', { name: 'Pessoa de Teste' })
  expect(foto.getAttribute('src')).toBe('/foto.png')
})
