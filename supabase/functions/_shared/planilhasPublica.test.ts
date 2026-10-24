import { describe, expect, it } from 'vitest'
import { dataEHoraDeBrasilia, montarPlanilhaPublica } from './planilhasPublica.ts'
import { pacoteDoCenario } from './planilhasCenario.ts'

const abas = montarPlanilhaPublica(pacoteDoCenario())
const resumo = abas[0]
const fases = abas[1]

describe('montarPlanilhaPublica', () => {
  it('traz duas abas, Resumo e Fases', () => {
    expect(abas.map((aba) => aba.titulo)).toEqual(['Resumo', 'Fases'])
  })

  it('o resumo traz o total de processos, o total de setores e a data e hora da atualização', () => {
    expect(resumo.linhas[0]).toEqual(['Total de processos', 'Total de setores', 'Atualizado em'])
    expect(resumo.linhas[1]).toEqual([6, 3, '2026-10-20 09:00'])
  })

  it('o total de processos não conta o suspenso nem o cancelado, e o de setores só olha os que entram', () => {
    expect(resumo.linhas[1].slice(0, 2)).toEqual([6, 3])
  })

  it('a aba Fases traz uma linha por fase, de I a VII, com concluídos e total', () => {
    expect(fases.linhas[0]).toEqual(['Fase', 'Concluídos', 'Total'])
    expect(fases.linhas.slice(1)).toEqual([
      ['I', 6, 6], ['II', 6, 6], ['III', 6, 6], ['IV', 3, 6], ['V', 3, 6], ['VI', 3, 6], ['VII', 2, 6],
    ])
  })

  it('a fase VII conta só os publicados: o publicado e o arquivado, não o concluído sem publicação', () => {
    const fasesDeVII = fases.linhas.find((linha) => linha[0] === 'VII')
    expect(fasesDeVII?.[1]).toBe(2)
  })

  it('sem processo nenhum, traz zeros e as sete fases', () => {
    const vazio = { ...pacoteDoCenario(), processos: [], passagens: [] }
    const [resumoVazio, fasesVazias] = montarPlanilhaPublica(vazio)
    expect(resumoVazio.linhas[1].slice(0, 2)).toEqual([0, 0])
    expect(fasesVazias.linhas).toHaveLength(8)
  })

  it('nenhuma linha traz nome de processo, de setor, observação ou de pessoa', () => {
    const texto = JSON.stringify(abas)
    for (const proibido of ['Comum', 'Sub', 'Classif', 'Suspenso', 'Publicado', 'Obs inventada', 'Fulana Secreta', 'Macro Inventado', 'SET']) {
      expect(texto).not.toContain(proibido)
    }
  })

  it('nenhuma linha traz identificador de processo nem de planilha', () => {
    const texto = JSON.stringify(abas)
    expect(texto).not.toContain('00000000-')
    expect(texto).not.toContain('id-da-planilha')
  })
})

describe('dataEHoraDeBrasilia', () => {
  it('converte a hora UTC para Brasília (UTC-3, sem horário de verão)', () => {
    expect(dataEHoraDeBrasilia('2026-10-20T12:00:00Z')).toBe('2026-10-20 09:00')
  })

  it('vira o dia quando é madrugada em UTC', () => {
    expect(dataEHoraDeBrasilia('2026-10-21T02:30:00Z')).toBe('2026-10-20 23:30')
  })

  it('a meia-noite de Brasília sai 00:00, não 24:00', () => {
    expect(dataEHoraDeBrasilia('2026-10-20T03:00:00Z')).toBe('2026-10-20 00:00')
  })
})
