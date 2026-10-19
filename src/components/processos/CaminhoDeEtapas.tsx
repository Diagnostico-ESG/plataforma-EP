import type { AcoesDaEtapaEmUso } from '../../hooks/useAcoesDaEtapa'
import { acoesDaEtapa, ehEtapaDoProcesso, indiceDaEtapaAtual, podeAssumir, proximaPendente } from '../../processos/caminhoDeEtapas'
import type { DatasDaEtapa, EtapaDoCaminho, ModuloDeProcessos, UltimaVersao, UsuarioResponsavel } from '../../processos/tipos'
import { EdicaoDaEtapa } from './EdicaoDaEtapa'
import { LinhaDaEtapa } from './LinhaDaEtapa'

type CaminhoDeEtapasProps = {
  processos: ModuloDeProcessos
  /** Do setor ou do processo (só esta traz o responsável). */
  etapas: EtapaDoCaminho[]
  podeAlterar: boolean
  /** Quem pode ser responsável; sem a lista, não há seletor de responsável. */
  usuarios?: UsuarioResponsavel[]
  /** Quem está na tela: o [Assumir] o põe como responsável. */
  usuarioId: string
  /** A versão mais recente não histórica do processo: o autor dela não pode assumir a Revisão interna. */
  ultimaVersao: UltimaVersao | null
  /** As ações e janelas da etapa, que o dono do caminho guarda. */
  acoes: AcoesDaEtapaEmUso
  aoMudar: () => void
  aoSumir: () => void
}

// O nome fica de fora quando o seletor o mostra e na etapa sem responsável lido: undefined esconde a linha.
function nomeDoResponsavel(etapa: EtapaDoCaminho, comSeletor: boolean): string | null | undefined {
  return ehEtapaDoProcesso(etapa) && !comSeletor ? etapa.responsavelNome : undefined
}

/**
 * O caminho de etapas (do setor ou do processo): só a etapa atual anda e as resolvidas anteriores voltam;
 * Dispensar, Realizada anteriormente e Voltar pedem nota ou motivo. Quem pode alterar também corrige as datas.
 */
export function CaminhoDeEtapas({
  processos, etapas, podeAlterar, usuarios, usuarioId, ultimaVersao, acoes, aoMudar, aoSumir,
}: CaminhoDeEtapasProps) {
  const { agir, mudarResponsavel } = acoes
  const atual = indiceDaEtapaAtual(etapas)

  async function corrigirDatas(etapa: EtapaDoCaminho, datas: DatasDaEtapa) {
    await processos.corrigirDatasDaEtapa(etapa.id, datas)
    aoMudar()
  }

  return (
    <ol className="caminho-de-etapas">
      {etapas.map((etapa, indice) => (
        <LinhaDaEtapa key={etapa.id} etapa={etapa} atual={indice === atual}
          acoes={podeAlterar ? acoesDaEtapa(etapas, indice) : []} aoAgir={(acao) => agir(acao, etapa, proximaPendente(etapas, indice))}
          responsavelNome={nomeDoResponsavel(etapa, podeAlterar && usuarios !== undefined)}
          responsavelInativo={ehEtapaDoProcesso(etapa) && etapa.responsavelInativo}>
          {podeAlterar && (
            <EdicaoDaEtapa etapa={etapa} usuarios={usuarios} aoSumir={aoSumir}
              aoCorrigirDatas={(datas) => corrigirDatas(etapa, datas)}
              aoEscolherResponsavel={(escolhido) => mudarResponsavel(etapa, escolhido)}
              aoAssumir={podeAssumir(etapa, usuarioId, ultimaVersao) ? () => mudarResponsavel(etapa, usuarioId) : undefined} />
          )}
        </LinhaDaEtapa>
      ))}
    </ol>
  )
}
