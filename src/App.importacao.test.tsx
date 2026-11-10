import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { chaveDoProcesso } from './importacao/chaves'
import { ImportacaoFalso } from './importacao/ImportacaoFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { CATALOGO_DE_TESTE, etapaAtualDe, umProcessoLido } from './testes/processoDaLista'
import {
  CABECALHO_DA_PLANILHA, type ParteDaLinha, csvDaPlanilha, linhaDaPlanilha,
} from './testes/planilhaDeTeste'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  // Só o relógio do Date é falso: "hoje" fixo para a data usada no lugar da que falta, sem parar os timers da tela.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 6, 12))
  window.location.hash = '#/administracao'
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

const ADMINISTRADOR = { ...USUARIO_DE_TESTE, perfil: 'administrador' as Perfil }
const TODAS_AS_ETAPAS = { mp: 'Concluído', mt: 'Concluído', ri: 'Concluído', rp: 'Concluído', vi: 'Concluído', vii: 'Concluído' }

// Linha 4: Alfa em Modelagem piloto; 5: Beta em Não iniciados; 6: Gama em Concluídos; 7: Delta em Concluídos (VII sem data).
// Alfa, Gama e Delta não têm data do piloto e Delta não tem a da publicação: a data de hoje entra, com aviso (4 avisos).
const LINHAS: ParteDaLinha[] = [
  { nome: 'Exemplo Alfa', mp: 'Concluído', obs: 'Falta o fluxo' },
  { nome: 'Exemplo Beta' },
  { area: 'ABC', macro: 'II - Orçamentário', nome: 'Exemplo Gama', ...TODAS_AS_ETAPAS, dp: '16 10 2026' },
  { area: 'ABC', macro: 'II - Orçamentário', nome: 'Exemplo Delta', ...TODAS_AS_ETAPAS },
]

function planilha(linhas: ParteDaLinha[] = LINHAS, cabecalho = CABECALHO_DA_PLANILHA): File {
  return new File([csvDaPlanilha(linhas.map(linhaDaPlanilha), ';', cabecalho)], 'produto33.csv', { type: 'text/csv' })
}

function montar(importacao = new ImportacaoFalso(), perfil: Perfil = 'administrador', processos = new ProcessosFalso()) {
  render(<App acesso={AcessoFalso.logadoComo({ ...ADMINISTRADOR, perfil })} cadastros={new CadastrosFalso()} processos={processos}
    versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} importacao={importacao} />)
  return importacao
}

async function abrirImportacao() {
  fireEvent.click(await screen.findByRole('tab', { name: 'Importação' }))
  await screen.findByRole('heading', { name: 'Importação', level: 2 })
}

async function escolher(arquivo: File) {
  fireEvent.change(screen.getByLabelText('Planilha (.csv)'), { target: { files: [arquivo] } })
}

async function ate(texto: string | RegExp) {
  return screen.findByText(texto)
}

test('a aba Importação vem depois de Planilhas, só para o administrador', async () => {
  montar()
  const abas = (await screen.findAllByRole('tab')).map((aba) => aba.textContent)
  expect(abas).toEqual(['Usuários', 'Catálogo de etapas', 'Planilhas', 'Importação'])
})

test.each<[Perfil]>([['integrante_ep'], ['consulta']])('o perfil %s não vê a aba nem a tela, nem pelo endereço direto', async (perfil) => {
  montar(new ImportacaoFalso(), perfil)
  await screen.findByText(/não permite administrar usuários/)
  expect(screen.queryByRole('tab', { name: 'Importação' })).toBeNull()
  expect(screen.queryByLabelText('Planilha (.csv)')).toBeNull()
})

test('explica as duas etapas e deixa a segunda desligada', async () => {
  montar()
  await abrirImportacao()
  expect(screen.getByText(/em duas etapas, nesta ordem: a planilha, depois os arquivos das versões/)).toBeTruthy()
  expect(screen.getByRole('heading', { name: '1. Cadastros e etapas' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: '2. Arquivos das versões' })).toBeTruthy()
  expect(await screen.findByText('Disponível depois da importação da planilha.')).toBeTruthy()
  expect(screen.queryByLabelText('Pasta DOCUMENTOS MAPEAMENTO')).toBeNull()
})

