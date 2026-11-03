import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { expect, test } from 'vitest'
import { OpcaoDaCaixa } from './OpcaoDaCaixa'

function caixa(opcao: ReactElement) {
  render(<select aria-label="Caixa">{opcao}</select>)
}

test('com pessoa, a opção leva o Avatar mas o nome acessível é só o rótulo', () => {
  caixa(<OpcaoDaCaixa valor="u1" rotulo="Ana Teste (você)" pessoa={{ nome: 'Ana Teste', fotoUrl: 'https://fotos.exemplo/ana.png' }} />)
  expect((screen.getByRole('option', { name: 'Ana Teste (você)' }) as HTMLOptionElement).value).toBe('u1')
  expect(document.querySelector('option img')?.getAttribute('src')).toBe('https://fotos.exemplo/ana.png')
})

test('sem foto, o Avatar cai nas iniciais', () => {
  caixa(<OpcaoDaCaixa valor="u2" rotulo="Bia Teste" pessoa={{ nome: 'Bia Teste', fotoUrl: null }} />)
  expect(document.querySelector('option .avatar-iniciais')?.getAttribute('data-iniciais')).toBe('BT')
  expect(screen.getByRole('option', { name: 'Bia Teste' }).textContent).toBe('Bia Teste')
  expect(screen.getByRole('option', { name: 'Bia Teste' })).toBeTruthy()
})

test('sem marca, é só o texto; desabilitada vale como na opção comum', () => {
  caixa(<OpcaoDaCaixa valor="" rotulo="Todos" desabilitada />)
  const opcao = screen.getByRole('option', { name: 'Todos' }) as HTMLOptionElement
  expect(opcao.disabled).toBe(true)
  expect(opcao.querySelector('.opcao-marca')).toBeNull()
})

test('corDoSetor põe o quadradinho na cor lisa do setor e não entra no nome da opção', () => {
  caixa(<OpcaoDaCaixa valor="s1" rotulo="TSA — Setor Teste A" corDoSetor={13} />)
  const opcao = screen.getByRole('option', { name: 'TSA — Setor Teste A' })
  const marca = opcao.querySelector<HTMLElement>('.opcao-cor')
  expect(marca?.getAttribute('aria-hidden')).toBe('true')
  expect(marca?.style.getPropertyValue('--cor-do-setor')).toBe('#881337')
})
