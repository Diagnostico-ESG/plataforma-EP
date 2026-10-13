import { useMemo, useState } from 'react'
import { AUTOR_DIRETO_NO_BANCO, formatarMomento } from '../../acesso/historico'
import {
  descreverEstadoDoCadastro, eventosDoItem, itensDoFiltro, nomeDoItem, textoDaAcaoDoCadastro,
} from '../../cadastros/historicoDosCadastros'
import type { EventoDoCadastro } from '../../cadastros/tipos'

// As classes historico-* vêm da Administração: a lista é a mesma do histórico de usuários.
export function ListaDoHistorico({ eventos }: { eventos: EventoDoCadastro[] }) {
  const [item, setItem] = useState<string | null>(null)
  const itens = useMemo(() => itensDoFiltro(eventos), [eventos])
  return (
    <>
      <div className="historico-filtro">
        <label htmlFor="filtro-item-do-historico">Item</label>
        <select id="filtro-item-do-historico" value={item ?? ''} onChange={(mudanca) => setItem(mudanca.target.value || null)}>
          <option value="">Todos os itens</option>
          {itens.map(({ id, nome }) => <option key={id} value={id}>{nome}</option>)}
        </select>
      </div>
      <ol className="historico-lista">
        {eventosDoItem(eventos, item).map((evento) => <EventoDoHistorico key={evento.id} evento={evento} />)}
      </ol>
    </>
  )
}

function EventoDoHistorico({ evento }: { evento: EventoDoCadastro }) {
  return (
    <li className="historico-item">
      <time dateTime={evento.ocorridoEm}>{formatarMomento(evento.ocorridoEm)}</time>
      <span>{evento.autor ?? AUTOR_DIRETO_NO_BANCO}</span>
      <span><strong>{textoDaAcaoDoCadastro(evento.acao, evento.entidade)}</strong> {nomeDoItem(evento)}</span>
      <span className="historico-mudanca">
        <span>Antes: {descreverEstadoDoCadastro(evento.antes)}</span>
        <span>Depois: {descreverEstadoDoCadastro(evento.depois)}</span>
      </span>
    </li>
  )
}
