import { useState } from 'react'
import { textoDaFalha } from '../../acesso/falhasDeGravacao'
import type { ModuloDeAcesso } from '../../acesso/tipos'
import { useUsuarios } from '../../hooks/useUsuarios'
import { FormularioDeAutorizacao } from './FormularioDeAutorizacao'
import { ListaDeUsuarios } from './ListaDeUsuarios'

type AreaDeUsuariosProps = { acesso: ModuloDeAcesso }

export function AreaDeUsuarios({ acesso }: AreaDeUsuariosProps) {
  const { lista, tentarDeNovo, gravar } = useUsuarios(acesso)
  const [falhaNaLinha, setFalhaNaLinha] = useState<string | null>(null)

  // Ações de linha sem formulário: a falha aparece acima da tabela, e a linha continua como estava.
  const gravarNaLinha = (alteracao: () => Promise<void>) => {
    setFalhaNaLinha(null)
    gravar(alteracao).catch((erro: unknown) => setFalhaNaLinha(textoDaFalha(erro)))
  }

  return (
    <section className="administracao" aria-labelledby="titulo-usuarios">
      <h2 id="titulo-usuarios" className="administracao-titulo">Usuários</h2>
      <FormularioDeAutorizacao aoAutorizar={(email, perfil) => gravar(() => acesso.autorizarEmail(email, perfil))} />
      {falhaNaLinha && <p className="administracao-falha" role="alert">{falhaNaLinha}</p>}
      <ListaDeUsuarios lista={lista} aoTentarDeNovo={tentarDeNovo}
        aoMudarPerfil={(linha, perfil) => gravarNaLinha(() => (linha.situacao === 'aguardando'
          ? acesso.mudarPerfilDaAutorizacao(linha.email, perfil)
          : acesso.mudarPerfilDoUsuario(linha.chave, perfil)))}
        aoExcluir={(email) => gravarNaLinha(() => acesso.excluirAutorizacao(email))}
        aoDesativar={(id) => gravarNaLinha(() => acesso.desativarUsuario(id))}
        aoReativar={(id) => gravarNaLinha(() => acesso.reativarUsuario(id))}
        aoCorrigirNome={(id, nome) => gravar(() => acesso.corrigirNome(id, nome))} />
    </section>
  )
}
