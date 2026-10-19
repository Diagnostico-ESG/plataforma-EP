import type { AcoesDaEtapaEmUso } from '../../hooks/useAcoesDaEtapa'
import {
  acoesDaEtapa, opcoesDeResponsavel, podeAssumir, proximaPendente, rotuloDoAgora, usuariosParaAEtapa,
} from '../../processos/caminhoDeEtapas'
import { diasNaEtapa, passouDoLimite, textoDosDias } from '../../processos/diasNaEtapa'
import { hojeLocal } from '../../processos/textoDaReuniao'
import type { EtapaDoProcesso, UltimaVersao, UsuarioResponsavel } from '../../processos/tipos'
import { Avatar } from '../Avatar'
import { type ItemDoMenu, MenuDeAcoes } from '../MenuDeAcoes'
import { DiasNaEtapa } from './DiasNaEtapa'
import { TrocaDoResponsavel } from './TrocaDoResponsavel'

type EtapaDoAgoraProps = {
  etapas: EtapaDoProcesso[]
  /** O índice da etapa atual em `etapas`. */
  indice: number
  podeAlterar: boolean
  usuarios: UsuarioResponsavel[]
  /** Quem está na tela. */
  usuarioId: string
  ultimaVersao: UltimaVersao | null
  acoes: AcoesDaEtapaEmUso
}

const ROTULO_DA_ACAO_RARA: Record<string, string> = { dispensar: 'Dispensar', realizada: 'Realizada anteriormente' }

/** O corpo do Agora: a etapa atual, quem cuida dela, os dias e o único botão principal (spec, "Coluna esquerda — Agora"). */
export function EtapaDoAgora(props: EtapaDoAgoraProps) {
  const { etapas, indice, podeAlterar } = props
  const etapa = etapas[indice]
  const dias = diasNaEtapa(etapa.iniciadaEm, hojeLocal())
  return (
    <>
      <p className="agora-rotulo">{rotuloDoAgora(indice, etapas.length)}</p>
      <h3 className="agora-etapa">{etapa.nome}</h3>
      {podeAlterar ? <ResponsavelDoAgora {...props} dias={dias} /> : <LinhaDaConsulta etapa={etapa} dias={dias} />}
      {podeAlterar && <BotoesDoAgora {...props} />}
    </>
  )
}

function ResponsavelDoAgora({ etapas, indice, usuarios, usuarioId, ultimaVersao, acoes, dias }: EtapaDoAgoraProps & { dias: number | null }) {
  const etapa = etapas[indice]
  const opcoes = opcoesDeResponsavel(etapa, usuariosParaAEtapa(etapa, usuarios, ultimaVersao), usuarioId)
  return (
    <p className="agora-responsavel">
      {etapa.responsavelNome ? (
        <>
          <Avatar nome={etapa.responsavelNome} tamanho={24} />
          <span>{etapa.responsavelNome}{etapa.responsavelInativo && ' (Inativo)'}</span>
        </>
      ) : <span>Sem responsável</span>}
      {dias !== null && <DiasNaEtapa dias={dias} />}
      <TrocaDoResponsavel etapa={etapa} opcoes={opcoes} aoEscolher={(escolhido) => acoes.mudarResponsavel(etapa, escolhido)} />
    </p>
  )
}

// Com mais de 15 dias a pílula vem no lugar do número; até lá a frase é uma só ("Com Ana M. há 6 dias").
function LinhaDaConsulta({ etapa, dias }: { etapa: EtapaDoProcesso; dias: number | null }) {
  if (!etapa.responsavelNome) return <p className="agora-responsavel"><span>Sem responsável</span></p>
  if (dias !== null && passouDoLimite(dias)) {
    return <p className="agora-responsavel"><span>{`Com ${etapa.responsavelNome}`}</span><DiasNaEtapa dias={dias} /></p>
  }
  const quando = dias === null ? '' : ` ${textoDosDias(dias)}`
  return <p className="agora-responsavel"><span>{`Com ${etapa.responsavelNome}${quando}`}</span></p>
}

function BotoesDoAgora({ etapas, indice, usuarioId, ultimaVersao, acoes }: EtapaDoAgoraProps) {
  const etapa = etapas[indice]
  const [principal, ...raras] = acoesDaEtapa(etapas, indice)
  const proxima = proximaPendente(etapas, indice)
  const menu: ItemDoMenu[] = raras.map((acao) => ({
    rotulo: ROTULO_DA_ACAO_RARA[acao], aoEscolher: () => acoes.agir(acao, etapa, proxima),
  }))
  return (
    <div className="agora-botoes">
      <button type="button" className="botao botao-principal" onClick={() => acoes.agir(principal, etapa, proxima)}>
        {principal === 'iniciar' ? 'Iniciar' : 'Concluir'} {etapa.nome}
      </button>
      {!etapa.responsavelNome && podeAssumir(etapa, usuarioId, ultimaVersao) && (
        <button type="button" className="botao botao-secundario" aria-label={`Assumir ${etapa.nome}`}
          onClick={() => acoes.mudarResponsavel(etapa, usuarioId)}>
          Assumir
        </button>
      )}
      <MenuDeAcoes rotulo="Mais ações da etapa" grupos={[menu]} />
    </div>
  )
}
