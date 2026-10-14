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

/**
 * O caminho do processo no painel: as etapas do setor primeiro, só para leitura, com o caminho para a tela do setor;
 * depois as do processo, com as ações na etapa atual para quem pode alterar (a RLS é quem protege).
 */
export function CaminhoDoProcesso({ processo, processos, podeAlterar, aoMudar, aoSumir }: CaminhoDoProcessoProps) {
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
      <CaminhoDeEtapas processos={processos} etapas={processo.etapasDoProcesso} podeAlterar={podeAlterar}
        aoMudar={aoMudar} aoSumir={aoSumir} />
    </section>
  )
}
