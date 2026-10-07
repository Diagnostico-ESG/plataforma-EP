import { rotuloDoPerfil } from '../../acesso/perfis'
import type { ModuloDeAcesso, UsuarioAtual } from '../../acesso/tipos'
import { AreaDeUsuarios } from './AreaDeUsuarios'
import './Administracao.css'

type AreaDeAdministracaoProps = { usuario: UsuarioAtual; acesso: ModuloDeAcesso }

// Esconder o item da faixa é conveniência; quem protege os dados é a RLS de autorizacoes.
export function AreaDeAdministracao({ usuario, acesso }: AreaDeAdministracaoProps) {
  if (usuario.perfil !== 'administrador') {
    return (
      <p className="administracao-sem-permissao">
        Seu perfil ({rotuloDoPerfil(usuario.perfil)}) não permite administrar usuários. Peça a um administrador para
        mudar seu perfil.
      </p>
    )
  }
  return <AreaDeUsuarios acesso={acesso} />
}
