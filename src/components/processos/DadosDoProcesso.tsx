import { ROTULO_DA_ORIGEM, ROTULO_DO_TIPO } from '../../processos/rotulos'
import type { ProcessoLido } from '../../processos/tipos'

function Dado({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <>
      <dt>{rotulo}</dt>
      <dd>{valor || '—'}</dd>
    </>
  )
}

/** Os dados do processo, só para leitura (a edição entra por cima, no painel). */
export function DadosDoProcesso({ processo }: { processo: ProcessoLido }) {
  return (
    <section className="painel-dados" aria-label="Dados do processo">
      <h3 className="painel-subtitulo">Dados do processo</h3>
      <dl className="painel-lista-de-dados">
        <Dado rotulo="Setor" valor={processo.setorSigla} />
        <Dado rotulo="Macroprocesso" valor={processo.macroprocessoNome} />
        <Dado rotulo="Tipo" valor={ROTULO_DO_TIPO[processo.tipo]} />
        <Dado rotulo="Origem" valor={ROTULO_DA_ORIGEM[processo.origem]} />
        <Dado rotulo="Contexto" valor={processo.contexto} />
        <Dado rotulo="Observações" valor={processo.observacoes} />
      </dl>
    </section>
  )
}
