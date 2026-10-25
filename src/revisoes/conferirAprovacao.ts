import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { FRASE_DO_LINK_INVALIDO, fraseDaDataNoFuturo } from './frasesDeAprovacao'
import type { DadosDaAprovacao } from './tipos'

/** O link e a data da aprovação, conferidos ao registrar e ao editar (o banco usa as mesmas regras). */
export function conferirLinkEData(dados: DadosDaAprovacao, hoje: string): void {
  if (dados.link !== null && !/^https?:\/\/.+/i.test(dados.link)) throw new TravaDoBanco(FRASE_DO_LINK_INVALIDO)
  if (dados.aprovadaEm !== null && dados.aprovadaEm > hoje) throw new TravaDoBanco(fraseDaDataNoFuturo(dados.aprovadaEm))
}
