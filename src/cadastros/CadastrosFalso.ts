import { CadastroInexistente } from './cadastroInexistente'
import type { DadosDoMacroprocesso, DadosDoSetor, Macroprocesso, ModuloDeCadastros, Setor } from './tipos'

/** Implementação falsa dos cadastros para os testes de tela: sem rede, com falhas e esperas simuladas. */
export class CadastrosFalso implements ModuloDeCadastros {
  setores: Setor[] = []
  macroprocessos: Macroprocesso[] = []
  falharLista = false
  segurarLista = false
  falharListaDeMacroprocessos = false
  segurarListaDeMacroprocessos = false
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
    this.trocarSetor(id, dados)
  }

  async desativarSetor(id: string): Promise<void> {
    this.trocarSetor(id, { ativo: false })
  }

  async reativarSetor(id: string): Promise<void> {
    this.trocarSetor(id, { ativo: true })
  }

  async excluirSetor(id: string): Promise<void> {
    this.falharSeConfigurado()
    const setor = this.acharSetor(id)
    this.setores = this.setores.filter((outro) => outro !== setor)
  }

  /** Mesma ordem do banco: código (os sem código depois) e nome. */
  async listarMacroprocessos(): Promise<Macroprocesso[]> {
    if (this.segurarListaDeMacroprocessos) return new Promise<never>(() => {})
    if (this.falharListaDeMacroprocessos) throw new Error('falha de conexão simulada')
    return [...this.macroprocessos].sort(naOrdemDoBanco)
  }

  async lerMacroprocesso(id: string): Promise<Macroprocesso | null> {
    return this.macroprocessos.find((macroprocesso) => macroprocesso.id === id) ?? null
  }

  async criarMacroprocesso(dados: DadosDoMacroprocesso): Promise<void> {
    this.falharSeConfigurado()
    const id = `macroprocesso-${this.macroprocessos.length + 1}`
    this.macroprocessos = [...this.macroprocessos, { id, ativo: true, ...dados }]
  }

  async editarMacroprocesso(id: string, dados: DadosDoMacroprocesso): Promise<void> {
    this.trocarMacroprocesso(id, dados)
  }

  async desativarMacroprocesso(id: string): Promise<void> {
    this.trocarMacroprocesso(id, { ativo: false })
  }

  async reativarMacroprocesso(id: string): Promise<void> {
    this.trocarMacroprocesso(id, { ativo: true })
  }

  async excluirMacroprocesso(id: string): Promise<void> {
    this.falharSeConfigurado()
    const macroprocesso = this.acharMacroprocesso(id)
    this.macroprocessos = this.macroprocessos.filter((outro) => outro !== macroprocesso)
  }

  private falharSeConfigurado(): void {
    if (this.falhaDeGravacao === null) return
    throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
  }

  private acharSetor(id: string): Setor {
    const setor = this.setores.find((outro) => outro.id === id)
    if (!setor) throw new CadastroInexistente()
    return setor
  }

  private trocarSetor(id: string, mudancas: Partial<Setor>): void {
    this.falharSeConfigurado()
    const setor = this.acharSetor(id)
    this.setores = this.setores.map((outro) => (outro === setor ? { ...outro, ...mudancas } : outro))
  }

  private acharMacroprocesso(id: string): Macroprocesso {
    const macroprocesso = this.macroprocessos.find((outro) => outro.id === id)
    if (!macroprocesso) throw new CadastroInexistente()
    return macroprocesso
  }

  private trocarMacroprocesso(id: string, mudancas: Partial<Macroprocesso>): void {
    this.falharSeConfigurado()
    const macroprocesso = this.acharMacroprocesso(id)
    this.macroprocessos = this.macroprocessos.map((outro) => (outro === macroprocesso ? { ...outro, ...mudancas } : outro))
  }
}

function naOrdemDoBanco(a: Macroprocesso, b: Macroprocesso): number {
  if (a.codigo !== b.codigo) {
    if (a.codigo === null) return 1
    if (b.codigo === null) return -1
    return a.codigo < b.codigo ? -1 : 1
  }
  return a.nome.localeCompare(b.nome, 'pt-BR')
}
