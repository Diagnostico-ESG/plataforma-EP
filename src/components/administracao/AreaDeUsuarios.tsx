import { useCallback } from 'react'
import type { ModuloDeAcesso } from '../../acesso/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { useUsuarios } from '../../hooks/useUsuarios'
import { FormularioDeAutorizacao } from './FormularioDeAutorizacao'
import { HistoricoDeUsuarios } from './HistoricoDeUsuarios'
import { ListaDeUsuarios } from './ListaDeUsuarios'

type AreaDeUsuariosProps = { acesso: ModuloDeAcesso }

export function AreaDeUsuarios({ acesso }: AreaDeUsuariosProps) {
  const listarHistorico = useCallback(() => acesso.listarHistorico(), [acesso])
  const historico = useCarregamento(listarHistorico)
  // Cada gravação gera um evento: o histórico é relido junto com a lista.
  const { lista, tentarDeNovo, gravar } = useUsuarios(acesso, historico.recarregar)

  return (
    <section className="administracao" aria-labelledby="titulo-usuarios">
      <h2 id="titulo-usuarios" className="administracao-titulo">Usuários</h2>
      <FormularioDeAutorizacao aoAutorizar={(email, perfil) => gravar(() => acesso.autorizarEmail(email, perfil))} />
      <ListaDeUsuarios lista={lista} aoTentarDeNovo={tentarDeNovo}
        aoMudarPerfil={(linha, perfil) => gravar(() => (linha.situacao === 'aguardando'
          ? acesso.mudarPerfilDaAutorizacao(linha.email, perfil)
          : acesso.mudarPerfilDoUsuario(linha.chave, perfil)))}
        aoExcluir={(email) => gravar(() => acesso.excluirAutorizacao(email))}
        aoDesativar={(id) => gravar(() => acesso.desativarUsuario(id))}
        aoReativar={(id) => gravar(() => acesso.reativarUsuario(id))}
        aoCorrigirNome={(id, nome) => gravar(() => acesso.corrigirNome(id, nome))} />
      <HistoricoDeUsuarios historico={historico.estado} aoTentarDeNovo={historico.tentarDeNovo} />
    </section>
  )
}
