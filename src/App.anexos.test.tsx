import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { etapaAtualDe } from './testes/processoDaLista'
import { anexoDeTeste, arquivoComTamanho, secaoDeAnexos } from './testes/anexosDeTeste'
import { montarNosCadastros, naEtapa } from './testes/processosNosCadastros'
import type { AnexosFalso } from './anexos/AnexosFalso'
import type { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
  URL.createObjectURL = vi.fn(() => 'blob:arquivo')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(window, 'open').mockImplementation(() => ({ location: { href: '' }, close: vi.fn() }) as unknown as Window)
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.location.hash = ''
})

const comAnexos = (...anexos: ReturnType<typeof anexoDeTeste>[]) => ({
  ajustarVersoes: (falso: VersoesFalso) => { falso.anexos.anexos.p1 = anexos },
})
const comAjuste = (ajuste: (anexos: AnexosFalso, versoes: VersoesFalso) => void, etapa = 'modelagem') => ({
  ajustarProcessos: naEtapa(etapa),
  ajustarVersoes: (falso: VersoesFalso) => ajuste(falso.anexos, falso),
})

async function abrirFormulario() {
  const secao = await secaoDeAnexos()
  fireEvent.click(await secao.findByRole('button', { name: 'Enviar anexo' }))
  return { secao, form: within(await secao.findByRole('form', { name: 'Enviar anexo' })) }
}

type Form = Awaited<ReturnType<typeof abrirFormulario>>['form']

const escolher = (form: Form, arquivo: File) => fireEvent.change(form.getByLabelText('Anexo'), { target: { files: [arquivo] } })
const botaoEnviar = (form: Form) => form.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement
const eml = (nome = 'resposta.eml') => new File(['de: setor'], nome)

