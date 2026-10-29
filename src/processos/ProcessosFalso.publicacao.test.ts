import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CATALOGO_DE_TESTE, umProcessoLido } from '../testes/processoDaLista'
import { ProcessosFalso } from './ProcessosFalso'
import { hojeLocal } from './textoDaModelagemPiloto'
import type { ProcessoLido } from './tipos'

function falso(etapa: string, mudancas: Partial<ProcessoLido> = {}): ProcessosFalso {
  const modulo = new ProcessosFalso()
  modulo.etapasDoCatalogo = CATALOGO_DE_TESTE
  modulo.processos = [umProcessoLido('Emitir Ofício', { id: 'p1', ...mudancas }, etapa)]
  return modulo
}

const lido = async (modulo: ProcessosFalso) => (await modulo.lerProcesso('p1')) as ProcessoLido

async function recusa(promessa: Promise<void>): Promise<string> {
  const erro = (await promessa.catch((falha: unknown) => falha)) as Error
  expect(erro).toBeInstanceOf(TravaDoBanco)
  return erro.message
}

const CONCLUIDO = { situacao: 'concluido', etiqueta: 'concluido' } as const

describe('registrar publicação', () => {
  test('na Publicação grava a data e o link e o processo continua na etapa', async () => {
    const modulo = falso('publicacao')
    await modulo.registrarPublicacao('p1', '2026-10-10', 'https://diario.exemplo/1')
    expect(await lido(modulo)).toMatchObject({
      publicadoEm: '2026-10-10', linkDaPublicacao: 'https://diario.exemplo/1', etapaAtual: { codigo: 'publicacao' },
    })
  })

  test('em Concluídos sem data registra e deixa de ser sem publicação', async () => {
    const modulo = falso('concluidos', { ...CONCLUIDO, explicacaoSemPublicacao: 'Não será publicado' })
    await modulo.registrarPublicacao('p1', '2026-10-10', null)
    expect(await lido(modulo)).toMatchObject({ publicadoEm: '2026-10-10', linkDaPublicacao: null, etapaAtual: { codigo: 'concluidos' } })
  })

  test('com a data já registrada, corrige a data e o link', async () => {
    const modulo = falso('concluidos', { ...CONCLUIDO, publicadoEm: '2026-10-05', linkDaPublicacao: 'https://velho.exemplo' })
    await modulo.registrarPublicacao('p1', '2026-10-06', 'https://novo.exemplo')
    expect(await lido(modulo)).toMatchObject({ publicadoEm: '2026-10-06', linkDaPublicacao: 'https://novo.exemplo' })
  })

  test('o link só com espaços vira sem link', async () => {
    const modulo = falso('publicacao')
    await modulo.registrarPublicacao('p1', '2026-10-10', '   ')
    expect((await lido(modulo)).linkDaPublicacao).toBeNull()
  })

  test('fora da Publicação e de Concluídos é recusado', async () => {
    expect(await recusa(falso('modelagem').registrarPublicacao('p1', '2026-10-10', null)))
      .toBe('Registre a publicação com o processo na Publicação ou em Concluídos.')
  })

  test('a data no futuro e o link fora de http(s) são recusados', async () => {
    const modulo = falso('publicacao')
    expect(await recusa(modulo.registrarPublicacao('p1', '2099-01-01', null))).toContain('está no futuro')
    expect(await recusa(modulo.registrarPublicacao('p1', hojeLocal(), 'ftp://x'))).toBe('O link do E-protocolo precisa começar com http:// ou https://.')
  })

  test('o suspenso não registra', async () => {
    const modulo = falso('publicacao', { situacao: 'suspenso' })
    expect(await recusa(modulo.registrarPublicacao('p1', '2026-10-10', null))).toContain('Este processo está suspenso')
  })

  test('o concluído fora do Quadro corrige a publicação e registra sem data, como qualquer concluído', async () => {
    const tirado = '2026-10-20T12:00:00Z'
    const comData = falso('concluidos', { ...CONCLUIDO, noQuadro: false, tiradoDoQuadroEm: tirado, publicadoEm: '2026-10-05' })
    await comData.registrarPublicacao('p1', '2026-10-06', null)
    expect(await lido(comData)).toMatchObject({ publicadoEm: '2026-10-06', noQuadro: false })
    const semData = falso('concluidos', { ...CONCLUIDO, noQuadro: false, tiradoDoQuadroEm: tirado, explicacaoSemPublicacao: 'Não será publicado' })
    await semData.registrarPublicacao('p1', '2026-10-06', null)
    expect(await lido(semData)).toMatchObject({ publicadoEm: '2026-10-06', tiradoDoQuadroEm: tirado })
  })

  test('a falha programada deixa o processo como estava', async () => {
    const modulo = falso('publicacao')
    modulo.falhaDeGravacao = 'sem conexão'
    await expect(modulo.registrarPublicacao('p1', '2026-10-10', null)).rejects.toThrow('sem conexão')
    expect((await lido(modulo)).publicadoEm).toBeUndefined()
  })
})
