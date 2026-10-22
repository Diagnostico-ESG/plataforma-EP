import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { voltaDesfazAprovacao } from '../revisoes/conferirAprovacao'
import { FRASE_DA_ESCOLHA_OBRIGATORIA } from './frasesDePublicacao'
import { CODIGO_DA_APROVACAO, CODIGO_DA_PUBLICACAO } from './publicacao'
import type { ProcessoLido } from './tipos'

type Escolha = ProcessoLido['vaiParaPublicacao']

/**
 * Como gravar_escolha_de_publicacao do banco: resolver a Aprovação com a Publicação pendente depois exige a escolha, que
 * passa a ser a do processo; fora disso a escolha recebida é ignorada e a do processo fica.
 */
export function escolhaDoAvanco(processo: ProcessoLido, idDaResolvida: string, vai: Escolha): Escolha {
  const etapas = processo.etapasDoProcesso
  const indice = etapas.findIndex((etapa) => etapa.id === idDaResolvida)
  const comPublicacaoDepois = etapas.some((etapa, posicao) =>
    posicao > indice && etapa.codigo === CODIGO_DA_PUBLICACAO && etapa.status === 'pendente')
  if (etapas[indice]?.codigo !== CODIGO_DA_APROVACAO || !comPublicacaoDepois) return processo.vaiParaPublicacao
  if (vai == null) throw new TravaDoBanco(FRASE_DA_ESCOLHA_OBRIGATORIA)
  return vai
}

/** Como apagar_escolha_da_volta: voltar até a Aprovação ou antes apaga a escolha. */
export function escolhaDaVolta(processo: ProcessoLido, etapaCodigo: string): Escolha {
  return voltaDesfazAprovacao(processo.etapasDoProcesso, etapaCodigo) ? null : processo.vaiParaPublicacao
}
