import type { ReactNode } from 'react'
import { ROTULO_DO_TIPO_DE_REUNIAO, dataEHoraDaReuniao } from '../../reunioes/rotulos'
import type { ProcessoDaReuniao, Reuniao } from '../../reunioes/tipos'
import { Pilula } from '../Pilula'

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <>
      <dt>{rotulo}</dt>
      <dd>{children}</dd>
    </>
  )
}

/** Os dados da reunião, só para leitura; setor e processo que deixaram de estar ativos aparecem marcados. */
export function DadosDaReuniao({ reuniao }: { reuniao: Reuniao }) {
  return (
    <section className="painel-dados" aria-label="Dados da reunião">
      <h3 className="painel-subtitulo">Dados da reunião</h3>
      <dl className="painel-lista-de-dados">
        <Dado rotulo="Tipo">{ROTULO_DO_TIPO_DE_REUNIAO[reuniao.tipo]}</Dado>
        <Dado rotulo="Setor">
          {reuniao.setorSigla}
          {!reuniao.setorAtivo && <> <Pilula situacao="neutra">Inativo</Pilula></>}
        </Dado>
        <Dado rotulo="Data e hora">{dataEHoraDaReuniao(reuniao)}</Dado>
        <Dado rotulo="Local">{reuniao.local ?? '—'}</Dado>
        {reuniao.tipo === 'modelagem' && <Dado rotulo="Processos"><ListaDeProcessos processos={reuniao.processos} /></Dado>}
        <Dado rotulo="Anotações">
          {reuniao.anotacoes ? <span className="reuniao-anotacoes">{reuniao.anotacoes}</span> : '—'}
        </Dado>
      </dl>
    </section>
  )
}

// Cada processo abre o painel dele, na área de processos; o cancelado leva a pílula (o equivalente a inativo).
function ListaDeProcessos({ processos }: { processos: ProcessoDaReuniao[] }) {
  return (
    <ul className="painel-estrutura-lista">
      {processos.map((processo) => (
        <li key={processo.id}>
          <a className="painel-link" href={`#/processos/${processo.id}`}>{processo.nome}</a>
          {processo.cancelado && <> <Pilula situacao="atraso">Cancelado</Pilula></>}
        </li>
      ))}
    </ul>
  )
}
