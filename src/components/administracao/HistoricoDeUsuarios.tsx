import { AUTOR_DIRETO_NO_BANCO, descreverEstado, formatarMomento, textoDaAcao } from '../../acesso/historico'
import type { EventoDoHistorico } from '../../acesso/tipos'
import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'

type HistoricoDeUsuariosProps = { historico: EstadoDoCarregamento<EventoDoHistorico[]>; aoTentarDeNovo: () => void }

export function HistoricoDeUsuarios({ historico, aoTentarDeNovo }: HistoricoDeUsuariosProps) {
  return (
    <section className="historico" aria-labelledby="titulo-historico">
      <h3 id="titulo-historico" className="historico-titulo">Histórico de usuários</h3>
      <ConteudoDoHistorico historico={historico} aoTentarDeNovo={aoTentarDeNovo} />
    </section>
  )
}

function ConteudoDoHistorico({ historico, aoTentarDeNovo }: HistoricoDeUsuariosProps) {
  if (historico.tipo === 'carregando') return <p className="historico-aviso">Carregando histórico…</p>
  if (historico.tipo === 'erro') {
    return (
      <div className="administracao-erro" role="alert">
        <p>Não foi possível carregar o histórico. Verifique a conexão e tente de novo.</p>
        <button type="button" className="botao botao-secundario" onClick={aoTentarDeNovo}>Tentar de novo</button>
      </div>
    )
  }
  if (historico.valor.length === 0) return <p className="historico-aviso">Nenhuma alteração registrada ainda.</p>
  return (
    <ol className="historico-lista">
      {historico.valor.map((evento) => <ItemDoHistorico key={evento.id} evento={evento} />)}
    </ol>
  )
}

function ItemDoHistorico({ evento }: { evento: EventoDoHistorico }) {
  return (
    <li className="historico-item">
      <time dateTime={evento.ocorridoEm}>{formatarMomento(evento.ocorridoEm)}</time>
      <span>{evento.autor ?? AUTOR_DIRETO_NO_BANCO}</span>
      <span><strong>{textoDaAcao(evento.acao, evento.entidade)}</strong> {evento.alvo}</span>
      <span className="historico-mudanca">
        <span>Antes: {descreverEstado(evento.antes)}</span>
        <span>Depois: {descreverEstado(evento.depois)}</span>
      </span>
    </li>
  )
}
