import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ProcessosFalso } from './ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido } from './tipos'

function doProcesso(ordem: number, codigo: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome: `Etapa ${codigo}`, ordem, obrigatoria: true, status: 'concluida',
    nota: null, iniciadaEm: '2026-10-01', resolvidaEm: '2026-10-02', responsavelId: null, responsavelNome: null,
    responsavelInativo: false, ...mudancas,
  }
}

const PENDENTE = { status: 'pendente', iniciadaEm: null, resolvidaEm: null, obrigatoria: false } as const
const EM_ANDAMENTO = { status: 'em_andamento', iniciadaEm: '2026-10-10', resolvidaEm: null, obrigatoria: false,
  responsavelId: 'u1', responsavelNome: 'Ana Teste' } as const

// A Aprovação resolvida e a Publicação no estado pedido; "não" pendente = concluído não publicado.
function falso(publicacao: Partial<EtapaDoProcesso>, vaiParaPublicacao: boolean | null, mudancas: Partial<ProcessoLido> = {}) {
  const etapasDoProcesso = [doProcesso(5, 'aprovacao_setor'), doProcesso(6, 'publicacao', publicacao)]
  const emAndamento = publicacao.status === 'em_andamento'
  const processo: ProcessoLido = {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 'set1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro', situacao: emAndamento ? 'em_andamento' : 'concluido',
    etapaAtual: emAndamento ? { codigo: 'publicacao', nome: 'Publicação', ordem: 6 } : null,
    responsavel: null, origem: 'novo', contexto: null, observacoes: null, processoPaiId: null, processoPai: null, subprocessos: [],
    motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao: null, etapasDoProcesso, vaiParaPublicacao,
    publicadoEm: null, arquivadoEm: null, ...mudancas,
  }
  const modulo = new ProcessosFalso()
  modulo.processos = [processo]
  return modulo
}

const lido = async (modulo: ProcessosFalso) => (await modulo.lerProcesso('p1')) as ProcessoLido
const publicacaoDe = async (modulo: ProcessosFalso) => (await lido(modulo)).etapasDoProcesso[1]

async function recusa(promessa: Promise<void>): Promise<string> {
  const erro = (await promessa.catch((falha: unknown) => falha)) as Error
  expect(erro).toBeInstanceOf(TravaDoBanco)
  return erro.message
}

describe('não vai mais para publicação', () => {
  test('sem motivo ou com a Publicação fora de andamento é recusado', async () => {
    expect(await recusa(falso(EM_ANDAMENTO, true).naoVaiMaisParaPublicacao('p1', '  '))).toBe('O motivo é obrigatório.')
    expect(await recusa(falso(PENDENTE, false).naoVaiMaisParaPublicacao('p1', 'Mudou')))
      .toBe('Só se desiste da publicação com a Publicação em andamento.')
  })

  test('aceito: a Publicação volta a pendente sem responsável nem datas e o processo fica concluído, "não"', async () => {
    const modulo = falso(EM_ANDAMENTO, true)
    await modulo.naoVaiMaisParaPublicacao('p1', 'O setor desistiu')
    expect(await publicacaoDe(modulo)).toMatchObject({ status: 'pendente', iniciadaEm: null, responsavelId: null, responsavelNome: null })
    expect(await lido(modulo)).toMatchObject({ situacao: 'concluido', vaiParaPublicacao: false, etapaAtual: null })
  })
})

describe('registrar publicação', () => {
  test('recusa data futura e data antes da aprovação, com as datas', async () => {
    const modulo = falso(PENDENTE, false)
    modulo.dataDaAprovacao = () => '2026-10-05'
    expect(await recusa(modulo.registrarPublicacao('p1', '2026-10-14', null))).toBe('A data 14/10/2026 está no futuro.')
    expect(await recusa(modulo.registrarPublicacao('p1', '2026-10-01', null)))
      .toBe('A data da publicação (01/10/2026) não pode ser antes da aprovação (05/10/2026).')
  })

  test('recusa processo em andamento e já publicado', async () => {
    expect(await recusa(falso(EM_ANDAMENTO, true).registrarPublicacao('p1', '2026-10-10', null)))
      .toBe('Só se registra a publicação de um processo concluído; este está em andamento.')
    const publicado = falso({ obrigatoria: false }, true, { publicadoEm: '2026-10-02' })
    expect(await recusa(publicado.registrarPublicacao('p1', '2026-10-10', null))).toBe('A publicação deste processo já está registrada.')
  })

  test('aceito: publicado na data, onde estava (inclusive arquivado)', async () => {
    const modulo = falso(PENDENTE, false, { arquivadoEm: '2026-10-12T12:00:00Z' })
    await modulo.registrarPublicacao('p1', '2026-10-10', 'Diário Oficial')
    expect(await publicacaoDe(modulo)).toMatchObject({ status: 'concluida', iniciadaEm: '2026-10-10', resolvidaEm: '2026-10-10' })
    expect(await lido(modulo)).toMatchObject({
      situacao: 'concluido', vaiParaPublicacao: true, publicadoEm: '2026-10-10', arquivadoEm: '2026-10-12T12:00:00Z',
    })
  })
})

describe('arquivar e desarquivar', () => {
  test('arquivar fora de concluído e duas vezes é recusado; desarquivar o não arquivado também', async () => {
    expect(await recusa(falso(EM_ANDAMENTO, true).arquivar('p1')))
      .toBe('Só um processo concluído pode ser arquivado; este está em andamento.')
    const modulo = falso(PENDENTE, false)
    expect(await recusa(modulo.desarquivar('p1'))).toBe('Este processo não está arquivado.')
    await modulo.arquivar('p1')
    expect(await recusa(modulo.arquivar('p1'))).toBe('Este processo já está arquivado.')
  })

  test('arquivar marca o processo e desarquivar tira a marca', async () => {
    const modulo = falso(PENDENTE, false)
    await modulo.arquivar('p1')
    expect((await lido(modulo)).arquivadoEm).toBeTruthy()
    await modulo.desarquivar('p1')
    expect((await lido(modulo)).arquivadoEm).toBeNull()
  })

  test('o arquivado recusa etapa, situação, edição, reunião e exclusão', async () => {
    const modulo = falso(PENDENTE, false, { arquivadoEm: '2026-10-12T12:00:00Z' })
    const frase = 'Este processo está arquivado; desarquive-o para alterar.'
    expect(await recusa(modulo.voltarParaEtapa('a5', 'Rever', null))).toBe(frase)
    expect(await recusa(modulo.suspenderProcesso('p1', 'Parar'))).toBe(frase)
    expect(await recusa(modulo.marcarReuniao('p1', '2026-10-20'))).toBe(frase)
    expect(await recusa(modulo.excluirProcesso('p1'))).toBe(frase)
  })

  test('a falha programada vale nas quatro ações', async () => {
    const modulo = falso(PENDENTE, false)
    modulo.falhaDeGravacao = 'sem conexão'
    for (const gravar of [() => modulo.arquivar('p1'), () => modulo.desarquivar('p1'),
      () => modulo.registrarPublicacao('p1', '2026-10-10', null), () => modulo.naoVaiMaisParaPublicacao('p1', 'x')]) {
      await expect(gravar()).rejects.toThrow('sem conexão')
    }
  })
})
