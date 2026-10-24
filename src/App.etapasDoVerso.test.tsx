import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { formatarData } from './lib/datas'
import type { EtapaDoVerso } from './processos/tipos'
import { CATALOGO_DE_TESTE } from './testes/processoDaLista'
import { diasAtras, montarVerso, processoLido } from './testes/processoNoVerso'
import { agoraDoVerso, etapasDoVerso, gavetaDaEtapa } from './testes/versoDoCartao'

// As Etapas do verso (ticket 25 de processos-etapas, Andamento livre): as etapas ativas só para leitura, com a atual
// destacada, as visitadas marcadas e a gaveta das entradas e saídas, uma por vez.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const NOMES = CATALOGO_DE_TESTE.map((etapa) => etapa.nome)

// O processo está em Revisão interna desde há 3 dias; passou pela Modelagem piloto duas vezes e pelo Relatório uma vez.
const passagens = (): EtapaDoVerso[] => CATALOGO_DE_TESTE.map(({ id, codigo, nome, ordem }) => ({ id, codigo, nome, ordem, passagens: [] }))
  .map((etapa) => {
    if (etapa.codigo === 'nao_iniciados') return { ...etapa, passagens: [{ entrouEm: '2026-09-28', saiuEm: '2026-10-01' }] }
    if (etapa.codigo === 'modelagem') {
      return { ...etapa, passagens: [{ entrouEm: '2026-10-06', saiuEm: '2026-10-08' }, { entrouEm: '2026-10-01', saiuEm: '2026-10-04' }] }
    }
    if (etapa.codigo === 'relatorio_modelagem_tecnica') return { ...etapa, passagens: [{ entrouEm: '2026-10-04', saiuEm: '2026-10-06' }] }
    if (etapa.codigo === 'revisao_interna') return { ...etapa, passagens: [{ entrouEm: diasAtras(3), saiuEm: null }] }
    return etapa
  })

const montar = (perfil: 'integrante_ep' | 'consulta' = 'integrante_ep', mudancas = {}) =>
  montarVerso(processoLido({ entrouNaEtapaEm: diasAtras(3), etapasDoVerso: passagens(), ...mudancas }), perfil)

test('lista só as etapas ativas, na ordem do catálogo, de Não iniciados a Concluídos', async () => {
  montar()
  const linhas = (await etapasDoVerso()).getAllByRole('listitem')
  expect(linhas.map((linha) => linha.querySelector('.etapa-nome')?.textContent)).toEqual(NOMES)
})

test('a etapa desativada não aparece', async () => {
  montarVerso(processoLido(), 'integrante_ep', [], (falso) => {
    falso.etapasDoCatalogo = CATALOGO_DE_TESTE.map((etapa) => (etapa.codigo === 'publicacao' ? { ...etapa, ativa: false } : etapa))
  })
  const nomes = (await etapasDoVerso()).getAllByRole('listitem').map((linha) => linha.querySelector('.etapa-nome')?.textContent)
  expect(nomes).not.toContain('Publicação')
  expect(nomes).toHaveLength(7)
})

test('cada linha diz se é a atual, uma etapa visitada (com a data da última saída) ou uma que o processo nunca visitou', async () => {
  montar()
  const etapas = await etapasDoVerso()
  expect(etapas.getAllByRole('button').map((linha) => linha.getAttribute('aria-label'))).toEqual([
    'Não iniciados: visitada', 'Modelagem piloto: visitada', 'Relatório e modelagem técnica: visitada', 'Revisão interna: atual',
    'Validação com o setor: ainda não visitada', 'Aprovação pelo setor: ainda não visitada', 'Publicação: ainda não visitada',
    'Concluídos: ainda não visitada',
  ])
  const quando = (nome: string) => etapas.getByRole('button', { name: new RegExp(`^${nome}:`) }).querySelector('.etapa-quando')?.textContent
  expect(quando('Modelagem piloto')).toBe('08/10/2026')
  expect(quando('Não iniciados')).toBe('01/10/2026')
  expect(quando('Revisão interna')).toBe(`desde ${formatarData(diasAtras(3))}`)
  expect(quando('Publicação')).toBe('')
})

