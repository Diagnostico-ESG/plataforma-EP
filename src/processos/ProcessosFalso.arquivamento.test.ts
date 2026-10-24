import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CATALOGO_DE_TESTE, umProcessoLido } from '../testes/processoDaLista'
import { ProcessosFalso } from './ProcessosFalso'
import type { ProcessoLido } from './tipos'

// O concluído (em Concluídos) ou o processo em andamento, com as mudanças pedidas.
function falso(etapa: string, mudancas: Partial<ProcessoLido> = {}): ProcessosFalso {
  const concluido = etapa === 'concluidos'
  const modulo = new ProcessosFalso()
  modulo.etapasDoCatalogo = CATALOGO_DE_TESTE
  modulo.processos = [umProcessoLido('Emitir Ofício', {
    id: 'p1', situacao: concluido ? 'concluido' : 'em_andamento', etiqueta: concluido ? 'concluido' : 'a_fazer', ...mudancas,
  }, etapa)]
  return modulo
}

const lido = async (modulo: ProcessosFalso) => (await modulo.lerProcesso('p1')) as ProcessoLido

async function recusa(promessa: Promise<void>): Promise<string> {
  const erro = (await promessa.catch((falha: unknown) => falha)) as Error
  expect(erro).toBeInstanceOf(TravaDoBanco)
  return erro.message
}

describe('arquivar e desarquivar', () => {
  test('arquivar fora de concluído e duas vezes é recusado; desarquivar o não arquivado também', async () => {
    expect(await recusa(falso('revisao_interna').arquivar('p1')))
      .toBe('Só se arquiva processo concluído, suspenso ou cancelado.')
    const modulo = falso('concluidos')
    expect(await recusa(modulo.desarquivar('p1'))).toBe('Este processo não está arquivado.')
    await modulo.arquivar('p1')
    expect(await recusa(modulo.arquivar('p1'))).toBe('Este processo já está arquivado.')
  })

  test('o suspenso e o cancelado se arquivam, guardam a situação e a etapa, e desarquivar os devolve como estavam', async () => {
    for (const situacao of ['suspenso', 'cancelado'] as const) {
      const modulo = falso('modelagem', { situacao })
      await modulo.arquivar('p1')
      expect(await lido(modulo)).toMatchObject({ situacao, etapaAtual: { codigo: 'modelagem' } })
      expect((await lido(modulo)).arquivadoEm).toBeTruthy()
      expect(await recusa(modulo.moverProcesso('p1', 'e4'))).toBe('Este processo está arquivado; desarquive-o para alterar.')
      await modulo.desarquivar('p1')
      expect(await lido(modulo)).toMatchObject({ situacao, etapaAtual: { codigo: 'modelagem' }, arquivadoEm: null })
    }
  })

  test('arquivar marca o processo e desarquivar tira a marca', async () => {
    const modulo = falso('concluidos')
    await modulo.arquivar('p1')
    expect((await lido(modulo)).arquivadoEm).toBeTruthy()
    await modulo.desarquivar('p1')
    expect((await lido(modulo)).arquivadoEm).toBeNull()
  })

  test('o arquivado recusa mover, etiqueta, responsável, situação, reunião e exclusão', async () => {
    const modulo = falso('concluidos', { arquivadoEm: '2026-10-12T12:00:00Z' })
    const frase = 'Este processo está arquivado; desarquive-o para alterar.'
    expect(await recusa(modulo.moverProcesso('p1', 'e2'))).toBe(frase)
    expect(await recusa(modulo.mudarEtiqueta('p1', 'a_fazer'))).toBe(frase)
    expect(await recusa(modulo.mudarResponsavel('p1', null))).toBe(frase)
    expect(await recusa(modulo.suspenderProcesso('p1', 'Parar'))).toBe(frase)
    expect(await recusa(modulo.marcarReuniao('p1', '2026-10-20'))).toBe(frase)
    expect(await recusa(modulo.excluirProcesso('p1'))).toBe(frase)
  })

  test('a falha programada vale nas duas ações', async () => {
    const modulo = falso('concluidos')
    modulo.falhaDeGravacao = 'sem conexão'
    for (const gravar of [() => modulo.arquivar('p1'), () => modulo.desarquivar('p1')]) {
      await expect(gravar()).rejects.toThrow('sem conexão')
    }
  })
})
