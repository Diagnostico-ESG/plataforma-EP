import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { Avatar, AvatarVazio } from './Avatar'

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

test('a foto é pedida sem informar o site de origem', () => {
  render(<Avatar nome="Pessoa de Teste" fotoUrl="/foto.png" />)
  expect(screen.getByRole('img', { name: 'Pessoa de Teste' }).getAttribute('referrerpolicy')).toBe('no-referrer')
})

test('se a foto não carrega, mostra as iniciais', () => {
  render(<Avatar nome="Pessoa de Teste" fotoUrl="/foto-quebrada.png" />)
  fireEvent.error(screen.getByRole('img', { name: 'Pessoa de Teste' }))
  expect(screen.getByRole('img', { name: 'Pessoa de Teste' }).textContent).toBe('PT')
})

test('o avatar dos outros usuários é cinza; o do próprio usuário mantém o azul', () => {
  render(<><Avatar nome="Pessoa de Teste" /><Avatar nome="Eu Mesmo" proprio /></>)
  expect(screen.getByRole('img', { name: 'Pessoa de Teste' }).className).not.toContain('avatar-proprio')
  expect(screen.getByRole('img', { name: 'Eu Mesmo' }).className).toContain('avatar-proprio')
})

test('sem responsável mostra um círculo tracejado com esse nome acessível', () => {
  render(<AvatarVazio tamanho={32} />)
  const vazio = screen.getByRole('img', { name: 'Sem responsável' })
  expect(vazio.className).toContain('avatar-vazio')
  expect(vazio.style.width).toBe('32px')
})
