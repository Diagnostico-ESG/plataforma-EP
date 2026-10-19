import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import { montarEnderecoDosProcessos, SEM_FILTROS } from '../../processos/enderecoDosProcessos'
import { linhasDaLista, textoDaEtapaAtual } from '../../processos/linhasDaLista'
import { ROTULO_DO_TIPO } from '../../processos/rotulos'
import type { ModuloDeProcessos, ProcessoDaLista } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { PilulaDaSituacao } from './PilulaDaSituacao'

type ProcessosDoSetorProps = { processos: ModuloDeProcessos; setorId: string }

// O painel abre por cima da Lista já filtrada pelo setor, e fechar volta a ela.
function abrirProcesso(id: string, setorId: string) {
  window.location.hash = montarEnderecoDosProcessos({ visao: 'lista', aberto: id, filtros: { ...SEM_FILTROS, setor: setorId }, agrupar: 'etapa' })
}

/** Seção "Processos do setor" da tela do setor: a lista inteira, filtrada pelo setor, por nome. Todos os perfis. */
export function ProcessosDoSetor({ processos, setorId }: ProcessosDoSetorProps) {
  const ler = useCallback(async () => {
    const { processos: todos } = await processos.listarProcessos()
    return linhasDaLista(todos.filter((processo) => processo.setorId === setorId))
  }, [processos, setorId])
  const { estado, tentarDeNovo } = useCarregamento(ler)
  return (
    <section className="processos-do-setor" aria-label="Processos do setor">
      <h3 className="form-setor-titulo">Processos do setor</h3>
      {estado.tipo === 'carregando' && <p className="cadastros-vazio" role="status">Carregando processos do setor…</p>}
      {estado.tipo === 'erro' && <ErroAoCarregar alvo="os processos" aoTentarDeNovo={tentarDeNovo} />}
      {estado.tipo === 'pronto' && estado.valor.length === 0 && (
        <p className="cadastros-vazio">Este setor ainda não tem processos.</p>
      )}
      {estado.tipo === 'pronto' && estado.valor.length > 0 && (
        <TabelaDoSetor processos={estado.valor} aoAbrir={(id) => abrirProcesso(id, setorId)} />
      )}
    </section>
  )
}

type TabelaDoSetorProps = { processos: ProcessoDaLista[]; aoAbrir: (id: string) => void }

// A linha inteira abre o painel; o botão no nome dá o mesmo caminho a quem usa o teclado.
function TabelaDoSetor({ processos, aoAbrir }: TabelaDoSetorProps) {
  return (
    <table className="tabela-cadastros">
      <thead>
        <tr><th scope="col">Nome</th><th scope="col">Tipo</th><th scope="col">Etapa atual</th><th scope="col">Situação</th></tr>
      </thead>
      <tbody>
        {processos.map((processo) => (
          <tr key={processo.id} className="linha-clicavel" onClick={() => aoAbrir(processo.id)}>
            <td><button type="button" className="cadastros-abrir">{processo.nome}</button></td>
            <td>{ROTULO_DO_TIPO[processo.tipo]}</td>
            <td>{textoDaEtapaAtual(processo)}</td>
            <td><PilulaDaSituacao situacao={processo.situacao} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
