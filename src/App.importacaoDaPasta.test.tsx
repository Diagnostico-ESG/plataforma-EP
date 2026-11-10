import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ImportacaoFalso } from './importacao/ImportacaoFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { umProcessoLido } from './testes/processoDaLista'
import { type ParteDaLinha, csvDaPlanilha, linhaDaPlanilha } from './testes/planilhaDeTeste'
import { VersoesFalso } from './versoes/VersoesFalso'

// Importação dos dados atuais, ticket 02: a seção "2. Arquivos das versões", com uma pasta inventada no formato de
// amostra/pasta.md. O jsdom não abre seletor de pasta nem preenche webkitRelativePath: o teste define o caminho no File.
beforeEach(() => {
  window.location.hash = '#/administracao'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const ADMINISTRADOR = { ...USUARIO_DE_TESTE, perfil: 'administrador' as Perfil }
const RAIZ = 'Documentos Mapeamento'

function daPasta(caminho: string): File {
  const arquivo = new File(['x'], caminho.split('/').at(-1) ?? caminho)
  Object.defineProperty(arquivo, 'webkitRelativePath', { value: `${RAIZ}/${caminho}` })
  return arquivo
}

// Emitir Ofício: V1F (com relatório de letra trocada), V2 completa e V4 só com relatório (sem .bpm; V3 é um buraco).
// Exemplo Alfa: V1 numa subpasta. Processo Inexistente: sem processo na plataforma. Na raiz, um arquivo fora do padrão.
const PASTA = [
  'TSA/TSA_V1F_Emitir Ofício.bpm', 'TSA/TSA_V1_Emitir Ofício_Relatório.docx',
  'TSA/TSA_V2_Emitir Ofício.bpm', 'TSA/TSA_V2_Emitir Ofício.png', 'TSA/TSA_V2_Emitir Ofício_Relatório.docx',
  'TSA/TSA_V2_Emitir Ofício_Relatório.pdf', 'TSA/TSA_V4_Emitir Ofício_Relatório.docx',
  'TSA/Grupo/TSA_V1_Exemplo Alfa.bpm', 'TSA/TSA_V1_Processo Inexistente.bpm', 'log_renomeacao.csv',
]
const LINHAS: ParteDaLinha[] = [{ area: 'TSA', nome: 'Emitir Ofício', v: [1, 2] }, { area: 'TSA', nome: 'Exemplo Alfa', v: [1] }]

function planilha(): File {
  return new File([csvDaPlanilha(LINHAS.map(linhaDaPlanilha))], 'produto33.csv', { type: 'text/csv' })
}

function montar(haImportado = true) {
  const versoes = new VersoesFalso()
  const importacao = new ImportacaoFalso(versoes)
  importacao.haImportado = haImportado
  importacao.processosDaPasta = [
    { id: 'p1', chave: 'TSA|emitir ofício', nome: 'Emitir Ofício' },
    { id: 'p2', chave: 'TSA|exemplo alfa', nome: 'Exemplo Alfa' },
  ]
  const processos = new ProcessosFalso()
  processos.processos = [umProcessoLido('Emitir Ofício', { id: 'p1' })]
  render(<App acesso={AcessoFalso.logadoComo(ADMINISTRADOR)} cadastros={new CadastrosFalso()} processos={processos}
    versoes={versoes} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} importacao={importacao} />)
  return { importacao, versoes }
}

async function abrirSecao() {
  fireEvent.click(await screen.findByRole('tab', { name: 'Importação' }))
  return within(await screen.findByRole('region', { name: '2. Arquivos das versões' }))
}

async function escolherPastaEPlanilha(secao: ReturnType<typeof within>, caminhos = PASTA) {
  fireEvent.change(await secao.findByLabelText('Pasta DOCUMENTOS MAPEAMENTO'), { target: { files: caminhos.map(daPasta) } })
  fireEvent.change(secao.getByLabelText('Planilha (.csv) para comparar'), { target: { files: [planilha()] } })
}

test('sem importação da planilha, a seção fica fechada e diz por quê', async () => {
  montar(false)
  const secao = await abrirSecao()
  expect(await secao.findByText('Disponível depois da importação da planilha.')).toBeTruthy()
  expect(secao.queryByLabelText('Pasta DOCUMENTOS MAPEAMENTO')).toBeNull()
})

test('a prévia mostra, por processo, o que entra e o que fica de fora, sem enviar nada', async () => {
  const { versoes } = montar()
  const secao = await abrirSecao()
  await escolherPastaEPlanilha(secao)
  expect(await secao.findByText('Vão entrar 3 versões de 2 processos (7 arquivos).')).toBeTruthy()
  const linhas = within(secao.getByRole('table')).getAllByRole('row').slice(1).map((l) => l.textContent)
  expect(linhas).toEqual(['Emitir OfícioV1F, V2V1F, V2—', 'Exemplo AlfaV1——'])
  const fora = within(secao.getByRole('region', { name: '3 fora da importação' }))
  expect(fora.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'Emitir Ofício V4: sem .bpm.',
    'TSA · Processo Inexistente (V1): sem processo na plataforma com essa sigla e esse nome.',
    `${RAIZ}/log_renomeacao.csv: fora do padrão do nome.`,
  ])
  expect(versoes.versoes).toEqual({})
})

