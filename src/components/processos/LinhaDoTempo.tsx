import './LinhaDoTempo.css'
import {
  ehRegistroRetirado, nomeDoItem, rotuloDoMotivo, textoDoEvento,
} from '../../cadastros/historicoDosCadastros'
import type { EventoDoCadastro } from '../../cadastros/tipos'
import { agruparPorDia } from '../../processos/agrupamentoDoHistorico'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { Avatar } from '../Avatar'
import { LinkDoArquivo } from '../versoes/LinkDoArquivo'
import { AntesEDepoisDoEvento } from '../cadastros/ListaDoHistorico'

const HORA = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

// Alteração feita direto no banco não tem autor: as iniciais "BD" dizem de onde veio.
const AUTOR_DO_BANCO = 'Banco de dados'

/**
 * O histórico do processo como linha do tempo agrupada por dia, do mais novo para o mais antigo (spec, "Histórico"). Com o
 * módulo de versões, a troca da aprovação traz o link para baixar o .pdf que ficou guardado.
 */
export function LinhaDoTempo({ eventos, versoes }: { eventos: EventoDoCadastro[]; versoes?: ModuloDeVersoes }) {
  return (
    <div className="linha-do-tempo">
      {agruparPorDia(eventos, new Date()).map((grupo) => (
        <section key={grupo.rotulo} className="linha-do-tempo-dia" aria-labelledby={`dia-${grupo.rotulo}`}>
          <h4 id={`dia-${grupo.rotulo}`} className="linha-do-tempo-titulo">{grupo.rotulo}</h4>
          <ol className="linha-do-tempo-eventos">
            {grupo.eventos.map((evento) => <EventoDaLinhaDoTempo key={evento.id} evento={evento} versoes={versoes} />)}
          </ol>
        </section>
      ))}
    </div>
  )
}

// O .pdf da aprovação trocada (o evento "Substituiu a aprovação" guarda o identificador e o nome dele): baixa pelo link.
function PdfGuardadoDoEvento({ evento, versoes }: { evento: EventoDoCadastro; versoes: ModuloDeVersoes }) {
  if (evento.entidade !== 'aprovacao' || evento.acao !== 'substituir') return null
  const { pdf_id: id, pdf_nome: nome } = (evento.antes ?? {}) as Record<string, unknown>
  if (typeof id !== 'string' || typeof nome !== 'string') return null
  return (
    <span className="linha-do-tempo-pdf">
      .pdf guardado: <LinkDoArquivo versoes={versoes} arquivo={{ id, papel: 'pdf_da_aprovacao', nome, formato: 'pdf', tamanho: 0 }} />
    </span>
  )
}

function EventoDaLinhaDoTempo({ evento, versoes }: { evento: EventoDoCadastro; versoes?: ModuloDeVersoes }) {
  return (
    <li className="linha-do-tempo-evento">
      <time className="linha-do-tempo-hora" dateTime={evento.ocorridoEm}>{HORA.format(new Date(evento.ocorridoEm))}</time>
      <Avatar nome={evento.autor ?? AUTOR_DO_BANCO} tamanho={24} />
      <div className="linha-do-tempo-texto">
        <span><strong>{textoDoEvento(evento)}</strong> {nomeDoItem(evento)}</span>
        {/* O registro de um recurso retirado mostra só a ação (ADR 0013). */}
        {!ehRegistroRetirado(evento) && <span className="linha-do-tempo-mudanca"><AntesEDepoisDoEvento evento={evento} /></span>}
        {versoes && <PdfGuardadoDoEvento evento={evento} versoes={versoes} />}
        {evento.motivo && <span className="linha-do-tempo-motivo">{rotuloDoMotivo(evento.acao)}: {evento.motivo}</span>}
      </div>
    </li>
  )
}
