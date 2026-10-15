import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import { type ModeloDaReuniao, montarEnderecoDeNovaReuniao } from '../../reunioes/enderecoDasReunioes'
import { hojeLocal, ordenarReunioes } from '../../reunioes/quandoAcontece'
import { ROTULO_DO_TIPO_DE_REUNIAO, dataEHoraDaReuniao } from '../../reunioes/rotulos'
import type { ModuloDeReunioes, Reuniao } from '../../reunioes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import '../processos/Painel.css'

export type SecaoDeReunioesProps = {
  reunioes: ModuloDeReunioes
  /** De quem é a seção: o setor aberto ou o painel do processo. */
  de: 'setor' | 'processo'
  /** Das reuniões lidas, as que pertencem a quem abriu a seção. */
  selecionar: (todas: Reuniao[]) => Reuniao[]
  /** No setor, cada reunião mostra também os processos tratados. */
  comProcessos: boolean
  /** O que o [Registrar reunião] leva preenchido; nulo: sem o botão (Consulta, setor inativo). */
  modelo: ModeloDaReuniao | null
  /** As classes da seção e do título, que seguem o estilo das seções vizinhas. */
  classeDaSecao: string
  classeDoTitulo: string
}

// A reunião abre na área Reuniões, onde estão o painel, a edição e o histórico dela.
function abrirReuniao(id: string) {
  window.location.hash = `#/reunioes/${id}`
}

/** A seção "Reuniões" do setor aberto e do painel do processo: lista curta e [Registrar reunião] preenchido. */
export function SecaoDeReunioes({ reunioes, de, selecionar, comProcessos, modelo, classeDaSecao, classeDoTitulo }: SecaoDeReunioesProps) {
  const ler = useCallback(() => reunioes.listarReunioes(), [reunioes])
  const { estado, tentarDeNovo } = useCarregamento(ler)
  return (
    <section className={classeDaSecao} aria-label={`Reuniões do ${de}`}>
      <h3 className={classeDoTitulo}>Reuniões</h3>
      {estado.tipo === 'carregando' && <p className="cadastros-vazio" role="status">Carregando reuniões…</p>}
      {estado.tipo === 'erro' && <ErroAoCarregar alvo="as reuniões" aoTentarDeNovo={tentarDeNovo} />}
      {estado.tipo === 'pronto' && (
        <ListaDeReunioes reunioes={ordenarReunioes(selecionar(estado.valor), hojeLocal())} comProcessos={comProcessos} />
      )}
      {modelo && (
        <button type="button" className="botao botao-secundario"
          onClick={() => { window.location.hash = montarEnderecoDeNovaReuniao(modelo) }}>
          Registrar reunião
        </button>
      )}
    </section>
  )
}

type ListaDeReunioesProps = { reunioes: Reuniao[]; comProcessos: boolean }

function ListaDeReunioes({ reunioes, comProcessos }: ListaDeReunioesProps) {
  if (reunioes.length === 0) return <p className="cadastros-vazio">Nenhuma reunião.</p>
  return (
    <ul className="painel-estrutura-lista">
      {reunioes.map((reuniao) => (
        <li key={reuniao.id}>
          <button type="button" className="cadastros-abrir" onClick={() => abrirReuniao(reuniao.id)}>
            {dataEHoraDaReuniao(reuniao)}
          </button>
          <span> · {ROTULO_DO_TIPO_DE_REUNIAO[reuniao.tipo]}</span>
          {comProcessos && reuniao.processos.length > 0 && <span> · {reuniao.processos.map((processo) => processo.nome).join(', ')}</span>}
        </li>
      ))}
    </ul>
  )
}
