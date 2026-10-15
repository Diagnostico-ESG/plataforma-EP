import type { ReactNode } from 'react'
import { ROTULO_DO_TIPO_DE_REUNIAO, dataEHoraDaReuniao } from '../../reunioes/rotulos'
import type { ProcessoDaReuniao, Reuniao, UsuarioDaReuniao } from '../../reunioes/tipos'
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
        <Dado rotulo="Usuários do EP"><ListaDeUsuarios usuarios={reuniao.usuarios} /></Dado>
        <Dado rotulo="Responsáveis do setor"><ListaDeNomes nomes={reuniao.responsaveis.map((responsavel) => responsavel.nome)} /></Dado>
        <Dado rotulo="Outros participantes"><ListaDeNomes nomes={reuniao.outrosParticipantes} /></Dado>
        <Dado rotulo="Anotações">
          {reuniao.anotacoes ? <span className="reuniao-anotacoes">{reuniao.anotacoes}</span> : '—'}
        </Dado>
      </dl>
    </section>
  )
}

// Lista de nomes; sem ninguém, o traço (como os outros dados que faltam).
function ListaDeNomes({ nomes }: { nomes: string[] }) {
  if (nomes.length === 0) return <>—</>
  return (
    <ul className="painel-estrutura-lista">
      {nomes.map((nome) => <li key={nome}>{nome}</li>)}
    </ul>
  )
}

// O usuário que deixou de estar ativo depois da reunião leva a pílula, como o setor inativo.
function ListaDeUsuarios({ usuarios }: { usuarios: UsuarioDaReuniao[] }) {
  if (usuarios.length === 0) return <>—</>
  return (
    <ul className="painel-estrutura-lista">
      {usuarios.map((usuario) => (
        <li key={usuario.id}>
          {usuario.nome}
          {!usuario.ativo && <> <Pilula situacao="neutra">Inativo</Pilula></>}
        </li>
      ))}
    </ul>
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
