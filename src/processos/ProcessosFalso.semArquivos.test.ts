import { describe, expect, test } from 'vitest'
import { CATALOGO_DE_TESTE, umProcessoLido } from '../testes/processoDaLista'
import { ProcessosFalso } from './ProcessosFalso'
import type { ArquivosDoProcesso, ProcessoLido } from './tipos'

const NADA: ArquivosDoProcesso = { versaoPiloto: false, versaoEmSequencia: false, relatorioNumerado: false }
const idDa = (codigo: string) => CATALOGO_DE_TESTE.find((etapa) => etapa.codigo === codigo)?.id as string

function falso(processo: ProcessoLido): ProcessosFalso {
  const modulo = new ProcessosFalso()
  modulo.etapasDoCatalogo = CATALOGO_DE_TESTE
  modulo.processos = [processo]
  return modulo
}

// ADR 0028: o banco aceita mover sem os arquivos e grava o que faltava; a falsa guarda isso na chamada.
describe('mover sem os arquivos da etapa, como o banco', () => {
  test('sair da Modelagem piloto sem versão piloto move e guarda o que faltava', async () => {
    const modulo = falso(umProcessoLido('P', { id: 'p1', arquivos: NADA }, 'modelagem'))
    await modulo.moverProcesso('p1', idDa('relatorio_modelagem_tecnica'))
    expect((await modulo.lerProcesso('p1'))?.etapaAtual?.codigo).toBe('relatorio_modelagem_tecnica')
    expect(modulo.chamadas[0].semArquivos).toEqual([{ etapa: 'modelagem', pecas: ['versao_piloto'] }])
  })

  test('sair da técnica guarda só o que falta', async () => {
    const modulo = falso(umProcessoLido('P', { id: 'p1', arquivos: { ...NADA, versaoEmSequencia: true } }, 'relatorio_modelagem_tecnica'))
    await modulo.moverProcesso('p1', idDa('revisao_interna'))
    expect(modulo.chamadas[0].semArquivos).toEqual([{ etapa: 'relatorio_modelagem_tecnica', pecas: ['relatorio'] }])
  })

  test('atravessando as duas etapas guarda as duas, em ordem', async () => {
    const modulo = falso(umProcessoLido('P', { id: 'p1', arquivos: NADA }, 'nao_iniciados'))
    await modulo.moverProcesso('p1', idDa('revisao_interna'))
    expect(modulo.chamadas[0].semArquivos).toEqual([
      { etapa: 'modelagem', pecas: ['versao_piloto'] }, { etapa: 'relatorio_modelagem_tecnica', pecas: ['versao', 'relatorio'] },
    ])
  })

  test('com o que a etapa pede, voltar, ou sem saber o que o processo tem, não guarda nada', async () => {
    const completo = falso(umProcessoLido('P', { id: 'p1', arquivos: { ...NADA, versaoPiloto: true } }, 'modelagem'))
    await completo.moverProcesso('p1', idDa('relatorio_modelagem_tecnica'))
    await completo.moverProcesso('p1', idDa('modelagem'))
    expect(completo.chamadas).toEqual([
      { acao: 'mover', id: 'p1', etapaId: idDa('relatorio_modelagem_tecnica') }, { acao: 'mover', id: 'p1', etapaId: idDa('modelagem') },
    ])
    const montado = falso(umProcessoLido('P', { id: 'p1' }, 'modelagem'))
    await montado.moverProcesso('p1', idDa('revisao_interna'))
    expect(montado.chamadas[0]).not.toHaveProperty('semArquivos')
  })
})
