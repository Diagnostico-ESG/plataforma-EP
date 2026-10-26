import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import { mudarSituacao } from '../processos/situacaoFalso'
import { umProcessoLido } from '../testes/processoDaLista'
import { VersoesFalso } from '../versoes/VersoesFalso'
import { RevisoesFalso } from './RevisoesFalso'

// A data da validação e o .pdf da aprovação na falsa de revisões: recusa como o banco e guarda o .pdf da aprovação trocada.

const EU = { id: 'u2', nome: 'Bia Teste' }
const SEM_NADA = { numeroEprotocolo: null, link: null, aprovadaEm: null }

function montar(etapa: string) {
  const processos = new ProcessosFalso()
  processos.processos = [umProcessoLido('Emitir Ofício', { id: 'p1', ultimaVersao: { numero: 8, autorId: 'u1', autorNome: 'Ana Teste', papeis: ['bpm', 'png'] } }, etapa)]
  const versoes = new VersoesFalso()
  versoes.processos.p1 = { sigla: 'TSA', nome: 'Emitir Ofício', etapa: null }
  return { processos, versoes, revisoes: new RevisoesFalso(processos, EU, versoes) }
}

async function falhaDe(promessa: Promise<unknown>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

describe('registrarDataDaValidacao', () => {
  test('grava, altera e apaga a data do processo, com um evento para cada mudança', async () => {
    const { processos, revisoes } = montar('revisao_setor')
    await revisoes.registrarDataDaValidacao('p1', '2026-10-10')
    await revisoes.registrarDataDaValidacao('p1', '2026-10-11')
    await revisoes.registrarDataDaValidacao('p1', '2026-10-11')
    expect(processos.processos[0].dataDaValidacao).toBe('2026-10-11')
    await revisoes.registrarDataDaValidacao('p1', null)
    expect(processos.processos[0].dataDaValidacao).toBeNull()
    const eventos = processos.historicoDosProcessos.p1.map((evento) => [evento.acao, evento.antes, evento.depois])
    expect(eventos.reverse()).toEqual([
      ['registrar_data_da_validacao', { nome: 'Emitir Ofício', setor_sigla: 'TSA', data_da_validacao: null }, { nome: 'Emitir Ofício', setor_sigla: 'TSA', data_da_validacao: '2026-10-10' }],
      ['alterar_data_da_validacao', { nome: 'Emitir Ofício', setor_sigla: 'TSA', data_da_validacao: '2026-10-10' }, { nome: 'Emitir Ofício', setor_sigla: 'TSA', data_da_validacao: '2026-10-11' }],
      ['alterar_data_da_validacao', { nome: 'Emitir Ofício', setor_sigla: 'TSA', data_da_validacao: '2026-10-11' }, { nome: 'Emitir Ofício', setor_sigla: 'TSA', data_da_validacao: null }],
    ])
  })

  test('recusa data no futuro, com a frase da validação', async () => {
    const { revisoes } = montar('revisao_setor')
    const falha = await falhaDe(revisoes.registrarDataDaValidacao('p1', '2026-10-14'))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('A data da validação não pode ser futura.')
  })

  test('recusa fora da Validação com o setor', async () => {
    const { revisoes } = montar('aprovacao_setor')
    expect((await falhaDe(revisoes.registrarDataDaValidacao('p1', '2026-10-10'))).message)
      .toBe('Registre a data da validação com o processo na Validação com o setor.')
  })

  test('recusa processo suspenso e processo arquivado', async () => {
    const parado = montar('revisao_setor')
    parado.processos.processos = [mudarSituacao(parado.processos.processos[0], 'suspenso', 'Aguardando')]
    expect(await falhaDe(parado.revisoes.registrarDataDaValidacao('p1', '2026-10-10'))).toBeInstanceOf(TravaDoBanco)
    const arquivado = montar('revisao_setor')
    arquivado.processos.processos = [{ ...arquivado.processos.processos[0], arquivadoEm: '2026-10-12T10:00:00Z' }]
    expect((await falhaDe(arquivado.revisoes.registrarDataDaValidacao('p1', '2026-10-10'))).message)
      .toBe('Este processo está arquivado; desarquive-o para alterar.')
  })
})

describe('o .pdf da aprovação nas falsas ligadas', () => {
  const pdf = () => new File(['pdf'], 'protocolo.pdf')

  test('o .pdf sem aprovação é recusado; com ela, entra e aparece na leitura da aprovação com o nome padrão', async () => {
    const { revisoes, versoes } = montar('aprovacao_setor')
    const pedido = { processoId: 'p1', numero: 8, arquivo: pdf() }
    expect((await falhaDe(versoes.enviarPdfDaAprovacao(pedido, () => {}))).message).toBe('Registre a aprovação antes de enviar o .pdf.')
    await revisoes.registrarAprovacao('p1', SEM_NADA)
    await versoes.enviarPdfDaAprovacao(pedido, () => {})
    expect((await revisoes.lerAprovacao('p1'))?.pdf).toMatchObject({ papel: 'pdf_da_aprovacao', nome: 'TSA_V8_Emitir Ofício_Aprovação.pdf', formato: 'pdf' })
    expect((await falhaDe(versoes.enviarPdfDaAprovacao(pedido, () => {}))).message).toBe('A aprovação já tem um .pdf; use Substituir.')
  })

  test('registrar a aprovação dentro do envio: se o envio falha, nada é registrado', async () => {
    const { revisoes, versoes } = montar('aprovacao_setor')
    versoes.falharNoArquivo = 1
    const antesDeRegistrar = () => revisoes.registrarAprovacao('p1', SEM_NADA)
    await falhaDe(versoes.enviarPdfDaAprovacao({ processoId: 'p1', numero: 8, arquivo: pdf(), antesDeRegistrar }, () => {}))
    expect(await revisoes.lerAprovacao('p1')).toBeNull()
  })

  test('a aprovação nova guarda o .pdf da anterior e o evento "substituir" leva o nome dele', async () => {
    const { processos, revisoes, versoes } = montar('aprovacao_setor')
    await revisoes.registrarAprovacao('p1', SEM_NADA)
    await versoes.enviarPdfDaAprovacao({ processoId: 'p1', numero: 8, arquivo: pdf() }, () => {})
    const antigo = (await revisoes.lerAprovacao('p1'))?.pdf
    await revisoes.registrarAprovacao('p1', { ...SEM_NADA, numeroEprotocolo: 'PROT-2' })
    expect((await revisoes.lerAprovacao('p1'))?.pdf).toBeNull()
    expect(versoes.pdfsDaAprovacao.p1.guardados).toEqual([antigo])
    expect(processos.historicoDosProcessos.p1[0]).toMatchObject({
      acao: 'substituir', antes: { pdf_id: antigo?.id, pdf_nome: 'TSA_V8_Emitir Ofício_Aprovação.pdf' },
    })
  })

  test('substituir troca o conteúdo do .pdf atual, só por .pdf, e confere o arquivo guardado na conferência', async () => {
    const { revisoes, versoes } = montar('aprovacao_setor')
    await revisoes.registrarAprovacao('p1', SEM_NADA)
    await versoes.enviarPdfDaAprovacao({ processoId: 'p1', numero: 8, arquivo: pdf() }, () => {})
    const atual = (await revisoes.lerAprovacao('p1'))?.pdf
    if (!atual) throw new Error('o .pdf deveria existir')
    const docx = falhaDe(versoes.substituirArquivo({ processoId: 'p1', numero: 8, arquivo: atual, novo: new File(['x'], 'outro.docx') }, () => {}))
    expect((await docx).message).toBe('O arquivo novo precisa ser do mesmo tipo do que sai.')
    await versoes.substituirArquivo({ processoId: 'p1', numero: 8, arquivo: atual, novo: new File(['maior que antes'], 'outro.pdf') }, () => {})
    expect((await revisoes.lerAprovacao('p1'))?.pdf).toMatchObject({ id: atual.id, nome: atual.nome, tamanho: 15 })
    expect(Object.keys(await versoes.conferirArquivos('p1'))).toContain(atual.id)
  })

  test('o processo suspenso ou arquivado não recebe o .pdf, e o concluído recebe', async () => {
    const { processos, revisoes, versoes } = montar('aprovacao_setor')
    await revisoes.registrarAprovacao('p1', SEM_NADA)
    const pedido = { processoId: 'p1', numero: 8, arquivo: pdf() }
    processos.processos = [{ ...processos.processos[0], situacao: 'concluido' }]
    await versoes.enviarPdfDaAprovacao(pedido, () => {})
    processos.processos = [{ ...processos.processos[0], arquivadoEm: '2026-10-12T10:00:00Z' }]
    const atual = (await revisoes.lerAprovacao('p1'))?.pdf
    if (!atual) throw new Error('o .pdf deveria existir')
    const falha = await falhaDe(versoes.substituirArquivo({ processoId: 'p1', numero: 8, arquivo: atual, novo: pdf() }, () => {}))
    expect(falha.message).toBe('Este processo está arquivado; desarquive-o para alterar.')
  })
})
