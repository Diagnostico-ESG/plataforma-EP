import { useState } from 'react'
import type { ModuloDeAcesso } from '../../acesso/tipos'
import { useUsuarios } from '../../hooks/useUsuarios'
import { FormularioDeAutorizacao } from './FormularioDeAutorizacao'
import { ListaDeUsuarios } from './ListaDeUsuarios'

type AreaDeUsuariosProps = { acesso: ModuloDeAcesso }

export function AreaDeUsuarios({ acesso }: AreaDeUsuariosProps) {
  const { lista, tentarDeNovo, gravar } = useUsuarios(acesso)
  const [falhaNaLinha, setFalhaNaLinha] = useState<string | null>(null)

  // Ações de linha não têm formulário: a falha aparece acima da tabela, e a linha continua como estava.
  const gravarNaLinha = (alteracao: () => Promise<void>) => {
    setFalhaNaLinha(null)
    gravar(alteracao).catch((erro: unknown) => setFalhaNaLinha(erro instanceof Error ? erro.message : String(erro)))
  }

  return (
    <section className="administracao" aria-labelledby="titulo-usuarios">
      <h2 id="titulo-usuarios" className="administracao-titulo">Usuários</h2>
      <FormularioDeAutorizacao aoAutorizar={(email, perfil) => gravar(() => acesso.autorizarEmail(email, perfil))} />
      {falhaNaLinha && <p className="administracao-falha" role="alert">A alteração não foi salva: {falhaNaLinha}.</p>}
      <ListaDeUsuarios lista={lista} aoTentarDeNovo={tentarDeNovo}
        aoMudarPerfil={(email, perfil) => gravarNaLinha(() => acesso.mudarPerfilDaAutorizacao(email, perfil))}
        aoExcluir={(email) => gravarNaLinha(() => acesso.excluirAutorizacao(email))} />
    </section>
  )
}
