import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeReunioes } from '../../reunioes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'

type EscolhaDeProcessosProps = {
  reunioes: ModuloDeReunioes
  setorId: string
  marcados: string[]
  aoMudar: (marcados: string[]) => void
}

/** Os processos e subprocessos do setor, em qualquer situação, em caixas de marcar (o cancelado leva o aviso no nome). */
export function EscolhaDeProcessos({ reunioes, setorId, marcados, aoMudar }: EscolhaDeProcessosProps) {
  const carregar = useCallback(() => reunioes.listarProcessosDoSetor(setorId), [reunioes, setorId])
  const { estado, tentarDeNovo } = useCarregamento(carregar)
  if (estado.tipo === 'carregando') return <p className="cadastros-vazio" role="status">Carregando processos…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os processos do setor" aoTentarDeNovo={tentarDeNovo} />
  if (estado.valor.length === 0) return <p className="cadastros-vazio">Este setor ainda não tem processos.</p>
  const alternar = (id: string) => aoMudar(marcados.includes(id) ? marcados.filter((outro) => outro !== id) : [...marcados, id])
  return (
    <fieldset className="reuniao-processos">
      <legend>Processos tratados</legend>
      {estado.valor.map((processo) => (
        <label key={processo.id} className="reuniao-tipo-opcao">
          <input type="checkbox" checked={marcados.includes(processo.id)} onChange={() => alternar(processo.id)} />
          {processo.nome}{processo.cancelado ? ' (cancelado)' : ''}
        </label>
      ))}
    </fieldset>
  )
}
