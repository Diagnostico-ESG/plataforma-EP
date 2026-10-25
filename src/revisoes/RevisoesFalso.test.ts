import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ProcessosFalso } from '../processos/ProcessosFalso'
import { umProcessoLido } from '../testes/processoDaLista'
import { RevisoesFalso } from './RevisoesFalso'

const EU = { id: 'u2', nome: 'Bia Teste' }

function montar() {
  const processos = new ProcessosFalso()
  processos.processos = [umProcessoLido('Emitir Ofício', { id: 'p1' })]
  return { processos, revisoes: new RevisoesFalso(processos, EU) }
}

async function falhaDe(promessa: Promise<void>): Promise<Error> {
  return (await promessa.catch((erro: unknown) => erro)) as Error
}

describe('listar', () => {
  test('devolve as revisões do processo e falha ou segura conforme o teste pede', async () => {
    const { revisoes } = montar()
    expect(await revisoes.listarRevisoes('p1')).toEqual([])
    revisoes.falharLeitura = true
    await expect(revisoes.listarRevisoes('p1')).rejects.toThrow('falha de conexão simulada')
  })
})

describe('editar a revisão', () => {
  const CORRIGIDA_REGISTRADA = {
    id: 'r1', versaoRevisada: 7, versaoCorrigida: 8, resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei',
    revisor: 'Bia Teste', revisadaEm: '2026-10-13',
  } as const
  const SEM_ALTERACAO_REGISTRADA = { ...CORRIGIDA_REGISTRADA, id: 'r2', versaoCorrigida: null, resultado: 'sem_alteracao', escopo: null } as const

  test('troca o escopo e o comentário e põe o evento "editar" com o antes e o depois no histórico', async () => {
    const { processos, revisoes } = montar()
    revisoes.revisoes.p1 = [CORRIGIDA_REGISTRADA]
    await revisoes.editarRevisao('r1', { resultado: 'corrigida', escopo: 'relatorio', comentario: 'Ajustei só o relatório' })
    expect((await revisoes.listarRevisoes('p1'))[0]).toMatchObject({ escopo: 'relatorio', comentario: 'Ajustei só o relatório' })
    const [evento] = await processos.lerHistoricoDoProcesso('p1')
    expect(evento).toMatchObject({ acao: 'editar', entidade: 'revisao_interna', entidadeRef: 'p1' })
    expect(evento.antes).toMatchObject({ escopo: 'ambos', comentario: 'Ajustei', versao_revisada: 'V7' })
    expect(evento.depois).toMatchObject({ escopo: 'relatorio', comentario: 'Ajustei só o relatório' })
  })

  test('salvar sem mudar nada não põe evento no histórico', async () => {
    const { processos, revisoes } = montar()
    revisoes.revisoes.p1 = [CORRIGIDA_REGISTRADA]
    await revisoes.editarRevisao('r1', { resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei' })
    expect(await processos.lerHistoricoDoProcesso('p1')).toEqual([])
  })

  test('recusa tirar o escopo da corrigida e pôr escopo na sem alteração, com as frases do banco', async () => {
    const { revisoes } = montar()
    revisoes.revisoes.p1 = [CORRIGIDA_REGISTRADA, SEM_ALTERACAO_REGISTRADA]
    const semEscopo = await falhaDe(revisoes.editarRevisao('r1', { resultado: 'corrigida', escopo: null, comentario: null }))
    expect(semEscopo).toBeInstanceOf(TravaDoBanco)
    expect(semEscopo.message).toBe('Escolha o escopo da correção.')
    const comEscopo = await falhaDe(revisoes.editarRevisao('r2', { resultado: 'sem_alteracao', escopo: 'ambos', comentario: null }))
    expect(comEscopo.message).toBe('O escopo só vale na revisão corrigida.')
  })

  test('processo suspenso recusa a edição', async () => {
    const { processos, revisoes } = montar()
    revisoes.revisoes.p1 = [CORRIGIDA_REGISTRADA]
    processos.processos[0].situacao = 'suspenso'
    const falha = await falhaDe(revisoes.editarRevisao('r1', { resultado: 'corrigida', escopo: 'ambos', comentario: 'x' }))
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('Este processo está suspenso; retome-o para mudar a etapa, a etiqueta ou o responsável.')
  })

  test('revisão que não existe é cadastro inexistente; falha e espera programadas valem para a edição', async () => {
    const { revisoes } = montar()
    revisoes.revisoes.p1 = [CORRIGIDA_REGISTRADA]
    expect(await falhaDe(revisoes.editarRevisao('nao-existe', { resultado: 'sem_alteracao', escopo: null, comentario: null }))).toBeInstanceOf(CadastroInexistente)
    revisoes.falhaNaGravacao = 'sem conexão'
    expect((await falhaDe(revisoes.editarRevisao('r1', { resultado: 'corrigida', escopo: 'ambos', comentario: 'x' }))).message).toBe('sem conexão')
    revisoes.falhaNaGravacao = null
    revisoes.segurarGravacao = true
    let terminou = false
    void revisoes.editarRevisao('r1', { resultado: 'corrigida', escopo: 'ambos', comentario: 'x' }).then(() => { terminou = true })
    await Promise.resolve()
    expect(terminou).toBe(false)
  })
})
