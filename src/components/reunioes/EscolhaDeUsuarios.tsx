import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import { usuariosDaEscolha } from '../../reunioes/participantesDaEscolha'
import type { ModuloDeReunioes, UsuarioDaReuniao } from '../../reunioes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { CaixasDeMarcar } from './CaixasDeMarcar'

type EscolhaDeUsuariosProps = {
  reunioes: ModuloDeReunioes
  /** Os usuários já marcados na reunião que se edita: continuam na escolha mesmo que tenham ficado inativos. */
  daReuniao: UsuarioDaReuniao[]
  marcados: string[]
  aoMudar: (marcados: string[]) => void
}

/** Os usuários ativos do EP, de qualquer perfil, em caixas de marcar (o inativo já marcado leva o aviso no nome). */
export function EscolhaDeUsuarios({ reunioes, daReuniao, marcados, aoMudar }: EscolhaDeUsuariosProps) {
  const carregar = useCallback(() => reunioes.listarUsuariosAtivos(), [reunioes])
  const { estado, tentarDeNovo } = useCarregamento(carregar)
  if (estado.tipo === 'carregando') return <p className="cadastros-vazio" role="status">Carregando usuários…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os usuários" aoTentarDeNovo={tentarDeNovo} />
  const opcoes = usuariosDaEscolha(estado.valor, daReuniao)
    .map((usuario) => ({ id: usuario.id, rotulo: usuario.ativo ? usuario.nome : `${usuario.nome} (inativo)` }))
  return <CaixasDeMarcar legenda="Usuários do EP" opcoes={opcoes} marcados={marcados} aoMudar={aoMudar} />
}
