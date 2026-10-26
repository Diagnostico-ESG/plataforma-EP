import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { agoraDoVerso, escolherNoMenuDoProcesso, gavetaDaEtapa, janelaPorCima, versoAberto } from './testes/versoDoCartao'
import { APROVACAO, montar, versao } from './testes/aprovacaoNoVerso'
import { aprovadaComPdf, arquivoPdf, ligarHistoricoDasVersoes } from './testes/pdfDaAprovacaoNoVerso'

// O .pdf protocolado da aprovação (ticket 06 de revisoes-aprovacao, histórias 54 a 62): enviado junto com o registro da
// aprovação ou depois, na gaveta; substituído com a confirmação; guardado quando a aprovação é trocada; com as marcas da
// conferência; sem botões para a Consulta e para o processo arquivado.

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const NOME_DO_PDF = 'TSA_V8_Emitir Ofício_Aprovação.pdf'
const FRASE_DO_FORMATO = 'O .pdf da aprovação precisa ser .pdf, até 20 MB.'

async function abrirARegistro() {
  const agora = await agoraDoVerso()
  fireEvent.click(await agora.findByRole('button', { name: 'Registrar aprovação' }))
  return within(await screen.findByRole('dialog', { name: 'Registrar aprovação' }))
}

type Janela = Awaited<ReturnType<typeof abrirARegistro>>

const escolherPdf = (alvo: Janela | Awaited<ReturnType<typeof gavetaDaEtapa>>, arquivo: File) =>
  fireEvent.change(alvo.getByLabelText(/^\.pdf protocolado/), { target: { files: [arquivo] } })

const registrar = (janela: Janela) => fireEvent.click(janela.getByRole('button', { name: 'Registrar' }))

// ---- Registrar a aprovação com o .pdf

test('a janela de registrar tem o campo ".pdf protocolado (opcional)" e mostra o nome com que o arquivo será gravado', async () => {
  montar(versao(), { ajustar: ligarHistoricoDasVersoes })
  const janela = await abrirARegistro()
  expect(janela.getByLabelText('.pdf protocolado (opcional)')).toBeTruthy()
  escolherPdf(janela, arquivoPdf())
  expect(await janela.findByText(`Será gravado como: ${NOME_DO_PDF}`)).toBeTruthy()
})

test('registrar com o .pdf grava a aprovação e o .pdf, que aparece na gaveta com o nome padrão', async () => {
  const { revisoes, versoes } = montar(versao(), { ajustar: ligarHistoricoDasVersoes })
  const janela = await abrirARegistro()
  escolherPdf(janela, arquivoPdf())
  await janela.findByText(/Será gravado como/)
  registrar(janela)
  expect(await (await agoraDoVerso()).findByText('V8 aprovada')).toBeTruthy()
  expect(revisoes.aprovacoes.p1).toMatchObject({ versao: 8 })
  expect(versoes.pdfsDaAprovacao.p1.atual).toMatchObject({ nome: NOME_DO_PDF, formato: 'pdf' })
  const gaveta = await gavetaDaEtapa(APROVACAO)
  expect(await gaveta.findByRole('link', { name: NOME_DO_PDF })).toBeTruthy()
})

test('registrar sem o .pdf é aceito, e a gaveta oferece [Enviar .pdf]', async () => {
  const { versoes } = montar(versao(), { ajustar: ligarHistoricoDasVersoes })
  const janela = await abrirARegistro()
  registrar(janela)
  await (await agoraDoVerso()).findByText('V8 aprovada')
  expect(versoes.pdfsDaAprovacao.p1).toBeUndefined()
  const gaveta = await gavetaDaEtapa(APROVACAO)
  expect(await gaveta.findByRole('button', { name: 'Enviar .pdf' })).toBeTruthy()
})

