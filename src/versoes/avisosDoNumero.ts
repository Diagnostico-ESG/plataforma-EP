import { rotuloDaVersao } from './rotulos'
import type { Versao } from './tipos'

type Tipo = Pick<Versao, 'numero' | 'historica' | 'piloto'>

/** A ordem dos tipos no processo: histórica, depois piloto, depois em sequência (ADR 0025). */
function posicaoDoTipo({ historica, piloto }: Pick<Versao, 'historica' | 'piloto'>): number {
  return historica ? 0 : piloto ? 1 : 2
}

/** A outra versão mais perto do número novo que deixa a ordem dos tipos quebrada, ou null. */
function versaoForaDeOrdem(outras: Tipo[], editada: Tipo, numeroNovo: number): { vizinha: Tipo; depois: boolean } | null {
  const tipo = posicaoDoTipo(editada)
  const depois = outras.filter((outra) => outra.numero < numeroNovo && posicaoDoTipo(outra) > tipo)
  const antes = outras.filter((outra) => outra.numero > numeroNovo && posicaoDoTipo(outra) < tipo)
  if (depois.length > 0) return { vizinha: depois.reduce((a, b) => (b.numero > a.numero ? b : a)), depois: true }
  if (antes.length > 0) return { vizinha: antes.reduce((a, b) => (b.numero < a.numero ? b : a)), depois: false }
  return null
}

function avisoDeOrdem(outras: Versao[], versao: Versao, numeroNovo: number): string[] {
  const fora = versaoForaDeOrdem(outras, versao, numeroNovo)
  if (!fora) return []
  const nova = rotuloDaVersao({ ...versao, numero: numeroNovo })
  return [`A ${nova} ficará ${fora.depois ? 'depois' : 'antes'} da ${rotuloDaVersao(fora.vizinha)}.`]
}

/** Só a versão em sequência precisa da anterior logo antes; a histórica e a piloto podem ter saltos entre si. */
function avisoDeSalto(outras: Versao[], versao: Versao, numeroNovo: number): string[] {
  if (versao.historica || versao.piloto) return []
  if (outras.some((outra) => outra.numero === numeroNovo - 1)) return []
  const anteriores = outras.filter((outra) => outra.numero < numeroNovo)
  if (anteriores.length === 0) return []
  const anterior = anteriores.reduce((a, b) => (b.numero > a.numero ? b : a))
  return [`A V${numeroNovo} ficará depois da ${rotuloDaVersao(anterior)}, sem a V${numeroNovo - 1}.`]
}

function avisoDaAprovada(versao: Versao): string[] {
  return versao.aprovada ? [`A ${rotuloDaVersao(versao)} foi aprovada, e o E-protocolo cita esse número.`] : []
}

/**
 * Os avisos (amarelos, sem impedir) da edição do número (ADR 0028): a ordem dos tipos deixa de ser histórica → piloto →
 * em sequência, uma versão em sequência fica sem a anterior logo antes, ou a versão é a aprovada. Vale só para a versão
 * editada, já no número novo; os avisos saem juntos, sem a pergunta "Gravar assim mesmo?" (a janela a põe uma vez).
 */
export function avisosDoNumero(versoes: Versao[], versao: Versao, numeroNovo: number): string[] {
  const outras = versoes.filter((outra) => outra.id !== versao.id)
  return [...avisoDeOrdem(outras, versao, numeroNovo), ...avisoDeSalto(outras, versao, numeroNovo), ...avisoDaAprovada(versao)]
}
