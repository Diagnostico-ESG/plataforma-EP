import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import type { Perfil } from './acesso/tipos'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { ResponsavelInicialDaEtapa } from './processos/tipos'
import { abrirCatalogo, ETAPAS_DE_TESTE, montarComCatalogo } from './testes/catalogoDeTeste'

// Responsável inicial por etapa (processos-etapas, funcionalidade 17; ADR 0036): a coluna do Catálogo de etapas, onde o
// Administrador escolhe, em cada etapa, quem passa a ser o responsável de quem chega a ela.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const ANA = { id: 'u1', nome: 'Ana Teste', fotoUrl: null }
const BIA = { id: 'u2', nome: 'Bia Teste', fotoUrl: null }
const FULANO: ResponsavelInicialDaEtapa = { id: 'u9', nome: 'Fulano Teste', fotoUrl: null, ativo: true, perfil: 'integrante_ep' }

const caixa = (secao: ReturnType<typeof within>, etapa: string) =>
  secao.getByRole('combobox', { name: `Responsável inicial de ${etapa}` }) as HTMLSelectElement
const opcoes = (select: HTMLSelectElement) => [...select.options].map((opcao) => opcao.textContent ?? '')

function comResponsavelInicial(codigo: string, responsavelInicial: ResponsavelInicialDaEtapa) {
  return (processos: { catalogo: { etapas: typeof ETAPAS_DE_TESTE } }) => {
    processos.catalogo.etapas = processos.catalogo.etapas.map((etapa) => (etapa.codigo === codigo ? { ...etapa, responsavelInicial } : etapa))
  }
}

test('a coluna existe; toda etapa menos Concluídos tem a caixa, com Ninguém e os usuários em ordem de nome', async () => {
  montarComCatalogo({ ajustar: (processos) => { processos.usuariosPossiveis = [ANA, BIA] } })
  const secao = await abrirCatalogo()
  expect(secao.getByRole('columnheader', { name: 'Responsável inicial' })).toBeTruthy()
  for (const nome of ['Não iniciados', 'Modelagem piloto', 'Divulgação', 'Arquivamento']) expect(caixa(secao, nome)).toBeTruthy()
  expect(secao.queryByRole('combobox', { name: 'Responsável inicial de Concluídos' })).toBeNull()
  const linhaDeConcluidos = secao.getByRole('row', { name: /Concluídos/ })
  expect(linhaDeConcluidos.querySelectorAll('td')[2].textContent).toBe('—')
  const ordem = opcoes(caixa(secao, 'Modelagem piloto'))
  expect(ordem[0]).toContain('Ninguém')
  expect(ordem[1]).toContain('Ana Teste')
  expect(ordem[2]).toContain('Bia Teste')
})

test('escolher Ana grava e a caixa mostra Ana; Ninguém limpa', async () => {
  const processos = montarComCatalogo({ ajustar: (falso) => { falso.usuariosPossiveis = [ANA, BIA] } })
  const secao = await abrirCatalogo()
  fireEvent.change(caixa(secao, 'Modelagem piloto'), { target: { value: 'u1' } })
  await waitFor(() => expect(processos.catalogo.etapas.find((etapa) => etapa.codigo === 'modelagem')?.responsavelInicial).toMatchObject({ id: 'u1' }))
  await waitFor(() => expect(caixa(secao, 'Modelagem piloto').value).toBe('u1'))
  fireEvent.change(caixa(secao, 'Modelagem piloto'), { target: { value: '' } })
  await waitFor(() => expect(processos.catalogo.etapas.find((etapa) => etapa.codigo === 'modelagem')?.responsavelInicial).toBeNull())
  await waitFor(() => expect(caixa(secao, 'Modelagem piloto').value).toBe(''))
})

test('responsável inativo: a caixa o marca e há o aviso com texto; o nome inválido não vira opção selecionável', async () => {
  montarComCatalogo({
    ajustar: (processos) => {
      processos.usuariosPossiveis = [ANA, BIA]
      comResponsavelInicial('modelagem', { ...FULANO, ativo: false })(processos)
    },
  })
  const secao = await abrirCatalogo()
  const select = caixa(secao, 'Modelagem piloto')
  expect(select.selectedOptions[0].textContent).toContain('Fulano Teste (inativo)')
  expect(select.selectedOptions[0].disabled).toBe(true)
  expect(secao.getByText('Responsável inicial inativo: escolha outro ou Ninguém.')).toBeTruthy()
})

test('responsável que virou Consulta: "sem permissão", com o aviso', async () => {
  montarComCatalogo({
    ajustar: (processos) => {
      processos.usuariosPossiveis = [ANA]
      comResponsavelInicial('divulgacao', { ...FULANO, perfil: 'consulta' })(processos)
    },
  })
  const secao = await abrirCatalogo()
  expect(caixa(secao, 'Divulgação').selectedOptions[0].textContent).toContain('Fulano Teste (sem permissão)')
  expect(secao.getByText('Responsável inicial sem permissão: escolha outro ou Ninguém.')).toBeTruthy()
})

test('a gravação recusada mostra o motivo em alerta e a caixa volta ao valor anterior', async () => {
  const processos = montarComCatalogo({ ajustar: (falso) => { falso.usuariosPossiveis = [ANA, BIA] } })
  const secao = await abrirCatalogo()
  processos.catalogo.falhaDeGravacao = new TravaDoBanco('Bia Teste não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.')
  fireEvent.change(caixa(secao, 'Modelagem piloto'), { target: { value: 'u2' } })
  expect((await secao.findByRole('alert')).textContent).toContain('Bia Teste não pode ser responsável')
  expect(caixa(secao, 'Modelagem piloto').value).toBe('')
})

test('falha ao ler os usuários: aviso com Tentar de novo, e a caixa só tem o valor atual e Ninguém; tentar de novo recarrega', async () => {
  let falhar = true
  montarComCatalogo({
    ajustar: (processos) => {
      processos.usuariosPossiveis = [ANA, BIA]
      const lerUsuarios = processos.listarResponsaveisPossiveis.bind(processos)
      processos.listarResponsaveisPossiveis = async () => {
        if (falhar) throw new Error('x')
        return lerUsuarios()
      }
    },
  })
  const secao = await abrirCatalogo()
  expect(await secao.findByText(/Não foi possível carregar os usuários\./)).toBeTruthy()
  expect(opcoes(caixa(secao, 'Modelagem piloto')).map((texto) => texto.trim())).toEqual(['Ninguém'])
  falhar = false
  fireEvent.click(secao.getByRole('button', { name: 'Tentar de novo' }))
  await waitFor(() => expect(opcoes(caixa(secao, 'Modelagem piloto')).length).toBe(3))
})

test.each<Perfil>(['integrante_ep', 'consulta'])('o perfil %s não vê a Administração nem a coluna', async (perfil) => {
  montarComCatalogo({ perfil })
  const navegacao = await screen.findByRole('navigation', { name: 'Áreas do sistema' })
  expect(within(navegacao).queryByRole('button', { name: 'Administração' })).toBeNull()
  expect(screen.queryByRole('columnheader', { name: 'Responsável inicial' })).toBeNull()
})
