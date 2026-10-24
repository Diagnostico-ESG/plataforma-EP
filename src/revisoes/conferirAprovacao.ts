import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { FRASE_DO_LINK_INVALIDO, fraseDaAprovacaoAntesDaRevisao, fraseDaDataNoFuturo } from './frasesDeAprovacao'
import type { DadosDaAprovacao } from './tipos'

/** O link e a data da aprovação, conferidos na edição (o banco usa as mesmas funções ao registrar). */
export function conferirLinkEData(dados: DadosDaAprovacao, ultimaRevisao: string | null, hoje: string): void {
  if (dados.link !== null && !/^https?:\/\/.+/i.test(dados.link)) throw new TravaDoBanco(FRASE_DO_LINK_INVALIDO)
  const data = dados.aprovadaEm
  if (data === null) return
  if (data > hoje) throw new TravaDoBanco(fraseDaDataNoFuturo(data))
  if (ultimaRevisao !== null && data < ultimaRevisao) throw new TravaDoBanco(fraseDaAprovacaoAntesDaRevisao(`${data}:${ultimaRevisao}`))
}