test.each([
  ['nao_iniciados', 'Não iniciados'], ['modelagem', 'Modelagem piloto'], ['revisao_setor', 'Validação com o setor'],
  ['concluidos', 'Concluídos'],
])('a seção "Outros anexos" aparece em %s, abaixo das versões', async (codigo) => {
  montarNosCadastros({ ajustarProcessos: naEtapa(codigo) })
  const secao = await secaoDeAnexos()
  expect(secao.getByRole('heading', { name: 'Outros anexos' })).toBeTruthy()
  const versoes = screen.getByRole('region', { name: 'Arquivos' })
  const anexos = screen.getByRole('region', { name: 'Outros anexos' })
  expect(versoes.compareDocumentPosition(anexos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

test('sem anexo, a seção diz "Nenhum anexo."', async () => {
  montarNosCadastros()
  expect((await secaoDeAnexos()).getByText('Nenhum anexo.')).toBeTruthy()
})

test('enquanto lê, mostra "Carregando…"', async () => {
  montarNosCadastros(comAjuste((falso) => { falso.segurarLeitura = true }))
  expect((await (await secaoDeAnexos()).findByRole('status')).textContent).toBe('Carregando…')
})

test('se a leitura falha, o erro tem [Tentar de novo] e a lista volta quando a conexão volta', async () => {
  const { versoes } = montarNosCadastros(comAjuste((falso) => { falso.falharLeitura = true; falso.anexos.p1 = [anexoDeTeste(1, 'resposta.eml')] }))
  const secao = await secaoDeAnexos()
  expect((await secao.findByRole('alert')).textContent).toContain('Não foi possível carregar os anexos')
  expect(secao.queryByText('resposta.eml')).toBeNull()
  versoes.anexos.falharLeitura = false
  fireEvent.click(secao.getByRole('button', { name: 'Tentar de novo' }))
  expect(await secao.findByText('resposta.eml')).toBeTruthy()
})

test('a lista traz o nome, a etapa, o autor e a data, do mais recente ao mais antigo', async () => {
  montarNosCadastros(comAnexos(anexoDeTeste(1, 'primeiro.pdf', { etapa: 'Não iniciados' }), anexoDeTeste(3, 'terceiro.xlsx'), anexoDeTeste(2, 'segundo.png')))
  const secao = await secaoDeAnexos()
  const linhas = await secao.findAllByRole('listitem')
  expect(linhas.map((linha) => linha.textContent)).toEqual([
    expect.stringContaining('terceiro.xlsx'), expect.stringContaining('segundo.png'), expect.stringContaining('primeiro.pdf'),
  ])
  expect(linhas[0].textContent).toContain('Modelagem piloto')
  expect(linhas[0].textContent).toContain('Ana Teste')
  expect(linhas[0].textContent).toContain('13/10/2026')
  expect(linhas[2].textContent).toContain('Não iniciados')
})

test('[Enviar anexo] abre o formulário com o campo nativo de arquivo e fecha pelo mesmo botão', async () => {
  montarNosCadastros()
  const { secao, form } = await abrirFormulario()
  const campo = form.getByLabelText('Anexo') as HTMLInputElement
  expect(campo.type).toBe('file')
  expect(campo.accept).toBe('.pdf,.docx,.xlsx,.png,.jpg,.jpeg,.eml')
  expect(botaoEnviar(form).disabled).toBe(true)
  const abrir = secao.getByRole('button', { name: 'Enviar anexo' })
  expect(abrir.getAttribute('aria-expanded')).toBe('true')
  fireEvent.click(abrir)
  expect(secao.queryByRole('form', { name: 'Enviar anexo' })).toBeNull()
})

test('enviar: mostra o nome que será gravado, envia, fecha o formulário e põe a linha nova com a etapa', async () => {
  const { versoes } = montarNosCadastros(comAjuste(() => {}))
  const { secao, form } = await abrirFormulario()
  escolher(form, eml())
  expect(await form.findByText('Será gravado como: resposta.eml')).toBeTruthy()
  fireEvent.click(botaoEnviar(form))
  const linha = (await secao.findAllByRole('listitem'))[0]
  expect(linha.textContent).toContain('resposta.eml')
  expect(linha.textContent).toContain('Modelagem piloto')
  expect(secao.queryByRole('form', { name: 'Enviar anexo' })).toBeNull()
  expect(versoes.anexos.envios.map((pedido) => [pedido.processoId, pedido.arquivo.name])).toEqual([['p1', 'resposta.eml']])
})

test('durante o envio mostra "Enviando 1 de 1…" e trava o campo', async () => {
  montarNosCadastros(comAjuste((falso) => { falso.segurarEnvio = true }))
  const { form } = await abrirFormulario()
  escolher(form, eml())
  fireEvent.click(botaoEnviar(form))
  expect((await form.findByRole('status')).textContent).toBe('Enviando 1 de 1…')
  expect(form.getByLabelText('Anexo').matches(':disabled')).toBe(true)
})

test('extensão fora da lista é recusada antes do envio, com a frase do recebido e do esperado', async () => {
  const { versoes } = montarNosCadastros()
  const { form } = await abrirFormulario()
  escolher(form, new File(['x'], 'programa.exe'))
  expect(await form.findByText('O anexo precisa ser .pdf, .docx, .xlsx, .png, .jpg, .jpeg ou .eml; recebido: .exe.')).toBeTruthy()
  expect(botaoEnviar(form).disabled).toBe(true)
  expect(versoes.anexos.envios).toEqual([])
})

test('arquivo maior que 20 MB é recusado antes do envio, dizendo o tamanho', async () => {
  const { versoes } = montarNosCadastros()
  const { form } = await abrirFormulario()
  escolher(form, arquivoComTamanho('grande.pdf', 25 * 1024 * 1024 + 512 * 1024))
  expect(await form.findByText('O anexo pode ter até 20 MB; recebido: 25,5 MB.')).toBeTruthy()
  expect(botaoEnviar(form).disabled).toBe(true)
  expect(versoes.anexos.envios).toEqual([])
})

test('escolher outro arquivo depois da recusa libera o envio', async () => {
  montarNosCadastros()
  const { form } = await abrirFormulario()
  escolher(form, new File(['x'], 'programa.exe'))
  await form.findByText(/recebido: \.exe/)
  escolher(form, eml())
  await waitFor(() => expect(botaoEnviar(form).disabled).toBe(false))
})

test('falha do envio: mostra o motivo em vermelho e mantém o arquivo escolhido para tentar de novo', async () => {
  const { versoes } = montarNosCadastros(comAjuste((falso) => { falso.falhaNoEnvio = 'Drive fora do ar' }))
  const { secao, form } = await abrirFormulario()
  escolher(form, eml())
  fireEvent.click(botaoEnviar(form))
  expect((await form.findByRole('alert')).textContent).toBe('Não foi possível enviar o anexo: Drive fora do ar.')
  expect(form.getByText('Será gravado como: resposta.eml')).toBeTruthy()
  expect(botaoEnviar(form).disabled).toBe(false)
  versoes.anexos.falhaNoEnvio = null
  fireEvent.click(botaoEnviar(form))
  await waitFor(() => expect(secao.queryByRole('form', { name: 'Enviar anexo' })).toBeNull())
  expect(secao.getByText('resposta.eml')).toBeTruthy()
})

test('recusa do servidor chega com a frase pronta', async () => {
  montarNosCadastros(comAjuste((falso) => { falso.falhaNoEnvio = new TravaDoBanco('Seu perfil não permite enviar anexos.') }))
  const { form } = await abrirFormulario()
  escolher(form, eml())
  fireEvent.click(botaoEnviar(form))
  expect((await form.findByRole('alert')).textContent).toBe('Seu perfil não permite enviar anexos.')
})

test('dois anexos com o mesmo nome convivem na lista', async () => {
  montarNosCadastros(comAjuste(() => {}))
  for (let vez = 0; vez < 2; vez += 1) {
    const { form } = await abrirFormulario()
    escolher(form, eml())
    await waitFor(() => expect(botaoEnviar(form).disabled).toBe(false))
    fireEvent.click(botaoEnviar(form))
    await waitFor(() => expect(screen.queryByRole('form', { name: 'Enviar anexo' })).toBeNull())
  }
  expect(await (await secaoDeAnexos()).findAllByText('resposta.eml')).toHaveLength(2)
})

test('o anexo guarda a etapa do envio, que não muda quando o processo anda', async () => {
  const { processos } = montarNosCadastros(comAjuste(() => {}, 'nao_iniciados'))
  const primeiro = await abrirFormulario()
  escolher(primeiro.form, eml('um.pdf'))
  await waitFor(() => expect(botaoEnviar(primeiro.form).disabled).toBe(false))
  fireEvent.click(botaoEnviar(primeiro.form))
  await primeiro.secao.findByText('um.pdf')
  processos.processos = processos.processos.map((processo) => (processo.id === 'p1' ? { ...processo, etapaAtual: etapaAtualDe('revisao_setor') } : processo))
  const segundo = await abrirFormulario()
  escolher(segundo.form, eml('dois.pdf'))
  await waitFor(() => expect(botaoEnviar(segundo.form).disabled).toBe(false))
  fireEvent.click(botaoEnviar(segundo.form))
  await segundo.secao.findByText('dois.pdf')
  const linhas = await segundo.secao.findAllByRole('listitem')
  expect(linhas.map((linha) => [linha.textContent?.includes('dois.pdf'), linha.textContent?.includes('Validação com o setor')])).toEqual([[true, true], [false, false]])
  expect(linhas[1].textContent).toContain('Não iniciados')
})

test('baixar pede o arquivo pelo id, com o nome original', async () => {
  const { versoes } = montarNosCadastros(comAnexos(anexoDeTeste(1, 'resposta.eml')))
  const secao = await secaoDeAnexos()
  fireEvent.click(await secao.findByRole('link', { name: 'Baixar resposta.eml' }))
  await waitFor(() => expect(versoes.baixados).toEqual(['an1']))
})

test('falha ao baixar mostra o aviso na linha, sem tirar o anexo da lista', async () => {
  montarNosCadastros({
    ajustarVersoes: (falso) => { falso.anexos.anexos.p1 = [anexoDeTeste(1, 'resposta.eml')]; falso.falharNoDownload = true },
  })
  const secao = await secaoDeAnexos()
  fireEvent.click(await secao.findByRole('link', { name: 'Baixar resposta.eml' }))
  expect((await secao.findByRole('alert')).textContent).toBe('Não foi possível baixar resposta.eml: falha de conexão simulada.')
  expect(secao.getByText('resposta.eml')).toBeTruthy()
})

test('a conferência marca o anexo sumido e o alterado fora da plataforma, como nas versões', async () => {
  montarNosCadastros({
    ajustarVersoes: (falso) => {
      falso.anexos.anexos.p1 = [anexoDeTeste(1, 'sumiu.pdf'), anexoDeTeste(2, 'mudou.pdf'), anexoDeTeste(3, 'certo.pdf')]
      falso.conferencia = { an1: 'nao_encontrado', an2: 'alterado' }
    },
  })
  const secao = await secaoDeAnexos()
  const linhas = await secao.findAllByRole('listitem')
  await waitFor(() => expect(linhas.map((linha) => linha.textContent)).toEqual([
    expect.not.stringMatching(/Não encontrado|Alterado/), expect.stringContaining('Alterado fora da plataforma'),
    expect.stringContaining('Não encontrado no Drive'),
  ]))
})

test('a conferência que falha avisa, e a lista continua', async () => {
  montarNosCadastros({
    ajustarVersoes: (falso) => { falso.anexos.anexos.p1 = [anexoDeTeste(1, 'resposta.eml')]; falso.falharConferencia = true },
  })
  const secao = await secaoDeAnexos()
  expect(await secao.findByText('Não foi possível conferir os anexos no Drive.')).toBeTruthy()
  expect(secao.getByText('resposta.eml')).toBeTruthy()
})