test('enviar leva as versões ao processo e o resumo traz os avisos e as lacunas', async () => {
  const { importacao, versoes } = montar()
  const secao = await abrirSecao()
  await escolherPastaEPlanilha(secao)
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar arquivos' }))
  expect(await secao.findByText('Envio concluído')).toBeTruthy()
  expect(secao.getByText('3 versões criadas, 0 puladas.')).toBeTruthy()
  const avisos = within(secao.getByRole('region', { name: '2 avisos' }))
  expect(avisos.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'Emitir Ofício V1F: arquivo com letra diferente da do .bpm; entrou na V1F.',
    'Exemplo Alfa: arquivos da subpasta Grupo; anotado nas Anotações.',
  ])
  const lacunas = within(secao.getByRole('region', { name: '2 lacunas' }))
  expect(lacunas.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'Emitir Ofício: falta a V3 na numeração da pasta.',
    'Emitir Ofício V4: na pasta e não na planilha.',
  ])
  expect(versoes.versoes.p1.map((v) => [v.numero, v.historica, v.arquivos.map((a) => a.nome)])).toEqual([
    [1, true, ['TSA_V1F_Emitir Ofício.bpm', 'TSA_V1F_Emitir Ofício_Relatório.docx']],
    [2, false, ['TSA_V2_Emitir Ofício.bpm', 'TSA_V2_Emitir Ofício.png', 'TSA_V2_Emitir Ofício_Relatório V1.docx']],
  ])
  expect(importacao.anexosImportados).toEqual([{ processoId: 'p1', nome: 'TSA_V2_Emitir Ofício_Relatório.pdf' }])
  expect(importacao.subpastasAnotadas).toEqual([{ processoId: 'p2', subpasta: 'Grupo' }])
})

test('a falha de um arquivo fica no resumo, as outras versões entram, e a segunda rodada envia só o que faltou', async () => {
  const { importacao } = montar()
  importacao.falharNoArquivo = 'TSA_V2_Emitir Ofício.png'
  const secao = await abrirSecao()
  await escolherPastaEPlanilha(secao)
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar arquivos' }))
  expect(await secao.findByText('Envio com falhas')).toBeTruthy()
  expect(secao.getByText('2 versões criadas, 0 puladas.')).toBeTruthy()
  expect(secao.getByRole('alert').textContent).toContain('Emitir Ofício V2: o arquivo TSA_V2_Emitir Ofício.png não chegou ao Drive')
  importacao.falharNoArquivo = null
  fireEvent.click(secao.getByRole('button', { name: 'Importar de novo' }))
  await escolherPastaEPlanilha(secao)
  expect(await secao.findByText('Vão entrar 1 versão de 1 processo (4 arquivos). 2 versões já existem e serão puladas.')).toBeTruthy()
  fireEvent.click(secao.getByRole('button', { name: 'Enviar arquivos' }))
  expect(await secao.findByText('1 versão criada, 2 puladas.')).toBeTruthy()
})

test('com tudo já importado, não há o que enviar e a tela diz por quê', async () => {
  const { versoes } = montar()
  const secao = await abrirSecao()
  await escolherPastaEPlanilha(secao)
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar arquivos' }))
  await secao.findByText('Envio concluído')
  fireEvent.click(secao.getByRole('button', { name: 'Importar de novo' }))
  await escolherPastaEPlanilha(secao)
  expect(await secao.findByText('Nada a enviar: todas as versões da pasta já existem.')).toBeTruthy()
  expect((secao.getByRole('button', { name: 'Enviar arquivos' }) as HTMLButtonElement).disabled).toBe(true)
  expect(versoes.versoes.p1).toHaveLength(2)
})

test('a versão importada abre no processo como qualquer outra, com o nome padrão', async () => {
  montar()
  const secao = await abrirSecao()
  await escolherPastaEPlanilha(secao)
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar arquivos' }))
  await secao.findByText('Envio concluído')
  window.location.hash = '#/processos/p1'
  const painel = within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
  const documentos = within(await painel.findByRole('region', { name: 'Documentos do Mapeamento' }))
  const v2 = within(await documentos.findByRole('article', { name: 'V2' }))
  expect(v2.getAllByRole('link').map((link) => link.getAttribute('title'))).toContain('TSA_V2_Emitir Ofício.bpm')
})

test('durante o envio, a tela mostra quantos arquivos já foram e quantos são', async () => {
  const { importacao } = montar()
  importacao.segurarDepoisDe = 'TSA_V2_Emitir Ofício.bpm'
  const secao = await abrirSecao()
  await escolherPastaEPlanilha(secao)
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar arquivos' }))
  expect(await secao.findByText('Enviando… 3 de 7 arquivos.')).toBeTruthy()
})

test('dois relatórios na mesma versão: a versão entra sem relatório, com aviso no resumo', async () => {
  const { versoes } = montar()
  const secao = await abrirSecao()
  await escolherPastaEPlanilha(secao, [
    'TSA/TSA_V1_Emitir Ofício.bpm', 'TSA/TSA_V1_Emitir Ofício_Relatório.docx', 'TSA/TSA_V1F_Emitir Ofício_Relatório.docx',
  ])
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar arquivos' }))
  const avisos = within(await secao.findByRole('region', { name: '1 aviso' }))
  expect(avisos.getByRole('listitem').textContent).toBe('Emitir Ofício V1: dois arquivos de relatório .docx; nenhum dos dois entrou.')
  expect(versoes.versoes.p1[0].arquivos.map((a) => a.papel)).toEqual(['bpm'])
})
