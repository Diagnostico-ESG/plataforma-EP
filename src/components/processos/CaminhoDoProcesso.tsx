import { indiceDaEtapaAtual } from '../../processos/caminhoDeEtapas'
import type { ProcessoLido } from '../../processos/tipos'
import { LinhaDaEtapa } from './LinhaDaEtapa'

const SEM_ACOES: never[] = []
const NADA_A_FAZER = () => undefined

/**
 * O caminho do processo no painel: as etapas do setor primeiro, só para leitura, com o caminho para a tela do setor;
 * depois as do processo (por ora também só leitura: o andamento chega no ticket 05).
 */
export function CaminhoDoProcesso({ processo }: { processo: ProcessoLido }) {
  const atual = indiceDaEtapaAtual(processo.etapasDoProcesso)
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
      <ol className="caminho-de-etapas">
        {processo.etapasDoProcesso.map((etapa, indice) => (
          <LinhaDaEtapa key={etapa.id} etapa={etapa} atual={indice === atual} acoes={SEM_ACOES}
            aoAgir={NADA_A_FAZER} responsavelNome={etapa.responsavelNome} />
        ))}
      </ol>
    </section>
  )
}
