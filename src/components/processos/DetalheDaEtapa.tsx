import { useState } from 'react'
import {
  type SinalDaEtapa, acoesDaEtapa, formatarData, opcoesDeResponsavel, podeAssumir, usuariosParaAEtapa,
} from '../../processos/caminhoDeEtapas'
import type { AcoesDaEtapaEmUso } from '../../hooks/useAcoesDaEtapa'
import type { DatasDaEtapa, EtapaDoCaminho, EtapaDoProcesso, UltimaVersao, UsuarioResponsavel } from '../../processos/tipos'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import { FormularioDeDatas } from './FormularioDeDatas'
import { RevisoesDaEtapa } from './RevisoesDaEtapa'
import { TrocaDoResponsavel } from './TrocaDoResponsavel'

export type DadosDasEtapas = {
  etapas: EtapaDoProcesso[]
  /** O processo das etapas e o módulo de revisões: a gaveta da Revisão interna lista as revisões dele. */
  processoId: string
  revisoes: ModuloDeRevisoes
  /** Quem pode alterar, com o processo em andamento ou concluído; suspenso, cancelado e Consulta só leem. */
  podeEditar: boolean
  usuarios: UsuarioResponsavel[]
  /** Quem está na tela. */
  usuarioId: string
  ultimaVersao: UltimaVersao | null
  acoes: AcoesDaEtapaEmUso
  aoCorrigirDatas: (etapa: EtapaDoCaminho, datas: DatasDaEtapa) => Promise<void>
  aoSumir: () => void
}

type DetalheDaEtapaProps = DadosDasEtapas & { id: string; indice: number; sinal: SinalDaEtapa }

/**
 * A gaveta de uma etapa: datas e nota; o responsável (com Trocar e Assumir nas pendentes depois da atual, que o
 * Agora não cobre); Corrigir datas e Voltar a esta etapa para quem pode editar. A atual não repete o que o Agora tem.
 */
export function DetalheDaEtapa(props: DetalheDaEtapaProps) {
  const { id, etapas, indice, sinal, podeEditar, acoes, aoCorrigirDatas, aoSumir } = props
  const etapa = etapas[indice]
  const [corrigindo, setCorrigindo] = useState(false)
  const voltar = podeEditar && acoesDaEtapa(etapas, indice).includes('voltar')

  async function salvarDatas(datas: DatasDaEtapa) {
    await aoCorrigirDatas(etapa, datas)
    setCorrigindo(false)
  }

  return (
    <div id={id} className="etapa-gaveta">
      <p className="etapa-datas">Início: {formatarData(etapa.iniciadaEm)} · Conclusão: {formatarData(etapa.resolvidaEm)}</p>
      {etapa.nota && <p className="etapa-nota">Nota: {etapa.nota}</p>}
      {etapa.codigo === 'revisao_interna' && <RevisoesDaEtapa revisoes={props.revisoes} processoId={props.processoId} />}
      {sinal !== 'atual' && <ResponsavelNaGaveta {...props} />}
      <div className="etapa-gaveta-acoes">
        {podeEditar && etapa.status !== 'pendente' && !corrigindo && (
          <button type="button" className="botao botao-secundario" onClick={() => setCorrigindo(true)}>Corrigir datas</button>
        )}
        {voltar && (
          <button type="button" className="botao botao-secundario" onClick={() => acoes.agir('voltar', etapa, null)}>
            Voltar a esta etapa
          </button>
        )}
      </div>
      {corrigindo && <FormularioDeDatas etapa={etapa} aoSalvar={salvarDatas} aoCancelar={() => setCorrigindo(false)} aoSumir={aoSumir} />}
    </div>
  )
}

function ResponsavelNaGaveta({ etapas, indice, sinal, podeEditar, usuarios, usuarioId, ultimaVersao, acoes }: DetalheDaEtapaProps) {
  const etapa = etapas[indice]
  const nome = `${etapa.responsavelNome ?? '—'}${etapa.responsavelInativo ? ' (Inativo)' : ''}`
  const pendente = sinal === 'pendente' || sinal === 'opcional'
  if (!podeEditar || !pendente) return <p className="etapa-responsavel">Responsável: {nome}</p>
  const opcoes = opcoesDeResponsavel(etapa, usuariosParaAEtapa(etapa, usuarios, ultimaVersao), usuarioId)
  return (
    <p className="etapa-responsavel">
      Responsável: {nome}
      <TrocaDoResponsavel etapa={etapa} opcoes={opcoes} aoEscolher={(escolhido) => acoes.mudarResponsavel(etapa, escolhido)} />
      {!etapa.responsavelNome && podeAssumir(etapa, usuarioId, ultimaVersao) && (
        <button type="button" className="botao botao-secundario" aria-label={`Assumir ${etapa.nome}`}
          onClick={() => acoes.mudarResponsavel(etapa, usuarioId)}>
          Assumir
        </button>
      )}
    </p>
  )
}
