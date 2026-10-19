import './LinhaDoTempo.css'
import {
  ehRegistroRetirado, nomeDoItem, rotuloDoMotivo, textoDaAcaoDoCadastro,
} from '../../cadastros/historicoDosCadastros'
import type { EventoDoCadastro } from '../../cadastros/tipos'
import { agruparPorDia } from '../../processos/agrupamentoDoHistorico'
import { Avatar } from '../Avatar'
import { AntesEDepoisDoEvento } from '../cadastros/ListaDoHistorico'

const HORA = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

// Alteração feita direto no banco não tem autor: as iniciais "BD" dizem de onde veio.
const AUTOR_DO_BANCO = 'Banco de dados'

/** O histórico do processo como linha do tempo agrupada por dia, do mais novo para o mais antigo (spec, "Histórico"). */
export function LinhaDoTempo({ eventos }: { eventos: EventoDoCadastro[] }) {
  return (
    <div className="linha-do-tempo">
      {agruparPorDia(eventos, new Date()).map((grupo) => (
        <section key={grupo.rotulo} className="linha-do-tempo-dia" aria-labelledby={`dia-${grupo.rotulo}`}>
          <h4 id={`dia-${grupo.rotulo}`} className="linha-do-tempo-titulo">{grupo.rotulo}</h4>
          <ol className="linha-do-tempo-eventos">
            {grupo.eventos.map((evento) => <EventoDaLinhaDoTempo key={evento.id} evento={evento} />)}
          </ol>
        </section>
      ))}
    </div>
  )
}

function EventoDaLinhaDoTempo({ evento }: { evento: EventoDoCadastro }) {
  return (
    <li className="linha-do-tempo-evento">
      <time className="linha-do-tempo-hora" dateTime={evento.ocorridoEm}>{HORA.format(new Date(evento.ocorridoEm))}</time>
      <Avatar nome={evento.autor ?? AUTOR_DO_BANCO} tamanho={24} />
      <div className="linha-do-tempo-texto">
        <span><strong>{textoDaAcaoDoCadastro(evento.acao, evento.entidade)}</strong> {nomeDoItem(evento)}</span>
        {/* O registro de um recurso retirado mostra só a ação (ADR 0013). */}
        {!ehRegistroRetirado(evento) && <span className="linha-do-tempo-mudanca"><AntesEDepoisDoEvento evento={evento} /></span>}
        {evento.motivo && <span className="linha-do-tempo-motivo">{rotuloDoMotivo(evento.acao)}: {evento.motivo}</span>}
      </div>
    </li>
  )
}
