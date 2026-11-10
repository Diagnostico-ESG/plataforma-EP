// O relatório das lacunas da importação dos arquivos (ticket 02, história 48c): os buracos na numeração da pasta e a
// diferença entre a pasta e as colunas V1 a V8 da planilha. Só comparação: nada aqui decide o que entra.
import { chaveDoProcesso } from './chaves'
import type { PastaLida } from './lerPasta'
import type { PlanilhaLida } from './lerPlanilha'

export type LacunaDaVersao = { chave: string; nomeDoProcesso: string; numero: number }
export type Lacunas = {
  buracos: { chave: string; nomeDoProcesso: string; faltam: number[] }[]
  soNaPasta: LacunaDaVersao[]
  soNaPlanilha: LacunaDaVersao[]
}

type NumerosPorProcesso = Map<string, { nomeDoProcesso: string; numeros: Set<number> }>

function acrescentar(mapa: NumerosPorProcesso, chave: string, nomeDoProcesso: string, numero: number): void {
  const atual = mapa.get(chave) ?? { nomeDoProcesso, numeros: new Set<number>() }
  atual.numeros.add(numero)
  mapa.set(chave, atual)
}

// A pasta conta tudo o que tem número, inclusive a versão sem .bpm ou com arquivo duplicado: o arquivo existe.
function numerosDaPasta(pasta: PastaLida): NumerosPorProcesso {
  const mapa: NumerosPorProcesso = new Map()
  for (const v of [...pasta.versoes, ...pasta.semBpm, ...pasta.duplicados]) acrescentar(mapa, v.chave, v.nomeDoProcesso, v.numero)
  return mapa
}

function numerosDaPlanilha(planilha: PlanilhaLida): NumerosPorProcesso {
  const mapa: NumerosPorProcesso = new Map()
  for (const p of planilha.processos) {
    const chave = chaveDoProcesso(p.setor, p.nome)
    mapa.set(chave, { nomeDoProcesso: p.nome, numeros: new Set(p.versoesNaPlanilha) })
  }
  return mapa
}

function buracosDe(numeros: Set<number>): number[] {
  const maior = Math.max(...numeros)
  return Array.from({ length: maior }, (_, i) => i + 1).filter((n) => !numeros.has(n))
}

// As versões de `de` que `em` não tem, só nos processos que `em` conhece quando `soConhecidos` (a pasta não compara
// processo que a planilha não lista: esse já sai como arquivo sem processo).
function diferenca(de: NumerosPorProcesso, em: NumerosPorProcesso, soConhecidos: boolean): LacunaDaVersao[] {
  return [...de].flatMap(([chave, { nomeDoProcesso, numeros }]) => {
    const outro = em.get(chave)
    if (soConhecidos && !outro) return []
    return [...numeros].sort((a, b) => a - b).filter((n) => !outro?.numeros.has(n)).map((numero) => ({ chave, nomeDoProcesso, numero }))
  })
}

export function lacunasDaPasta(pasta: PastaLida, planilha: PlanilhaLida): Lacunas {
  const daPasta = numerosDaPasta(pasta)
  const daPlanilha = numerosDaPlanilha(planilha)
  const buracos = [...daPasta]
    .map(([chave, { nomeDoProcesso, numeros }]) => ({ chave, nomeDoProcesso, faltam: buracosDe(numeros) }))
    .filter((b) => b.faltam.length > 0)
  return { buracos, soNaPasta: diferenca(daPasta, daPlanilha, true), soNaPlanilha: diferenca(daPlanilha, daPasta, false) }
}
