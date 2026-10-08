import type { LinhaDeUsuario, ModuloDeAcesso, Perfil, RecusaDeEntrada, SessaoAtual, UsuarioAtual } from './tipos'

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
  linhas: LinhaDeUsuario[] = []
  falharLista = false
  segurarLista = false
  falhaDeGravacao: string | Error | null = null

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

  async listarUsuarios(): Promise<LinhaDeUsuario[]> {
    if (this.segurarLista) return new Promise<never>(() => {})
    if (this.falharLista) throw new Error('falha de conexão simulada')
    return [...this.linhas]
  }

  async autorizarEmail(email: string, perfil: Perfil): Promise<void> {
    this.conferirGravacao()
    this.linhas = [{ chave: email, nome: null, email, fotoUrl: null, perfil, situacao: 'aguardando' }, ...this.linhas]
  }

  async mudarPerfilDaAutorizacao(email: string, perfil: Perfil): Promise<void> {
    this.conferirGravacao()
    this.linhas = this.linhas.map((linha) => (linha.email === email ? { ...linha, perfil } : linha))
  }

  async excluirAutorizacao(email: string): Promise<void> {
    this.conferirGravacao()
    this.linhas = this.linhas.filter((linha) => linha.email !== email)
  }

  async mudarPerfilDoUsuario(id: string, perfil: Perfil): Promise<void> {
    this.alterarLinha(id, { perfil })
  }

  async desativarUsuario(id: string): Promise<void> {
    this.alterarLinha(id, { situacao: 'inativo' })
  }

  async reativarUsuario(id: string): Promise<void> {
    this.alterarLinha(id, { situacao: 'ativo' })
  }

  async corrigirNome(id: string, nome: string): Promise<void> {
    this.alterarLinha(id, { nome })
  }

  private alterarLinha(chave: string, mudanca: Partial<LinhaDeUsuario>): void {
    this.conferirGravacao()
    this.linhas = this.linhas.map((linha) => (linha.chave === chave ? { ...linha, ...mudanca } : linha))
  }

  // A falha simulada traz o motivo já em português (texto) ou a trava pronta (TravaDoBanco), como o módulo real.
  private conferirGravacao(): void {
    if (this.falhaDeGravacao === null) return
    throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
  }
}
