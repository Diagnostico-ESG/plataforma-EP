import { Pilula } from '../Pilula'
import { marcaDaSituacao } from '../../versoes/situacaoNoDrive'
import type { SituacaoNoDrive } from '../../versoes/tipos'

/** A pílula com texto (nunca só cor) do arquivo que mudou ou sumiu no Drive; nada quando está certo ou não foi conferido. */
export function MarcaNoDrive({ situacao }: { situacao: SituacaoNoDrive | undefined }) {
  const texto = marcaDaSituacao(situacao)
  return texto ? <Pilula situacao="atraso">{texto}</Pilula> : null
}
