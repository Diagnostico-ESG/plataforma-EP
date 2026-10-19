import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { formatarData } from './processos/caminhoDeEtapas'
import { BIA, EU, diasAtras, etapaDoProcesso, montarVerso, processoLido } from './testes/processoNoVerso'
import { etapasDoVerso, gavetaDaEtapa } from './testes/versoDoCartao'

// As Etapas do verso (ticket 17 de processos-etapas): linhas compactas e a gaveta do detalhe, uma por vez.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const MODELAGEM = 'Modelagem piloto'
const RELATORIO = 'Relatório e modelagem técnica'
const EXTRA = 'Extra'
const REVISAO = 'Revisão interna'
const APROVACAO = 'Aprovação'
const PUBLICACAO = 'Publicação'

// Uma etapa de cada status; a Revisão interna é a atual.
const caminho = () => [
  etapaDoProcesso(1, 'modelagem', MODELAGEM, {
    status: 'concluida', iniciadaEm: '2026-10-01', resolvidaEm: '2026-10-02', nota: 'Feito', responsavelId: BIA.id, responsavelNome: BIA.nome,
  }),
  etapaDoProcesso(2, 'relatorio', RELATORIO, { status: 'realizada_anteriormente', resolvidaEm: '2026-10-03', nota: 'Feita em 2025' }),
  etapaDoProcesso(3, 'extra', EXTRA, { status: 'dispensada', obrigatoria: false, resolvidaEm: '2026-10-04', nota: 'Não se aplica' }),
  etapaDoProcesso(4, 'revisao_interna', REVISAO, { status: 'em_andamento', iniciadaEm: diasAtras(3), responsavelId: EU.id, responsavelNome: EU.nome }),
  etapaDoProcesso(5, 'aprovacao', APROVACAO),
  etapaDoProcesso(6, 'publicacao', PUBLICACAO, { obrigatoria: false }),
]

test('cada linha tem o nome acessível do status, e os selos e a data aparecem', async () => {
  montarVerso(processoLido(caminho()))
  const etapas = await etapasDoVerso()
  expect(etapas.getAllByRole('button').map((linha) => linha.getAttribute('aria-label'))).toEqual([
    'Modelagem piloto: concluída', 'Relatório e modelagem técnica: realizada anteriormente', 'Extra: dispensada',
    'Revisão interna: atual', 'Aprovação: pendente', 'Publicação: opcional, pendente',
  ])
  for (const selo of ['anterior', 'dispensada', 'opcional']) expect(etapas.getByText(selo)).toBeTruthy()
  expect(etapas.getByText(`desde ${formatarData(diasAtras(3))}`)).toBeTruthy()
  expect(etapas.getByText('02/10/2026')).toBeTruthy()
})

test('a gaveta abre uma por vez, pelo botão da linha, com o estado anunciado', async () => {
  montarVerso(processoLido(caminho()))
  const etapas = await etapasDoVerso()
  const modelagem = etapas.getByRole('button', { name: `${MODELAGEM}: concluída` })
  const relatorio = etapas.getByRole('button', { name: `${RELATORIO}: realizada anteriormente` })
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

test('a gaveta de uma resolvida anterior à atual mostra datas, nota e responsável, com Corrigir datas e Voltar a esta etapa', async () => {
  montarVerso(processoLido(caminho()))
  const gaveta = await gavetaDaEtapa(MODELAGEM)
  expect(gaveta.getByText('Início: 01/10/2026 · Conclusão: 02/10/2026')).toBeTruthy()
  expect(gaveta.getByText('Nota: Feito')).toBeTruthy()
  expect(gaveta.getByText(`Responsável: ${BIA.nome}`)).toBeTruthy()
  fireEvent.click(gaveta.getByRole('button', { name: 'Corrigir datas' }))
  expect(gaveta.getByLabelText(`Início da etapa ${MODELAGEM}`)).toBeTruthy()
  fireEvent.click(gaveta.getByRole('button', { name: 'Voltar a esta etapa' }))
  expect(screen.getByRole('dialog', { name: `Voltar à etapa ${MODELAGEM}?` })).toBeTruthy()
})

test('Corrigir datas grava e a gaveta mostra a data nova', async () => {
  const falso = montarVerso(processoLido(caminho()))
  const gaveta = await gavetaDaEtapa(MODELAGEM)
  fireEvent.click(gaveta.getByRole('button', { name: 'Corrigir datas' }))
  fireEvent.change(gaveta.getByLabelText(`Conclusão da etapa ${MODELAGEM}`), { target: { value: '2026-10-05' } })
  fireEvent.click(gaveta.getByRole('button', { name: 'Salvar datas' }))
  expect(await gaveta.findByText('Início: 01/10/2026 · Conclusão: 05/10/2026')).toBeTruthy()
  expect(falso.chamadas).toHaveLength(1)
})

test('a gaveta da atual mostra só datas e nota, com Corrigir datas; o responsável e as ações ficam no Agora', async () => {
  montarVerso(processoLido(caminho()))
  const gaveta = await gavetaDaEtapa(REVISAO)
  expect(gaveta.getByText(new RegExp(`^Início: ${formatarData(diasAtras(3))}`))).toBeTruthy()
  expect(gaveta.queryByText(/^Responsável/)).toBeNull()
  expect(gaveta.getAllByRole('button').map((botao) => botao.textContent)).toContain('Corrigir datas')
  for (const nome of ['Voltar a esta etapa', 'Assumir', 'Trocar']) expect(gaveta.queryByRole('button', { name: new RegExp(nome) })).toBeNull()
})

test('a gaveta de uma pendente depois da atual tem Trocar e Assumir', async () => {
  const falso = montarVerso(processoLido(caminho()))
  const gaveta = await gavetaDaEtapa(APROVACAO)
  fireEvent.click(gaveta.getByRole('button', { name: `Trocar o responsável de ${APROVACAO}` }))
  fireEvent.change(gaveta.getByRole('combobox', { name: `Responsável de ${APROVACAO}` }), { target: { value: BIA.id } })
  expect(await gaveta.findByText(`Responsável: ${BIA.nome}`)).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'responsavel', id: 'a5', usuarioId: BIA.id }])
  const outra = await gavetaDaEtapa(PUBLICACAO)
  fireEvent.click(outra.getByRole('button', { name: `Assumir ${PUBLICACAO}` }))
  expect(await outra.findByText(`Responsável: ${EU.nome}`)).toBeTruthy()
})

test('suspenso: as gavetas mostram só a leitura, sem botões', async () => {
  montarVerso(processoLido(caminho(), { situacao: 'suspenso', motivoDaSituacao: 'Aguardando decisão' }))
  for (const nome of [MODELAGEM, APROVACAO, REVISAO]) {
    const gaveta = await gavetaDaEtapa(nome)
    expect(gaveta.getAllByRole('button')).toHaveLength(1)
  }
  expect((await gavetaDaEtapa(APROVACAO)).getByText('Responsável: —')).toBeTruthy()
  expect(screen.queryByText(/Retome-o para registrar o andamento/)).toBeNull()
})

test('a Consulta lê as gavetas sem botões', async () => {
  montarVerso(processoLido(caminho()), 'consulta')
  const gaveta = await gavetaDaEtapa(MODELAGEM)
  expect(gaveta.getByText(`Responsável: ${BIA.nome}`)).toBeTruthy()
  expect(gaveta.getAllByRole('button')).toHaveLength(1)
  expect(within(await (await etapasDoVerso()).findByRole('list')).getAllByRole('listitem')).toHaveLength(6)
})
