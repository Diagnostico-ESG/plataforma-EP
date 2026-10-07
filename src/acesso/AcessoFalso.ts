import type { ModuloDeAcesso, RecusaDeEntrada, SessaoAtual, UsuarioAtual } from './tipos'

export const USUARIO_DE_TESTE: UsuarioAtual = {
  id: 'usuario-de-teste',
  nome: 'Pessoa de Teste',
  fotoUrl: null,
  perfil: 'integrante_ep',
  ativo: true,
}

/** Implementação falsa do acesso para os testes de tela: sem rede, com falhas e esperas simuladas. */
export class AcessoFalso implements ModuloDeAcesso {
  sessao: SessaoAtual | null = null
  usuarios = new Map<string, UsuarioAtual>()
  recusa: RecusaDeEntrada | null = null
  falharConexao = false
  segurarVerificacao = false
  chamadas = { entrarComGoogle: 0, sair: 0 }

  static logadoComo(usuario: UsuarioAtual = USUARIO_DE_TESTE): AcessoFalso {
    const acesso = new AcessoFalso()
    acesso.sessao = { usuarioId: usuario.id, email: 'pessoa.teste@ccivil.pr.gov.br' }
    acesso.usuarios.set(usuario.id, usuario)
    return acesso
  }

  recusaNaChegada(): RecusaDeEntrada | null {
    return this.recusa
  }

  async sessaoAtual(): Promise<SessaoAtual | null> {
    if (this.segurarVerificacao) return new Promise<never>(() => {})
    if (this.falharConexao) throw new Error('falha de conexão simulada')
    return this.sessao
  }

  async entrarComGoogle(): Promise<void> {
    this.chamadas.entrarComGoogle++
  }

  async sair(): Promise<void> {
    this.chamadas.sair++
    this.sessao = null
  }

  async lerProprioUsuario(id: string): Promise<UsuarioAtual | null> {
    return this.usuarios.get(id) ?? null
  }
}