test.each([
  ['formato errado', () => arquivoPdf('protocolo.docx')],
  ['mais de 20 MB', () => arquivoPdf('grande.pdf', 20 * 1024 * 1024 + 1)],
])('o .pdf com %s é recusado ao lado do campo e o botão Registrar fica desabilitado', async (_nome, arquivo) => {
  const { revisoes } = montar(versao(), { ajustar: ligarHistoricoDasVersoes })
  const janela = await abrirARegistro()
  escolherPdf(janela, arquivo())
  expect(await janela.findByText(FRASE_DO_FORMATO)).toBeTruthy()
  expect((janela.getByRole('button', { name: 'Registrar' }) as HTMLButtonElement).disabled).toBe(true)
  expect(revisoes.aprovacoes.p1).toBeUndefined()
})

test('se o .pdf não chega ao Drive, nada é registrado e o preenchido fica na janela', async () => {
  const { revisoes, versoes } = montar(versao(), { ajustar: ligarHistoricoDasVersoes })
  const janela = await abrirARegistro()
  fireEvent.change(janela.getByLabelText(/Número do E-protocolo/), { target: { value: 'PROT-9' } })
  escolherPdf(janela, arquivoPdf())
  await janela.findByText(/Será gravado como/)
  versoes.falharNoArquivo = 1
  registrar(janela)
  expect((await janela.findByRole('alert')).textContent).toBe('O .pdf não foi enviado: o arquivo protocolo.pdf não chegou ao Drive. Nada foi registrado.')
  expect(revisoes.aprovacoes.p1).toBeUndefined()
  expect((janela.getByLabelText(/Número do E-protocolo/) as HTMLInputElement).value).toBe('PROT-9')
  expect((janela.getByRole('button', { name: 'Registrar' }) as HTMLButtonElement).disabled).toBe(false)
})

test('se só o registro do .pdf falha, a aprovação já está registrada e a frase manda enviar o .pdf pela gaveta', async () => {
  const { revisoes, versoes } = montar(versao(), { ajustar: ligarHistoricoDasVersoes })
  const janela = await abrirARegistro()
  escolherPdf(janela, arquivoPdf())
  await janela.findByText(/Será gravado como/)
  versoes.falhaNoRegistro = new TravaDoBanco('O nome do .pdf não tem a versão aprovada. Envie de novo.')
  registrar(janela)
  expect((await janela.findByRole('alert')).textContent).toBe(
    'A aprovação foi registrada, mas o .pdf não foi guardado: O nome do .pdf não tem a versão aprovada. Envie de novo. Envie o .pdf pela gaveta da Aprovação pelo setor.',
  )
  expect(revisoes.aprovacoes.p1).toMatchObject({ versao: 8 })
  expect(await (await agoraDoVerso()).findByText('V8 aprovada')).toBeTruthy()
})

// ---- Enviar e substituir na gaveta

test('[Enviar .pdf] na gaveta envia o .pdf da aprovação já registrada', async () => {
  const { versoes } = montar(versao(), { ajustar: aprovadaComPdf(false) })
  const gaveta = await gavetaDaEtapa(APROVACAO)
  fireEvent.click(await gaveta.findByRole('button', { name: 'Enviar .pdf' }))
  escolherPdf(gaveta, arquivoPdf())
  fireEvent.click(gaveta.getByRole('button', { name: 'Enviar' }))
  expect(await gaveta.findByRole('link', { name: NOME_DO_PDF })).toBeTruthy()
  expect(gaveta.queryByRole('button', { name: 'Enviar .pdf' })).toBeNull()
  expect(versoes.pdfsDaAprovacao.p1.atual?.nome).toBe(NOME_DO_PDF)
})

test('na gaveta, o .pdf com formato errado é recusado com a frase', async () => {
  montar(versao(), { ajustar: aprovadaComPdf(false) })
  const gaveta = await gavetaDaEtapa(APROVACAO)
  fireEvent.click(await gaveta.findByRole('button', { name: 'Enviar .pdf' }))
  escolherPdf(gaveta, arquivoPdf('protocolo.docx'))
  expect(await gaveta.findByText(FRASE_DO_FORMATO)).toBeTruthy()
  expect((gaveta.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement).disabled).toBe(true)
})

