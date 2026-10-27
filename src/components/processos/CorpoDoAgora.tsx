import { useId } from 'react'
import type { MovimentoDoProcessoEmUso } from '../../hooks/useMovimentoDoProcesso'
import type { RegistrosDoProcesso } from '../../hooks/useRegistrosDoProcesso'
import type { Executar } from '../../hooks/useGravacaoComFalha'
import { avisoDoRevisor, opcoesDeResponsavel, podeAssumir } from '../../processos/agoraDoProcesso'
import { CODIGO_CONCLUIDOS, CODIGO_DA_PUBLICACAO } from '../../processos/codigosDasEtapas'
import { diasDoProcessoNaEtapa } from '../../processos/diasNaEtapa'
import { ETIQUETAS, ROTULO_DA_ETIQUETA } from '../../processos/rotulos'
import { hojeEmBrasilia } from '../../lib/datas'
import type { EtiquetaDaEtapa, ModuloDeProcessos, ProcessoLido, UsuarioResponsavel } from '../../processos/tipos'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { Avatar } from '../Avatar'
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
  rotulo: string
}

/**
 * O corpo do Agora para quem altera: a etapa e a etiqueta em listas que gravam ao escolher (sem confirmação), o
 * responsável com "Trocar" e [Assumir], os dias na etapa e os avisos (revisor, chegada a Concluídos).
 */
export function CorpoDoAgora(props: CorpoDoAgoraProps) {
  const { processo, movimento, rotulo } = props
  const aviso = avisoDoRevisor(processo)
  return (
    <>
      <p className="agora-rotulo">{rotulo}</p>
      <ListasDoAgora processo={processo} movimento={movimento} />
      <ResponsavelDoAgora {...props} />
      <RegistrosDoAgora processo={processo} revisoes={props.revisoes} versoes={props.versoes} registros={props.registros} usuarioId={props.usuarioId}
        podeAlterar aoMudar={props.aoMudar} />
      {aviso && <p className="agora-aviso" role="status">{aviso}</p>}
      {processo.etapaAtual?.codigo === CODIGO_DA_PUBLICACAO && <PublicacaoNoAgora processo={processo} processos={props.processos} aoMudar={props.aoMudar} />}
      {processo.etapaAtual?.codigo === CODIGO_CONCLUIDOS && <AcoesDoConcluido {...props} />}
    </>
  )
}

function ListasDoAgora({ processo, movimento }: Pick<CorpoDoAgoraProps, 'processo' | 'movimento'>) {
  const idDaEtapa = useId()
  const idDaEtiqueta = useId()
  const { etapaAtual } = processo
  const emConcluidos = etapaAtual?.codigo === CODIGO_CONCLUIDOS
  const etiqueta = processo.etiqueta ?? 'a_fazer'
  return (
    <div className="agora-listas">
      <label className="agora-campo" htmlFor={idDaEtapa}>Etapa</label>
      <select id={idDaEtapa} className="agora-lista" value={etapaAtual?.id ?? ''} disabled={movimento.gravando}
        onChange={(mudanca) => {
          const destino = processo.etapasDoVerso.find((etapa) => etapa.id === mudanca.target.value)
          if (destino) movimento.mover(processo, destino)
        }}>
        {processo.etapasDoVerso.map((etapa) => <option key={etapa.id} value={etapa.id}>{etapa.nome}</option>)}
      </select>
      {emConcluidos ? (
        <>
          <span className="agora-campo">Etiqueta</span>
          <span className="agora-etiqueta">{ROTULO_DA_ETIQUETA.concluido}</span>
        </>
      ) : (
        <>
          <label className="agora-campo" htmlFor={idDaEtiqueta}>Etiqueta</label>
          <select id={idDaEtiqueta} className="agora-lista" value={etiqueta} disabled={movimento.gravando}
            onChange={(mudanca) => movimento.mudarEtiqueta(processo.id, mudanca.target.value as EtiquetaDaEtapa)}>
            <BotaoDaCaixa />
            {ETIQUETAS.map((opcao) => <option key={opcao} value={opcao}><EtiquetaDoProcesso etiqueta={opcao} /></option>)}
          </select>
        </>
      )}
    </div>
  )
}

function ResponsavelDoAgora({ processo, usuarios, usuarioId, movimento }: CorpoDoAgoraProps) {
  const { responsavel } = processo
  const dias = diasDoProcessoNaEtapa(processo, hojeEmBrasilia())
  const opcoes = opcoesDeResponsavel(processo, usuarios, usuarioId)
  return (
    <p className="agora-responsavel">
      {responsavel ? (
        <>
          <Avatar nome={responsavel.nome} fotoUrl={responsavel.fotoUrl ?? undefined} tamanho={24} />
          <span>{responsavel.nome}{processo.cartao?.responsavelAtivo === false && ' (Inativo)'}</span>
        </>
      ) : <span>Sem responsável</span>}
      {dias !== null && <DiasNaEtapa dias={dias} />}
      <TrocaDoResponsavel responsavelId={responsavel?.id ?? null} opcoes={opcoes} desabilitada={movimento.gravando}
        aoEscolher={(escolhido) => movimento.mudarResponsavel(processo.id, escolhido)} />
      {podeAssumir(processo, usuarioId) && (
        <button type="button" className="botao botao-secundario" disabled={movimento.gravando}
          onClick={() => movimento.mudarResponsavel(processo.id, usuarioId)}>
          Assumir
        </button>
      )}
    </p>
  )
}
