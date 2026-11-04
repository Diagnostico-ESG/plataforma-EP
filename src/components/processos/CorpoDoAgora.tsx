import type { MovimentoDoProcessoEmUso } from '../../hooks/useMovimentoDoProcesso'
import type { RegistrosDoProcesso } from '../../hooks/useRegistrosDoProcesso'
import type { Executar } from '../../hooks/useGravacaoComFalha'
import { avisoDoRevisor, nomeDoResponsavel, opcoesDeResponsavel } from '../../processos/agoraDoProcesso'
import { CODIGO_CONCLUIDOS, CODIGO_DA_PUBLICACAO } from '../../processos/codigosDasEtapas'
import { diasDoProcessoNaEtapa, passouDoLimite } from '../../processos/diasNaEtapa'
import { ETIQUETAS, ROTULO_DA_ETIQUETA } from '../../processos/rotulos'
import { hojeEmBrasilia } from '../../lib/datas'
import type { EtiquetaDaEtapa, ModuloDeProcessos, ProcessoLido, UsuarioResponsavel } from '../../processos/tipos'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { Avatar, AvatarVazio } from '../Avatar'
import { PublicacaoNoAgora } from './AgoraDaPublicacao'
import { AcoesDoConcluido } from './AgoraDoConcluido'
import { BotaoDaCaixa } from '../OpcaoDaCaixa'
import { DiasNaEtapa } from './DiasNaEtapa'
import { EtiquetaDoProcesso } from './EtiquetaDoProcesso'
import { RegistrosDoAgora } from './RegistrosDoAgora'
import { TrocaDoResponsavel } from './TrocaDoResponsavel'

type CorpoDoAgoraProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  usuarios: UsuarioResponsavel[]
  /** Quem está na tela. */
  usuarioId: string
  movimento: MovimentoDoProcessoEmUso
  revisoes: ModuloDeRevisoes
  versoes: ModuloDeVersoes
  registros: RegistrosDoProcesso
  executar: Executar
  aoMudar: () => void
  /** O processo foi excluído por outra pessoa: o verso mostra o aviso. */
  aoSumir: () => void
  rotulo: string
}

/**
 * O corpo do Agora para quem altera: a etapa e a etiqueta em listas que gravam ao escolher (sem confirmação), o
 * responsável pelo nome (que abre a troca) e [Assumir], o selo de processo parado e os avisos (revisor, chegada a Concluídos).
 */
export function CorpoDoAgora(props: CorpoDoAgoraProps) {
  const { processo, movimento, rotulo } = props
  const aviso = avisoDoRevisor(processo)
  return (
    <>
      <p className="agora-rotulo">{rotulo}</p>
      <div className="agora-linha">
        <ListasDoAgora processo={processo} movimento={movimento} />
        <ResponsavelDoAgora {...props} />
      </div>
      <div className="agora-avisos">
        <SeloDeParadoNoAgora processo={processo} />
        {aviso && <p className="agora-aviso" role="status">{aviso}</p>}
      </div>
      <div className="agora-campos">
        <RegistrosDoAgora processo={processo} revisoes={props.revisoes} versoes={props.versoes} registros={props.registros} usuarioId={props.usuarioId}
          podeAlterar aoMudar={props.aoMudar} />
        {processo.etapaAtual?.codigo === CODIGO_DA_PUBLICACAO && <PublicacaoNoAgora processo={processo} processos={props.processos} aoMudar={props.aoMudar} />}
        {processo.etapaAtual?.codigo === CODIGO_CONCLUIDOS && <AcoesDoConcluido {...props} />}
      </div>
    </>
  )
}

function ListasDoAgora({ processo, movimento }: Pick<CorpoDoAgoraProps, 'processo' | 'movimento'>) {
  const { etapaAtual } = processo
  const emConcluidos = etapaAtual?.codigo === CODIGO_CONCLUIDOS
  const etiqueta = processo.etiqueta ?? 'a_fazer'
  return (
    <div className="agora-listas">
      <select aria-label="Etapa" className="agora-lista" value={etapaAtual?.id ?? ''} disabled={movimento.gravando}
        onChange={(mudanca) => {
          const destino = processo.etapasDoVerso.find((etapa) => etapa.id === mudanca.target.value)
          if (destino) movimento.mover(processo, destino)
        }}>
        {processo.etapasDoVerso.map((etapa) => <option key={etapa.id} value={etapa.id}>{etapa.nome}</option>)}
      </select>
      {emConcluidos ? (
        <span className="agora-etiqueta" role="img" aria-label={`Status: ${ROTULO_DA_ETIQUETA.concluido}`}>{ROTULO_DA_ETIQUETA.concluido}</span>
      ) : (
        <select aria-label="Status" className="agora-lista" value={etiqueta} disabled={movimento.gravando}
            onChange={(mudanca) => movimento.mudarEtiqueta(processo.id, mudanca.target.value as EtiquetaDaEtapa)}>
            <BotaoDaCaixa />
            {ETIQUETAS.map((opcao) => <option key={opcao} value={opcao}><EtiquetaDoProcesso etiqueta={opcao} /></option>)}
          </select>
      )}
    </div>
  )
}

/** A foto ao lado do nome escrito: só enfeite, para o leitor de tela não ler o nome duas vezes. Sem responsável, o círculo tracejado diz isso. */
export function FotoDoResponsavel({ processo }: { processo: ProcessoLido }) {
  const { responsavel } = processo
  if (!responsavel) return <AvatarVazio tamanho={32} />
  return <Avatar nome={responsavel.nome} fotoUrl={responsavel.fotoUrl ?? undefined} tamanho={32} decorativo />
}

/** Só o selo do processo parado: o tempo até 7 dias saiu da linha do responsável. */
export function SeloDeParadoNoAgora({ processo }: { processo: ProcessoLido }) {
  const dias = diasDoProcessoNaEtapa(processo, hojeEmBrasilia())
  return dias !== null && passouDoLimite(dias) && <DiasNaEtapa dias={dias} />
}

function ResponsavelDoAgora({ processo, usuarios, usuarioId, movimento }: CorpoDoAgoraProps) {
  const opcoes = opcoesDeResponsavel(processo, usuarios, usuarioId)
  return (
    <p className="agora-responsavel">
      <FotoDoResponsavel processo={processo} />
      <TrocaDoResponsavel responsavelId={processo.responsavel?.id ?? null} nome={nomeDoResponsavel(processo)} opcoes={opcoes}
        desabilitada={movimento.gravando} aoEscolher={(escolhido) => movimento.mudarResponsavel(processo.id, escolhido)} />
    </p>
  )
}

