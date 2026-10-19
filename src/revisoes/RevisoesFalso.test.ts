import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import type { EtapaDoProcesso, ProcessoLido, UltimaVersao } from '../processos/tipos'
import { RevisoesFalso } from './RevisoesFalso'
import type { DadosDaRevisao } from './tipos'

const EU = { id: 'u2', nome: 'Bia Teste' }
const ANA = { id: 'u1', nome: 'Ana Teste' }

function etapa(ordem: number, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo: `c${ordem}`, nome: `Etapa ${ordem}`, ordem, obrigatoria: true, status: 'pendente', nota: null,
    iniciadaEm: null, resolvidaEm: null, responsavelId: null, responsavelNome: null, responsavelInativo: false, ...mudancas,
  }
}

function montar(ultimaVersao: UltimaVersao | null) {
  const processo: ProcessoLido = {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro', situacao: 'em_andamento', etapaAtual: { codigo: 'c3', nome: 'Etapa 3', ordem: 3 },
    responsavel: null, origem: 'novo', contexto: null, observacoes: null, processoPaiId: null, processoPai: null,
    subprocessos: [], motivoDaSituacao: null, dataDaReuniao: null, ultimaVersao,
    etapasDoProcesso: [etapa(3, { status: 'em_andamento', iniciadaEm: '2026-10-10' }), etapa(4)],
  }
  const processos = new ProcessosFalso()
  processos.processos = [processo]
  processos.usuariosPossiveis = [ANA, EU]
  return { processos, revisoes: new RevisoesFalso(processos, EU) }
}

const DE_ANA: UltimaVersao = { numero: 7, autorId: ANA.id, autorNome: ANA.nome, papeis: ['bpmn', 'png'] }
const MINHA: UltimaVersao = { numero: 8, autorId: EU.id, autorNome: EU.nome, papeis: ['bpmn', 'png'], anterior: { numero: 7, autorId: ANA.id } }
const SEM_ALTERACAO: DadosDaRevisao = { resultado: 'sem_alteracao', escopo: null, comentario: 'Conferi' }
const CORRIGIDA: DadosDaRevisao = { resultado: 'corrigida', escopo: 'ambos', comentario: null }

async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

describe('listar', () => {
  test('devolve as revisões do processo e falha ou segura conforme o teste pede', async () => {
    const { revisoes } = montar(DE_ANA)
    expect(await revisoes.listarRevisoes('p1')).toEqual([])
    revisoes.falharLeitura = true
    await expect(revisoes.listarRevisoes('p1')).rejects.toThrow('falha de conexão simulada')
  })
})

describe('concluir a revisão interna', () => {
  test('sem alteração: grava a revisão da versão mais recente e conclui a etapa', async () => {
    const { processos, revisoes } = montar(DE_ANA)
    await revisoes.concluirRevisaoInterna('a3', SEM_ALTERACAO, ANA.id)
    expect(await revisoes.listarRevisoes('p1')).toEqual([{
      id: 'r1', versaoRevisada: 7, versaoCorrigida: null, resultado: 'sem_alteracao', escopo: null, comentario: 'Conferi',
      revisor: 'Bia Teste', revisadaEm: '2026-10-13',
    }])
    const lido = (await processos.lerProcesso('p1')) as ProcessoLido
    expect(lido.etapasDoProcesso.map((e) => e.status)).toEqual(['concluida', 'em_andamento'])
    expect(lido.etapasDoProcesso[1].responsavelId).toBe(ANA.id)
    expect(revisoes.conclusoes).toEqual([{ andamentoId: 'a3', dados: SEM_ALTERACAO, responsavelId: ANA.id }])
  })

  test('corrigida: a revisada é a anterior e a corrigida é a mais recente, do revisor', async () => {
    const { revisoes } = montar(MINHA)
    await revisoes.concluirRevisaoInterna('a3', CORRIGIDA, null)
    expect((await revisoes.listarRevisoes('p1'))[0]).toMatchObject({
      versaoRevisada: 7, versaoCorrigida: 8, resultado: 'corrigida', escopo: 'ambos', comentario: null,
    })
  })

  test('a mais recente primeiro', async () => {
    const { processos, revisoes } = montar(DE_ANA)
    await revisoes.concluirRevisaoInterna('a3', SEM_ALTERACAO, null)
    await processos.voltarParaEtapa('a3', 'Ajustar', null)
    await revisoes.concluirRevisaoInterna('a3', { ...SEM_ALTERACAO, comentario: 'De novo' }, null)
    expect((await revisoes.listarRevisoes('p1')).map((revisao) => revisao.comentario)).toEqual(['De novo', 'Conferi'])
  })

  test.each([
    ['o autor não revisa "sem alteração"', MINHA, SEM_ALTERACAO, 'Quem enviou a versão V8 não pode revisá-la.'],
    ['"corrigida" pede a versão corrigida do revisor', DE_ANA, CORRIGIDA, 'Para marcar como corrigida, a versão mais recente precisa ser sua: envie a versão corrigida em Arquivos.'],
    ['sem versão', null, SEM_ALTERACAO, 'O processo ainda não tem versão enviada.'],
    ['"sem alteração" não tem escopo', DE_ANA, { ...SEM_ALTERACAO, escopo: 'ambos' } as DadosDaRevisao, 'O escopo só vale na revisão corrigida.'],
    ['"corrigida" pede escopo', MINHA, { ...CORRIGIDA, escopo: null }, 'Escolha o escopo da correção.'],
  ])('recusa como o banco: %s', async (_caso, ultima, dados, frase) => {
    const { processos, revisoes } = montar(ultima)
    const falha = await falhaDe(revisoes.concluirRevisaoInterna('a3', dados, null))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe(frase)
    expect(await revisoes.listarRevisoes('p1')).toEqual([])
    expect(((await processos.lerProcesso('p1')) as ProcessoLido).etapasDoProcesso[0].status).toBe('em_andamento')
  })

  test('a conclusão que falha não deixa a revisão (responsável que não pode ser escolhido)', async () => {
    const { revisoes } = montar(DE_ANA)
    const falha = await falhaDe(revisoes.concluirRevisaoInterna('a3', SEM_ALTERACAO, 'inativo'))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(await revisoes.listarRevisoes('p1')).toEqual([])
  })

  test('a falha programada lança antes de tudo', async () => {
    const { revisoes } = montar(DE_ANA)
    revisoes.falhaNaGravacao = 'falha de conexão simulada'
    await expect(revisoes.concluirRevisaoInterna('a3', SEM_ALTERACAO, null)).rejects.toThrow('falha de conexão simulada')
    expect(revisoes.conclusoes).toEqual([])
  })

  test('sem a falsa de processos, avisa como montar', async () => {
    await expect(new RevisoesFalso().concluirRevisaoInterna('a3', SEM_ALTERACAO, null)).rejects.toThrow('RevisoesFalso sem ProcessosFalso')
  })
})