test('a prévia mostra as contagens, a etapa de cada processo, o que já existe e os avisos, sem gravar nada', async () => {
  const importacao = montar()
  importacao.existentes = { setores: ['XYZ'], macroprocessos: ['gestão de exemplos'], processos: [chaveDoProcesso('XYZ', 'Exemplo Beta')] }
  await abrirImportacao()
  await escolher(planilha())
  await ate(/Vão entrar 3 processos, 1 setor novo e 1 macroprocesso novo\. 1 processo já existe e será pulado\./)
  const linhas = within(screen.getByRole('table')).getAllByRole('row').slice(1).map((l) => l.textContent)
  expect(linhas).toEqual([
    'XYZGestão de exemplosExemplo AlfaModelagem pilotoNovo',
    'XYZGestão de exemplosExemplo BetaNão iniciadosJá existia',
    'ABCOrçamentárioExemplo GamaConcluídosNovo',
    'ABCOrçamentárioExemplo DeltaConcluídosNovo',
  ])
  expect(screen.getByRole('heading', { name: '4 avisos' })).toBeTruthy()
  expect(screen.getByText('Linha 7, Exemplo Delta: VII - Publicação concluída sem Data da Publicação: usada a data de hoje.')).toBeTruthy()
  expect(importacao.gravados).toEqual([])
})

test('um arquivo sem as colunas esperadas é recusado com os nomes que faltam', async () => {
  montar()
  await abrirImportacao()
  const semData = CABECALHO_DA_PLANILHA.map((c) => (c === 'Data da Publicação' ? 'Outra coisa' : c))
  await escolher(planilha(LINHAS, semData))
  const alerta = await screen.findByRole('alert')
  expect(alerta.textContent).toBe('Este arquivo não parece a aba PRODUTO 33: faltam as colunas Data da Publicação.')
  expect(screen.queryByRole('button', { name: 'Confirmar importação' })).toBeNull()
})

test('o que já existe na plataforma não ser lido recusa o arquivo com a frase pronta', async () => {
  const importacao = montar()
  importacao.falharAoListar = true
  await abrirImportacao()
  await escolher(planilha())
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Não foi possível ler o que já existe na plataforma (falha de teste ao ler o que já existe). Tente de novo.')
})

test('confirmar grava só o que é novo, na ordem da planilha, e mostra o resumo com os avisos', async () => {
  const importacao = montar()
  importacao.existentes.processos = [chaveDoProcesso('XYZ', 'Exemplo Beta')]
  await abrirImportacao()
  await escolher(planilha())
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmar importação' }))
  await ate('Importação concluída')
  expect(screen.getByText('3 processos criados, 1 pulado.')).toBeTruthy()
  expect(screen.getByRole('heading', { name: '4 avisos' })).toBeTruthy()
  expect(importacao.gravados.map((p) => [p.nome, p.etapaCodigo, p.dataDaPublicacao, p.anotacoes])).toEqual([
    ['Exemplo Alfa', 'modelagem', null, 'Falta o fluxo'],
    ['Exemplo Gama', 'concluidos', '2026-10-16', null],
    ['Exemplo Delta', 'concluidos', '2026-11-06', null],
  ])
  // Com a planilha importada, a segunda etapa abre (ticket 02).
  expect(await screen.findByLabelText('Pasta DOCUMENTOS MAPEAMENTO')).toBeTruthy()
})

test('com tudo já existente, [Confirmar importação] fica desligado e a tela diz por quê', async () => {
  const importacao = montar()
  importacao.existentes.processos = LINHAS.map((l) => chaveDoProcesso(l.area ?? 'XYZ', l.nome ?? ''))
  await abrirImportacao()
  await escolher(planilha())
  await ate('Nada a gravar: todos os processos da planilha já existem.')
  expect((screen.getByRole('button', { name: 'Confirmar importação' }) as HTMLButtonElement).disabled).toBe(true)
})

test('a falha no meio para a carga e diz o que já entrou e o que ficou sem tentar', async () => {
  const importacao = montar()
  importacao.falharNoProcesso = 'Exemplo Gama'
  await abrirImportacao()
  await escolher(planilha())
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmar importação' }))
  await ate('Importação interrompida')
  expect(screen.getByRole('alert').textContent).toBe(
    'A importação parou em Exemplo Gama (linha 6): falha de teste ao gravar Exemplo Gama. Entraram 2 processos antes da falha; '
    + '1 ficou sem tentar. Escolha o arquivo de novo para continuar: o que já entrou é pulado.')
  expect(importacao.gravados.map((p) => p.nome)).toEqual(['Exemplo Alfa', 'Exemplo Beta'])
})

test('rodar de novo pula o que já entrou', async () => {
  const importacao = montar()
  await abrirImportacao()
  await escolher(planilha())
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmar importação' }))
  await ate('Importação concluída')
  fireEvent.click(screen.getByRole('button', { name: 'Importar outro arquivo' }))
  await escolher(planilha())
  await ate(/Vão entrar 0 processos, 0 setores novos e 0 macroprocessos novos\. 4 processos já existem e serão pulados\./)
  expect(importacao.gravados).toHaveLength(4)
})