test('a falha no envio da gaveta mostra a frase e mantém o formulário', async () => {
  const { versoes } = montar(versao(), { ajustar: aprovadaComPdf(false) })
  const gaveta = await gavetaDaEtapa(APROVACAO)
  fireEvent.click(await gaveta.findByRole('button', { name: 'Enviar .pdf' }))
  escolherPdf(gaveta, arquivoPdf())
  versoes.falhaNoRegistro = new TravaDoBanco('A aprovação já tem um .pdf; use Substituir.')
  fireEvent.click(gaveta.getByRole('button', { name: 'Enviar' }))
  expect((await gaveta.findByRole('alert')).textContent).toBe('A aprovação já tem um .pdf; use Substituir.')
  expect(gaveta.getByRole('button', { name: 'Enviar' })).toBeTruthy()
})

test('[Substituir] pede a confirmação de que o anterior não fica guardado e troca o conteúdo do mesmo .pdf', async () => {
  const { versoes } = montar(versao(), { ajustar: aprovadaComPdf(true) })
  const gaveta = await gavetaDaEtapa(APROVACAO)
  expect(await gaveta.findByRole('link', { name: NOME_DO_PDF })).toBeTruthy()
  fireEvent.click(gaveta.getByRole('button', { name: 'Substituir' }))
  escolherPdf(gaveta, arquivoPdf('outro.pdf', 777))
  fireEvent.click(gaveta.getByRole('button', { name: 'Substituir' }))
  const janela = within(janelaPorCima())
  expect(janela.getByText(/O arquivo anterior não fica guardado/)).toBeTruthy()
  fireEvent.click(janela.getByRole('button', { name: 'Substituir' }))
  await waitFor(() => expect(versoes.pdfsDaAprovacao.p1.atual?.tamanho).toBe(777))
  expect(versoes.pdfsDaAprovacao.p1.atual).toMatchObject({ id: 'pdf1', nome: NOME_DO_PDF })
})

test('substituir por um arquivo que não é .pdf é recusado antes de confirmar', async () => {
  montar(versao(), { ajustar: aprovadaComPdf(true) })
  const gaveta = await gavetaDaEtapa(APROVACAO)
  fireEvent.click(await gaveta.findByRole('button', { name: 'Substituir' }))
  escolherPdf(gaveta, arquivoPdf('outro.docx'))
  expect(await gaveta.findByText(FRASE_DO_FORMATO)).toBeTruthy()
})

// ---- Quem não vê botões, e as marcas da conferência

test('a Consulta vê e baixa o .pdf, sem [Substituir] nem [Enviar .pdf]', async () => {
  const { versoes } = montar(versao(), { ajustar: aprovadaComPdf(true), perfil: 'consulta' })
  const gaveta = await gavetaDaEtapa(APROVACAO)
  fireEvent.click(await gaveta.findByRole('link', { name: NOME_DO_PDF }))
  await waitFor(() => expect(versoes.baixados).toContain('pdf1'))
  expect(gaveta.queryByRole('button', { name: /Substituir|Enviar/ })).toBeNull()
})

test('a Consulta sem .pdf lê que ele não foi enviado, sem botão', async () => {
  montar(versao(), { ajustar: aprovadaComPdf(false), perfil: 'consulta' })
  const gaveta = await gavetaDaEtapa(APROVACAO)
  expect(await gaveta.findByText('Sem .pdf protocolado.')).toBeTruthy()
  expect(gaveta.queryByRole('button', { name: /Substituir|Enviar/ })).toBeNull()
})

