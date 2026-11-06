import { expect, test } from 'vitest'
import cssBruto from './TelaDeEntrada.css?raw'

// Sem comentários: um código de cor citado num comentário não conta.
const css = cssBruto.replace(/\/\*[\s\S]*?\*\//g, '')

test('a capa usa só cores dos tokens (nenhum código de cor solto no CSS da tela)', () => {
  const soltas = css.match(/#[0-9a-f]{3,8}\b|rgba?\(/gi) ?? []
  expect(soltas, `cores soltas recebidas: ${soltas.join(', ')}; esperado só var(--...)`).toEqual([])
})

// O jsdom não calcula layout; o teste confere a regra que esconde a ilustração na janela estreita (spec, "Janela estreita").
test('abaixo de 900px a ilustração some', () => {
  const regra = /@media\s*\(max-width:\s*900px\)\s*\{[\s\S]*?\.capa-ilustracao\s*\{([^}]*)\}/.exec(css)
  expect(regra?.[1] ?? '', 'esperado .capa-ilustracao com display: none dentro de @media (max-width: 900px)').toMatch(/display:\s*none/)
})
