import type { ReactNode } from 'react'
import { type AcaoDaEtapa, ROTULO_DO_STATUS, formatarData } from '../../processos/caminhoDeEtapas'
import type { EtapaDoSetor, StatusDaEtapa } from '../../processos/tipos'
import { Pilula, type SituacaoPilula } from '../Pilula'

const SITUACAO_DO_STATUS: Record<StatusDaEtapa, SituacaoPilula> = {
  pendente: 'neutra',
  em_andamento: 'informativa',
  concluida: 'aprovado',
  realizada_anteriormente: 'aprovado',
  dispensada: 'neutra',
}

const ROTULO_DA_ACAO: Record<AcaoDaEtapa, string> = {
  iniciar: 'Iniciar', concluir: 'Concluir', dispensar: 'Dispensar', realizada: 'Realizada anteriormente',
  voltar: 'Voltar a esta etapa',
}

type LinhaDaEtapaProps = {
  etapa: EtapaDoSetor
  atual: boolean
  acoes: AcaoDaEtapa[]
  aoAgir: (acao: AcaoDaEtapa) => void
  /** Só as etapas do processo mostram o responsável ("—" sem ele); nas do setor fica de fora. */
  responsavelNome?: string | null
  /** O responsável foi desativado depois de escolhido. */
  responsavelInativo?: boolean
  /** Corrigir datas e escolher o responsável, para quem pode alterar. */
  children?: ReactNode
}

/** Uma etapa do caminho: nome, status (pílula com texto), responsável, datas, nota e as ações que cabem a ela. */
export function LinhaDaEtapa({ etapa, atual, acoes, aoAgir, responsavelNome, responsavelInativo, children }: LinhaDaEtapaProps) {
  return (
    <li className={`etapa etapa-${etapa.status}`} aria-current={atual ? 'step' : undefined}>
      <span className="etapa-nome">{etapa.nome}</span>
      <Pilula situacao={SITUACAO_DO_STATUS[etapa.status]}>{ROTULO_DO_STATUS[etapa.status]}</Pilula>
      {responsavelNome !== undefined && <span className="etapa-responsavel">Responsável: {responsavelNome ?? '—'}{responsavelInativo && ' (Inativo)'}</span>}
      <span className="etapa-datas">
        Início: {formatarData(etapa.iniciadaEm)} · Conclusão: {formatarData(etapa.resolvidaEm)}
      </span>
      {etapa.nota && <p className="etapa-nota">Nota: {etapa.nota}</p>}
      {children}
      {acoes.length > 0 && (
        <div className="etapa-acoes">
          {acoes.map((acao) => (
            <button key={acao} type="button" className="botao botao-secundario" onClick={() => aoAgir(acao)}>
              {ROTULO_DA_ACAO[acao]}
            </button>
          ))}
        </div>
      )}
    </li>
  )
}