test('o processo arquivado mostra o .pdf sem botões', async () => {
  montar(versao(), { ajustar: aprovadaComPdf(true), mudancas: { arquivadoEm: '2026-10-12T10:00:00Z', situacao: 'concluido' } })
  const gaveta = await gavetaDaEtapa(APROVACAO)
  expect(await gaveta.findByRole('link', { name: NOME_DO_PDF })).toBeTruthy()
  expect(gaveta.queryByRole('button', { name: /Substituir|Enviar/ })).toBeNull()
})

test.each([
  ['alterado', 'Alterado fora da plataforma'],
  ['nao_encontrado', 'Não encontrado no Drive'],
] as const)('a marca "%s" da conferência aparece ao lado do .pdf', async (situacao, marca) => {
  montar(versao(), {
    ajustar: (falsos) => {
      aprovadaComPdf(true)(falsos)
      falsos.versoes.conferencia.pdf1 = situacao
    },
  })
  const gaveta = await gavetaDaEtapa(APROVACAO)
  expect(await gaveta.findByText(marca)).toBeTruthy()
})

test('sem marca quando o .pdf está certo, e sem marcas quando a conferência falha', async () => {
  montar(versao(), {
    ajustar: (falsos) => {
      aprovadaComPdf(true)(falsos)
      falsos.versoes.falharConferencia = true
    },
  })
  const gaveta = await gavetaDaEtapa(APROVACAO)
  await gaveta.findByRole('link', { name: NOME_DO_PDF })
  expect(gaveta.queryByText(/Alterado fora da plataforma|Não encontrado no Drive/)).toBeNull()
})

// ---- A aprovação nova guarda o .pdf da anterior; o histórico

test('a segunda aprovação deixa a gaveta sem .pdf atual, e o histórico baixa o .pdf guardado pelo link', async () => {
  const { versoes } = montar(versao(), { ajustar: aprovadaComPdf(true) })
  const agora = await agoraDoVerso()
  fireEvent.click(await agora.findByRole('button', { name: 'Registrar aprovação' }))
  const janela = within(await screen.findByRole('dialog', { name: 'Registrar aprovação' }))
  registrar(janela)
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Registrar aprovação' })).toBeNull())
  const gaveta = await gavetaDaEtapa(APROVACAO)
  expect(await gaveta.findByRole('button', { name: 'Enviar .pdf' })).toBeTruthy()
  expect(gaveta.queryByRole('link', { name: NOME_DO_PDF })).toBeNull()
  await escolherNoMenuDoProcesso('Histórico')
  const verso = await versoAberto()
  expect(await verso.findByText('Substituiu a aprovação')).toBeTruthy()
  fireEvent.click(await verso.findByRole('link', { name: NOME_DO_PDF }))
  await waitFor(() => expect(versoes.baixados).toContain('pdf1'))
})

test('o histórico mostra "Enviou o .pdf da aprovação" e "Substituiu o .pdf da aprovação"', async () => {
  montar(versao(), { ajustar: aprovadaComPdf(false) })
  const gaveta = await gavetaDaEtapa(APROVACAO)
  fireEvent.click(await gaveta.findByRole('button', { name: 'Enviar .pdf' }))
  escolherPdf(gaveta, arquivoPdf())
  fireEvent.click(gaveta.getByRole('button', { name: 'Enviar' }))
  await gaveta.findByRole('link', { name: NOME_DO_PDF })
  fireEvent.click(gaveta.getByRole('button', { name: 'Substituir' }))
  escolherPdf(gaveta, arquivoPdf('outro.pdf', 55))
  fireEvent.click(gaveta.getByRole('button', { name: 'Substituir' }))
  fireEvent.click(within(janelaPorCima()).getByRole('button', { name: 'Substituir' }))
  await waitFor(() => expect(gaveta.queryByRole('button', { name: 'Enviar' })).toBeNull())
  await escolherNoMenuDoProcesso('Histórico')
  const verso = await versoAberto()
  expect(await verso.findByText('Enviou o .pdf da aprovação')).toBeTruthy()
  expect(verso.getByText('Substituiu o .pdf da aprovação')).toBeTruthy()
})
