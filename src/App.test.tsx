import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'

afterEach(cleanup)

test('o contador soma um a cada clique', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /count is 0/i }))
  expect(screen.getByRole('button', { name: /count is 1/i })).toBeTruthy()
})
