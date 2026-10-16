import { describe, expect, it } from 'vitest'
import { estaSobARaiz, type LerPais } from './raiz.ts'

const RAIZ = 'raiz-do-ambiente'

// O Drive do teste: arquivo -> pasta do processo -> pasta do setor -> raiz; "de-fora" é outro Drive.
const PAIS_NO_DRIVE: Record<string, string[]> = {
  'pasta-do-processo': ['pasta-do-setor'],
  'pasta-do-setor': [RAIZ],
  'pasta-solta': ['outro-drive'],
  'outro-drive': [],
  'pasta-em-ciclo': ['pasta-em-ciclo'],
}

function drive(): { lerPais: LerPais; lidos: string[] } {
  const lidos: string[] = []
  const lerPais: LerPais = (id) => {
    lidos.push(id)
    return Promise.resolve(PAIS_NO_DRIVE[id] ?? null)
  }
  return { lerPais, lidos }
}

describe('estaSobARaiz', () => {
  it('aceita o item cujo pai é a raiz, sem ler nada no Drive', async () => {
    const { lerPais, lidos } = drive()
    expect(await estaSobARaiz([RAIZ], RAIZ, lerPais)).toBe(true)
    expect(lidos).toEqual([])
  })

  it('aceita o arquivo na pasta do processo, que está na pasta do setor, que está na raiz', async () => {
    const { lerPais } = drive()
    expect(await estaSobARaiz(['pasta-do-processo'], RAIZ, lerPais)).toBe(true)
  })

  it('recusa o item que está noutro Drive', async () => {
    const { lerPais } = drive()
    expect(await estaSobARaiz(['pasta-solta'], RAIZ, lerPais)).toBe(false)
    expect(await estaSobARaiz(['outro-drive'], RAIZ, lerPais)).toBe(false)
  })

  it('recusa o item sem pais e o pai que o Drive não acha', async () => {
    const { lerPais } = drive()
    expect(await estaSobARaiz([], RAIZ, lerPais)).toBe(false)
    expect(await estaSobARaiz(['pasta-que-nao-existe'], RAIZ, lerPais)).toBe(false)
  })

  it('aceita se qualquer um dos pais leva à raiz', async () => {
    const { lerPais } = drive()
    expect(await estaSobARaiz(['pasta-solta', 'pasta-do-processo'], RAIZ, lerPais)).toBe(true)
  })

  it('para depois de dois níveis acima do pai (arquivo, processo, setor, raiz) e não segue ciclo', async () => {
    const { lerPais, lidos } = drive()
    expect(await estaSobARaiz(['pasta-em-ciclo'], RAIZ, lerPais)).toBe(false)
    expect(lidos.length).toBeLessThanOrEqual(2)
    const profundo: LerPais = (id) => Promise.resolve(id === 'a' ? ['b'] : id === 'b' ? ['c'] : id === 'c' ? [RAIZ] : null)
    expect(await estaSobARaiz(['a'], RAIZ, profundo)).toBe(false)
  })
})