test('só a atual está marcada como passo atual', async () => {
  montar()
  const atuais = (await etapasDoVerso()).getAllByRole('listitem').filter((linha) => linha.getAttribute('aria-current') === 'step')
  expect(atuais.map((linha) => linha.querySelector('.etapa-nome')?.textContent)).toEqual(['Revisão interna'])
})

test('a gaveta abre uma por vez, pelo botão da linha, com o estado anunciado', async () => {
  montar()
  const etapas = await etapasDoVerso()
  const modelagem = etapas.getByRole('button', { name: 'Modelagem piloto: visitada' })
  const relatorio = etapas.getByRole('button', { name: 'Relatório e modelagem técnica: visitada' })
  expect(modelagem.getAttribute('aria-expanded')).toBe('false')
  fireEvent.click(modelagem)
  expect(modelagem.getAttribute('aria-expanded')).toBe('true')
  expect(document.getElementById(modelagem.getAttribute('aria-controls') as string)).toBeTruthy()
  fireEvent.click(relatorio)
  expect(modelagem.getAttribute('aria-expanded')).toBe('false')
  expect(relatorio.getAttribute('aria-expanded')).toBe('true')
  fireEvent.click(relatorio)
  expect(relatorio.getAttribute('aria-expanded')).toBe('false')
})

test('a gaveta mostra as entradas e saídas, da mais recente para a mais antiga', async () => {
  montar()
  const gaveta = await gavetaDaEtapa('Modelagem piloto')
  expect(gaveta.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'Entrou em 06/10/2026 · saiu em 08/10/2026', 'Entrou em 01/10/2026 · saiu em 04/10/2026',
  ])
})

test('a gaveta da etapa atual mostra a entrada e que o processo ainda está nela', async () => {
  montar()
  const gaveta = await gavetaDaEtapa('Revisão interna')
  expect(gaveta.getByText(`Entrou em ${formatarData(diasAtras(3))} · ainda nesta etapa`)).toBeTruthy()
})

test('a gaveta de uma etapa nunca visitada diz que o processo ainda não passou por ela', async () => {
  montar()
  expect((await gavetaDaEtapa('Publicação')).getByText('Ainda não passou por esta etapa')).toBeTruthy()
})

test('a gaveta não tem botões do modelo anterior: nada de corrigir datas, voltar, responsável ou nota', async () => {
  montar()
  const gaveta = await gavetaDaEtapa('Modelagem piloto')
  expect(gaveta.queryByRole('button', { name: /Corrigir datas|Voltar a esta etapa|Assumir|Trocar/ })).toBeNull()
  expect(gaveta.queryByText(/^Responsável|^Nota:|^Início:/)).toBeNull()
})

test('a Consulta e o suspenso leem as mesmas gavetas', async () => {
  montar('consulta')
  expect((await gavetaDaEtapa('Modelagem piloto')).getAllByRole('listitem')).toHaveLength(2)
  cleanup()
  montar('integrante_ep', { situacao: 'suspenso', motivoDaSituacao: 'Aguardando decisão' })
  expect((await gavetaDaEtapa('Modelagem piloto')).getAllByRole('listitem')).toHaveLength(2)
})

test('cada linha é um botão nativo, que abre e fecha pelo teclado (Enter e Espaço) com o estado anunciado', async () => {
  montar()
  const linhas = (await etapasDoVerso()).getAllByRole('button')
  expect(linhas).toHaveLength(8)
  for (const linha of linhas) {
    expect(linha.tagName).toBe('BUTTON')
    expect(linha.getAttribute('type')).toBe('button')
    expect(linha.hasAttribute('aria-expanded')).toBe(true)
  }
})

test('mover o processo pelo Agora atualiza a seção Etapas: a nova atual, e a antiga passa a visitada', async () => {
  montar()
  fireEvent.change((await agoraDoVerso()).getByRole('combobox', { name: 'Etapa' }), { target: { value: 'e6' } })
  const etapas = await etapasDoVerso()
  expect(await etapas.findByRole('button', { name: 'Aprovação pelo setor: atual' })).toBeTruthy()
  expect(etapas.getByRole('button', { name: 'Revisão interna: visitada' })).toBeTruthy()
  expect(screen.queryByText('Revisão interna: atual')).toBeNull()
})
