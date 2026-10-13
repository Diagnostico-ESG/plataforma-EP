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

  async criarSetor(dados: DadosDoSetor): Promise<void> {
    if (this.falhaDeGravacao !== null) {
      throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
    }
    this.setores = [...this.setores, { id: `setor-${this.setores.length + 1}`, ativo: true, ...dados }]
  }
}
