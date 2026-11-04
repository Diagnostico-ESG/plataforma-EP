import { describe, expect, it } from 'vitest'
import { criarMemoriaDePastas, estaSobARaiz, estaSobARaizComMemoria, type LerPais } from './raiz.ts'

const RAIZ = 'raiz-do-ambiente'

// O Drive do teste: arquivo -> pasta do processo -> pasta do setor -> raiz; "de-fora" é outro Drive.
const PAIS_NO_DRIVE: Record<string, string[]> = {
  // O anexo mora uma pasta mais fundo: arquivo -> Anexos -> processo -> setor -> raiz (ADR 0027).
  'pasta-anexos': ['pasta-do-processo'],
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

  it('aceita o anexo: na subpasta Anexos, que está na pasta do processo, do setor, na raiz', async () => {
    const { lerPais } = drive()
    expect(await estaSobARaiz(['pasta-anexos'], RAIZ, lerPais)).toBe(true)
  })

  it('aceita se qualquer um dos pais leva à raiz', async () => {
    const { lerPais } = drive()
    expect(await estaSobARaiz(['pasta-solta', 'pasta-do-processo'], RAIZ, lerPais)).toBe(true)
  })

  it('para depois de três níveis acima do pai (anexo, Anexos, processo, setor, raiz) e não segue ciclo', async () => {
    const { lerPais, lidos } = drive()
    expect(await estaSobARaiz(['pasta-em-ciclo'], RAIZ, lerPais)).toBe(false)
    expect(lidos.length).toBeLessThanOrEqual(3)
    const profundo: LerPais = (id) => Promise.resolve(id === 'a' ? ['b'] : id === 'b' ? ['c'] : id === 'c' ? ['d'] : id === 'd' ? [RAIZ] : null)
    expect(await estaSobARaiz(['a'], RAIZ, profundo)).toBe(false)
  })
})

// miniatura-rapida (ADR 0038): a pasta conferida fica lembrada por 5 minutos; recusa e falha nunca.
const CINCO_MINUTOS = 5 * 60 * 1000

function comRelogio() {
  let agora = 1_000_000
  const memoria = criarMemoriaDePastas(() => agora)
  return { memoria, passar: (ms: number) => { agora += ms } }
}

describe('estaSobARaizComMemoria', () => {
  it('aceita o anexo também pela conferência com memória', async () => {
    const { lerPais } = drive()
    const { memoria } = comRelogio()
    expect(await estaSobARaizComMemoria(['pasta-anexos'], RAIZ, lerPais, memoria)).toBe(true)
  })

  it('na segunda conferência da mesma pasta não lê o Drive de novo', async () => {
    const { lerPais, lidos } = drive()
    const { memoria } = comRelogio()
    expect(await estaSobARaizComMemoria(['pasta-do-processo'], RAIZ, lerPais, memoria)).toBe(true)
    expect(lidos).toEqual(['pasta-do-processo', 'pasta-do-setor'])
    expect(await estaSobARaizComMemoria(['pasta-do-processo'], RAIZ, lerPais, memoria)).toBe(true)
    expect(lidos).toHaveLength(2)
  })

  it('depois de 5 minutos confere o Drive de novo (e vale a resposta nova)', async () => {
    const drivePrimeiro = drive()
    const { memoria, passar } = comRelogio()
    await estaSobARaizComMemoria(['pasta-do-processo'], RAIZ, drivePrimeiro.lerPais, memoria)
    passar(CINCO_MINUTOS - 1)
    await estaSobARaizComMemoria(['pasta-do-processo'], RAIZ, drivePrimeiro.lerPais, memoria)
    expect(drivePrimeiro.lidos).toHaveLength(2)
    passar(2)
    const movida: LerPais = (id) => Promise.resolve(id === 'pasta-do-processo' ? ['pasta-solta'] : (PAIS_NO_DRIVE[id] ?? null))
    expect(await estaSobARaizComMemoria(['pasta-do-processo'], RAIZ, movida, memoria)).toBe(false)
  })

  it('nunca lembra a pasta recusada nem a que o Drive não achou: confere de novo', async () => {
    const { lerPais, lidos } = drive()
    const { memoria } = comRelogio()
    expect(await estaSobARaizComMemoria(['pasta-solta'], RAIZ, lerPais, memoria)).toBe(false)
    const lidosNaPrimeira = lidos.length
    expect(await estaSobARaizComMemoria(['pasta-solta'], RAIZ, lerPais, memoria)).toBe(false)
    expect(lidos.length).toBe(lidosNaPrimeira * 2)
    expect(await estaSobARaizComMemoria(['pasta-que-nao-existe'], RAIZ, lerPais, memoria)).toBe(false)
  })

  it('uma falha ao ler o Drive passa adiante e não deixa nada lembrado', async () => {
    const { memoria } = comRelogio()
    const falha: LerPais = () => Promise.reject(new Error('Drive fora do ar'))
    await expect(estaSobARaizComMemoria(['pasta-do-processo'], RAIZ, falha, memoria)).rejects.toThrow('Drive fora do ar')
    const { lerPais, lidos } = drive()
    expect(await estaSobARaizComMemoria(['pasta-do-processo'], RAIZ, lerPais, memoria)).toBe(true)
    expect(lidos).toEqual(['pasta-do-processo', 'pasta-do-setor'])
  })

  it('aceita se qualquer um dos pais leva à raiz e lembra só o pai que levou', async () => {
    const { lerPais, lidos } = drive()
    const { memoria } = comRelogio()
    expect(await estaSobARaizComMemoria(['pasta-solta', 'pasta-do-processo'], RAIZ, lerPais, memoria)).toBe(true)
    lidos.length = 0
    expect(await estaSobARaizComMemoria(['pasta-do-processo'], RAIZ, lerPais, memoria)).toBe(true)
    expect(await estaSobARaizComMemoria(['pasta-solta'], RAIZ, lerPais, memoria)).toBe(false)
    expect(lidos).toContain('pasta-solta')
    expect(lidos).not.toContain('pasta-do-processo')
  })

  it('o pai que é a própria raiz continua valendo sem ler nada', async () => {
    const { lerPais, lidos } = drive()
    expect(await estaSobARaizComMemoria([RAIZ], RAIZ, lerPais, comRelogio().memoria)).toBe(true)
    expect(lidos).toEqual([])
  })
})
