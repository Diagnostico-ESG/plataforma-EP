import { CadastroInexistente } from './cadastroInexistente'
import type { DadosDoSetor, ModuloDeCadastros, Setor } from './tipos'

/** Implementação falsa dos cadastros para os testes de tela: sem rede, com falhas e esperas simuladas. */
export class CadastrosFalso implements ModuloDeCadastros {
  setores: Setor[] = []
  falharLista = false
  segurarLista = false
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaDeGravacao: string | Error | null = null

  async listarSetores(): Promise<Setor[]> {
    if (this.segurarLista) return new Promise<never>(() => {})
    if (this.falharLista) throw new Error('falha de conexão simulada')
    return [...this.setores]
  }

  async lerSetor(id: string): Promise<Setor | null> {
    return this.setores.find((setor) => setor.id === id) ?? null
  }

  async criarSetor(dados: DadosDoSetor): Promise<void> {
    this.falharSeConfigurado()
    this.setores = [...this.setores, { id: `setor-${this.setores.length + 1}`, ativo: true, ...dados }]
  }

  async editarSetor(id: string, dados: DadosDoSetor): Promise<void> {
    this.trocar(id, dados)
  }

  async desativarSetor(id: string): Promise<void> {
    this.trocar(id, { ativo: false })
  }

  async reativarSetor(id: string): Promise<void> {
    this.trocar(id, { ativo: true })
  }

  async excluirSetor(id: string): Promise<void> {
    this.falharSeConfigurado()
    const setor = this.achar(id)
    this.setores = this.setores.filter((outro) => outro !== setor)
  }

  private falharSeConfigurado(): void {
    if (this.falhaDeGravacao === null) return
    throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
  }

  private achar(id: string): Setor {
    const setor = this.setores.find((outro) => outro.id === id)
    if (!setor) throw new CadastroInexistente()
    return setor
  }

  private trocar(id: string, mudancas: Partial<Setor>): void {
    this.falharSeConfigurado()
    const setor = this.achar(id)
    this.setores = this.setores.map((outro) => (outro === setor ? { ...outro, ...mudancas } : outro))
  }
}