test('os processos importados aparecem no Quadro, na etapa certa', async () => {
  const processos = new ProcessosFalso()
  processos.etapasDoCatalogo = CATALOGO_DE_TESTE
  const importacao = new ImportacaoFalso()
  importacao.aoCriar = (p) => processos.processos.push(
    umProcessoLido(p.nome, { id: p.nome, etapaAtual: etapaAtualDe(p.etapaCodigo), responsavel: null }, p.etapaCodigo))
  montar(importacao, 'administrador', processos)
  await abrirImportacao()
  await escolher(planilha(LINHAS.slice(0, 2)))
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmar importação' }))
  await ate('Importação concluída')
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Áreas do sistema' })).getByRole('button', { name: 'Processos' }))
  const modelagem = await screen.findByRole('region', { name: 'Modelagem piloto' })
  await waitFor(() => { expect(within(modelagem).getByText('Exemplo Alfa')).toBeTruthy() })
  expect(within(screen.getByRole('region', { name: 'Não iniciados' })).getByText('Exemplo Beta')).toBeTruthy()
})

async function gravarPelaTela(linhas: ParteDaLinha[], importacao = montar()) {
  await abrirImportacao()
  await escolher(planilha(linhas))
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmar importação' }))
  await ate('Importação concluída')
  return importacao
}

function aviso(linha: number, nome: string, texto: string) {
  return screen.getByText(`Linha ${String(linha)}, ${nome}: ${texto}`)
}

test('a VII concluída com Data da Publicação ilegível vai a Concluídos com a data de hoje, com aviso', async () => {
  const importacao = await gravarPelaTela([{ nome: 'Exemplo Gama', ...TODAS_AS_ETAPAS, dmp: '01/09/2026', dp: 'outubro' }])
  expect(importacao.gravados.map((p) => [p.etapaCodigo, p.dataDaPublicacao])).toEqual([['concluidos', '2026-11-06']])
  expect(aviso(4, 'Exemplo Gama', 'Data da Publicação ilegível: usada a data de hoje.')).toBeTruthy()
})

test('a data do piloto que falta ou está ilegível vira a de hoje fora de Não iniciados; as outras regras seguem', async () => {
  const importacao = await gravarPelaTela([
    { nome: 'Exemplo Alfa', mp: 'Concluído' },
    { nome: 'Exemplo Beta', mp: 'Concluído', ri: 'Concluído', rp: 'Concluído', mt: 'Concluído', dmp: '31/02/2026' },
    { nome: 'Exemplo Gama', mp: 'Concluído', dmp: '01/09/2026' },
    { nome: 'Exemplo Delta', mp: 'Concluído', dmp: '01/01/2030' },
    { nome: 'Exemplo Épsilon', dmp: '01/09/2026', dp: '16 10 2026' },
  ])
  expect(importacao.gravados.map((p) => [p.nome, p.dataDaModelagemPiloto, p.dataDaPublicacao])).toEqual([
    ['Exemplo Alfa', '2026-11-06', null],
    ['Exemplo Beta', '2026-11-06', null],
    ['Exemplo Gama', '2026-09-01', null],
    ['Exemplo Delta', null, null],
    ['Exemplo Épsilon', null, null],
  ])
  expect(aviso(4, 'Exemplo Alfa', 'Modelagem Piloto sem data: usada a data de hoje.')).toBeTruthy()
  expect(aviso(5, 'Exemplo Beta', 'Data da Modelagem Piloto ilegível: usada a data de hoje.')).toBeTruthy()
  expect(aviso(7, 'Exemplo Delta', 'Data da Modelagem Piloto no futuro: ignorada.')).toBeTruthy()
  expect(aviso(8, 'Exemplo Épsilon', 'Data da Modelagem Piloto em processo Não iniciado: ignorada.')).toBeTruthy()
  expect(aviso(8, 'Exemplo Épsilon', 'Data da Publicação sem a VII - Publicação concluída: ignorada.')).toBeTruthy()
})

test('a sigla com barra entra com hífen e conta como o mesmo setor', async () => {
  const importacao = montar()
  importacao.existentes = { setores: ['DAE-CTL'], macroprocessos: [], processos: [chaveDoProcesso('DAE-CTL', 'Exemplo Beta')] }
  await abrirImportacao()
  await escolher(planilha([
    { area: 'DAE/CTL', nome: 'Exemplo Alfa' },
    { area: 'dae / ctl', nome: 'Exemplo Beta' },
    { area: 'DAE-CTL', nome: 'EXEMPLO ALFA' },
  ]))
  await ate(/Vão entrar 1 processo, 0 setores novos/)
  const linhas = within(screen.getByRole('table')).getAllByRole('row').slice(1).map((l) => l.textContent)
  expect(linhas).toEqual(['DAE-CTLGestão de exemplosExemplo AlfaNão iniciadosNovo', 'DAE-CTLGestão de exemplosExemplo BetaNão iniciadosJá existia'])
  expect(screen.getByText('Linha 6, DAE-CTL · EXEMPLO ALFA: repetido na planilha; vale a primeira linha.')).toBeTruthy()
})
