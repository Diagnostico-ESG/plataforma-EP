import { describe, expect, it } from 'vitest'
import { decidirAjusteDaPasta } from './pasta.ts'

const SETOR_A = 'pasta-do-setor-a'
const SETOR_B = 'pasta-do-setor-b'

describe('decidirAjusteDaPasta', () => {
  it('nada quando o nome e o lugar já batem', () => {
    const ajuste = decidirAjusteDaPasta({ nome: 'Compras', pais: [SETOR_A] }, { nome: 'Compras', paiId: SETOR_A })
    expect(ajuste).toEqual({ renomearPara: null, mover: null })
  })

  it('renomeia quando o processo foi renomeado', () => {
    const ajuste = decidirAjusteDaPasta({ nome: 'Compras', pais: [SETOR_A] }, { nome: 'Compras diretas', paiId: SETOR_A })
    expect(ajuste).toEqual({ renomearPara: 'Compras diretas', mover: null })
  })

  it('renomeia a pasta do setor quando a sigla mudou', () => {
    const ajuste = decidirAjusteDaPasta({ nome: 'DAF', pais: ['raiz'] }, { nome: 'DAFI', paiId: 'raiz' })
    expect(ajuste).toEqual({ renomearPara: 'DAFI', mover: null })
  })

  it('move quando o processo mudou de setor, tirando a pasta do pai antigo', () => {
    const ajuste = decidirAjusteDaPasta({ nome: 'Compras', pais: [SETOR_A] }, { nome: 'Compras', paiId: SETOR_B })
    expect(ajuste).toEqual({ renomearPara: null, mover: { paraPai: SETOR_B, tirarDe: [SETOR_A] } })
  })

  it('renomeia e move quando as duas coisas mudaram', () => {
    const ajuste = decidirAjusteDaPasta({ nome: 'Compras', pais: [SETOR_A] }, { nome: 'Compras diretas', paiId: SETOR_B })
    expect(ajuste).toEqual({ renomearPara: 'Compras diretas', mover: { paraPai: SETOR_B, tirarDe: [SETOR_A] } })
  })

  it('subprocesso reclassificado para outro setor é movido para a pasta do setor novo', () => {
    const ajuste = decidirAjusteDaPasta({ nome: 'Pregão', pais: [SETOR_A] }, { nome: 'Pregão', paiId: SETOR_B })
    expect(ajuste.mover).toEqual({ paraPai: SETOR_B, tirarDe: [SETOR_A] })
  })

  it('pasta sem pai informado pelo Drive é movida para o pai desejado', () => {
    const ajuste = decidirAjusteDaPasta({ nome: 'Compras', pais: [] }, { nome: 'Compras', paiId: SETOR_A })
    expect(ajuste.mover).toEqual({ paraPai: SETOR_A, tirarDe: [] })
  })
})
