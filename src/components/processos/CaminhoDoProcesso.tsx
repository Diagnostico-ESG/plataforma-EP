import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { CaminhoDeEtapas } from './CaminhoDeEtapas'
import { LinhaDaEtapa } from './LinhaDaEtapa'

const SEM_ACOES: never[] = []
const NADA_A_FAZER = () => undefined

type CaminhoDoProcessoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  podeAlterar: boolean
  aoMudar: () => void
  aoSumir: () => void
}

// A frase da spec ("Interface"); sem motivo gravado (não deveria acontecer), fica só a explicação.
function avisoDoProcessoParado({ situacao, motivoDaSituacao }: ProcessoLido): string {
  const motivo = motivoDaSituacao ? `: ${motivoDaSituacao}.` : '.'
  return `Este processo está ${situacao}${motivo} Retome-o para registrar o andamento.`
}

/**
 * O caminho do processo no painel: as etapas do setor primeiro, só para leitura, com o caminho para a tela do setor;
 * depois as do processo, com as ações na etapa atual para quem pode alterar (a RLS é quem protege).
 */
export function CaminhoDoProcesso({ processo, processos, podeAlterar, aoMudar, aoSumir }: CaminhoDoProcessoProps) {
  // Quem não altera não escolhe responsável: não precisa da lista. Falha ao lê-la deixa o seletor só com o atual.
  const ler = useCallback(
    () => (podeAlterar ? processos.listarResponsaveisPossiveis() : Promise.resolve([])), [processos, podeAlterar])
  const { estado } = useCarregamento(ler)
  const usuarios = estado.tipo === 'pronto' ? estado.valor : []
  const parado = processo.situacao === 'suspenso' || processo.situacao === 'cancelado'
  return (
    <section className="painel-caminho" aria-label="Caminho de etapas">
      <div className="painel-caminho-titulo">
        <h3 className="painel-subtitulo">Etapas do setor</h3>
        <a className="painel-link" href={`#/setores/${processo.setorId}`}>Ver no setor</a>
      </div>
      <ol className="caminho-de-etapas">
        {processo.etapasDoSetor.map((etapa) => (
          <LinhaDaEtapa key={etapa.id} etapa={etapa} atual={false} acoes={SEM_ACOES} aoAgir={NADA_A_FAZER} />
        ))}
      </ol>
      <h3 className="painel-subtitulo">Etapas do processo</h3>
      {parado && <p className="painel-aviso" role="status">{avisoDoProcessoParado(processo)}</p>}
      <CaminhoDeEtapas processos={processos} etapas={processo.etapasDoProcesso} podeAlterar={podeAlterar && !parado}
        usuarios={usuarios} aoMudar={aoMudar} aoSumir={aoSumir} />
    </section>
  )
}
