import { cleanup, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { ProcessoLido } from './processos/tipos'
import { cartaoDe, dia, montar, processo } from './testes/quadroDeTeste'

// A coluna Concluídos do Quadro, o selo "Sem publicação" e o responsável dos concluídos (Andamento livre: Concluídos é uma
// etapa como as outras; a janela da chegada e o registro da publicação são do ticket 04 de publicacao-e-arquivamento).

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const EU = { id: USUARIO_DE_TESTE.id, nome: USUARIO_DE_TESTE.nome, fotoUrl: null }

function concluido(nome: string, mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return processo(nome, {
    etapa: 'concluidos', processo: { situacao: 'concluido', etiqueta: 'concluido', responsavel: null, publicadoEm: dia(-2), ...mudancas },
  })
}

const concluidos = () => screen.getByRole('region', { name: 'Concluídos' })
const nomesEm = (coluna: HTMLElement) => Array.from(coluna.querySelectorAll('.cartao-nome')).map((nome) => nome.textContent)

test('a coluna Concluídos fica no fim do Quadro, sempre, com a frase quando vazia', async () => {
  window.location.hash = '#/processos'
  montar([processo('Em Curso')])
  await cartaoDe('Em Curso')
  const colunas = screen.getAllByRole('region').filter((regiao) => regiao.classList.contains('coluna'))
  expect(colunas.at(-1)?.getAttribute('aria-label')).toBe('Concluídos')
  expect(within(concluidos()).getByText('Nenhum processo concluído.')).toBeTruthy()
})

test('Concluídos traz os concluídos por nome, com os filtros do Quadro, e o arquivado fica de fora', async () => {
  window.location.hash = '#/processos?setor=s1'
  montar([
    concluido('Zeta'), concluido('alfa'), concluido('Outro Setor', { setorId: 's2', setorSigla: 'TSB' }),
    concluido('Guardado', { arquivadoEm: '2026-10-20T12:00:00Z' }),
  ])
  await cartaoDe('Zeta')
  expect(nomesEm(concluidos())).toEqual(['alfa', 'Zeta'])
})

test('o cartão de Concluídos mostra a etiqueta Concluído e o responsável que moveu o processo até lá', async () => {
  window.location.hash = '#/processos'
  montar([concluido('Pronto', { responsavel: EU })])
  const cartao = await cartaoDe('Pronto')
  expect(cartao.textContent).toContain('Concluído')
  expect(within(cartao).getByRole('img', { name: EU.nome })).toBeTruthy()
})

test('o concluído sem a data da publicação tem o selo Sem publicação; o publicado, não', async () => {
  window.location.hash = '#/processos'
  montar([concluido('Sem Publicar', { publicadoEm: null }), concluido('Publicado')])
  expect(within(await cartaoDe('Sem Publicar')).getByText('Sem publicação')).toBeTruthy()
  expect(within(await cartaoDe('Publicado')).queryByText('Sem publicação')).toBeNull()
})

test('"Só os meus" e o agrupamento por responsável incluem os concluídos que têm responsável', async () => {
  window.location.hash = `#/processos?responsavel=${EU.id}`
  montar([concluido('Pronto', { responsavel: EU }), processo('Meu', { processo: { responsavel: EU } }), concluido('De Outra', {
    responsavel: { id: 'u9', nome: 'Outra Pessoa', fotoUrl: null },
  })])
  await cartaoDe('Meu')
  expect(nomesEm(concluidos())).toEqual(['Pronto'])
  cleanup()
  window.location.hash = '#/processos?agrupar=responsavel'
  montar([concluido('Pronto', { responsavel: EU }), processo('Meu', { processo: { responsavel: EU } })])
  await cartaoDe('Meu')
  const daPessoa = within(screen.getByRole('region', { name: EU.nome }))
  expect(daPessoa.getAllByRole('link').map((cartao) => cartao.textContent).join(' ')).toContain('Pronto')
})
