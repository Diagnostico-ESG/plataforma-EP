import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from './cadastroInexistente'
import { compararMacroprocessos } from './ordemDosMacroprocessos'
import type {
  DadosDoMacroprocesso, DadosDoSetor, EventoDoCadastro, Macroprocesso, MacroprocessoComSetores, MacroprocessoDaLista,
  ModuloDeCadastros, Setor, SetorComMacroprocessos, SetorDaLista,
} from './tipos'

/** Setor como as fixtures dos testes o escrevem: sem `cor`, vale a 1 ao ler. */
export type SetorDoTeste = Omit<Setor, 'cor'> & { cor?: number }

type Vinculo = { macroprocessoId: string; setorId: string; observacao: string | null }

/** Implementação falsa dos cadastros para os testes de tela: sem rede, com falhas e esperas simuladas. */
export class CadastrosFalso implements ModuloDeCadastros {
  setores: SetorDoTeste[] = []
  macroprocessos: Macroprocesso[] = []
  /** Os setores envolvidos em cada macroprocesso; as contagens e as leituras partem daqui. */
  vinculos: Vinculo[] = []
  falharLista = false
  segurarLista = false
  /** Do mais recente para o mais antigo, como o banco. */
  historico: EventoDoCadastro[] = []
  falharHistorico = false
  segurarHistorico = false
  falharListaDeMacroprocessos = false
  segurarListaDeMacroprocessos = false
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaDeGravacao: string | Error | null = null

  async listarSetores(): Promise<SetorDaLista[]> {
    if (this.segurarLista) return new Promise<never>(() => {})
    if (this.falharLista) throw new Error('falha de conexão simulada')
    return this.setores.map((setor) => ({
      ...this.comCor(setor), quantidadeDeMacroprocessos: this.vinculos.filter((vinculo) => vinculo.setorId === setor.id).length,
    }))
  }

  async lerSetor(id: string): Promise<SetorComMacroprocessos | null> {
    const setor = this.setores.find((outro) => outro.id === id)
    if (!setor) return null
    const macroprocessos = this.vinculos.filter((vinculo) => vinculo.setorId === id).flatMap((vinculo) => {
      const macroprocesso = this.macroprocessos.find((outro) => outro.id === vinculo.macroprocessoId)
      return macroprocesso
        ? [{ id: macroprocesso.id, codigo: macroprocesso.codigo, nome: macroprocesso.nome, observacao: vinculo.observacao }]
        : []
    })
    return { ...this.comCor(setor), macroprocessos: macroprocessos.sort(compararMacroprocessos) }
  }

  async criarSetor(dados: DadosDoSetor): Promise<void> {
    this.falharSeConfigurado()
    this.setores = [...this.setores, { id: `setor-${this.setores.length + 1}`, ativo: true, cor: this.primeiraCorLivre(), ...dados }]
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
    this.vinculos = this.vinculos.filter((vinculo) => vinculo.setorId !== id)
  }

  /** Mesma ordem do banco: código (os sem código depois) e nome. */
  async listarMacroprocessos(): Promise<MacroprocessoDaLista[]> {
    if (this.segurarListaDeMacroprocessos) return new Promise<never>(() => {})
    if (this.falharListaDeMacroprocessos) throw new Error('falha de conexão simulada')
    return [...this.macroprocessos].sort(compararMacroprocessos).map((macroprocesso) => ({
      ...macroprocesso,
      quantidadeDeSetores: this.vinculos.filter((vinculo) => vinculo.macroprocessoId === macroprocesso.id).length,
    }))
  }

  /** Setores envolvidos na ordem da sigla, como o banco. */
  async lerMacroprocesso(id: string): Promise<MacroprocessoComSetores | null> {
    const macroprocesso = this.macroprocessos.find((outro) => outro.id === id)
    if (!macroprocesso) return null
    const setoresEnvolvidos = this.vinculos.filter((vinculo) => vinculo.macroprocessoId === id).flatMap((vinculo) => {
      const setor = this.setores.find((outro) => outro.id === vinculo.setorId)
      return setor
        ? [{ setorId: setor.id, sigla: setor.sigla, nome: setor.nome, ativo: setor.ativo, cor: this.comCor(setor).cor, observacao: vinculo.observacao }]
        : []
    })
    return { ...macroprocesso, setoresEnvolvidos: setoresEnvolvidos.sort((a, b) => a.sigla.localeCompare(b.sigla, 'pt-BR')) }
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
    this.vinculos = this.vinculos.filter((vinculo) => vinculo.macroprocessoId !== id)
  }

  async porSetorNoMacroprocesso(macroprocessoId: string, setorId: string): Promise<void> {
    this.falharSeConfigurado()
    this.acharMacroprocesso(macroprocessoId)
    const setor = this.acharSetor(setorId)
    if (this.acharVinculo(macroprocessoId, setorId)) {
      throw new TravaDoBanco(`O setor ${setor.sigla} já está neste macroprocesso.`)
    }
    this.vinculos = [...this.vinculos, { macroprocessoId, setorId, observacao: null }]
  }

  /** Tirar um vínculo que já não existe não é erro, como no módulo real. */
  async tirarSetorDoMacroprocesso(macroprocessoId: string, setorId: string): Promise<void> {
    this.falharSeConfigurado()
    this.vinculos = this.vinculos.filter((vinculo) => vinculo !== this.acharVinculo(macroprocessoId, setorId))
  }

  async mudarObservacaoDoSetorEnvolvido(
    macroprocessoId: string, setorId: string, observacao: string | null,
  ): Promise<void> {
    this.falharSeConfigurado()
    const achado = this.acharVinculo(macroprocessoId, setorId)
    this.vinculos = this.vinculos.map((vinculo) => (vinculo === achado ? { ...vinculo, observacao } : vinculo))
  }

  async listarHistoricoDosCadastros(): Promise<EventoDoCadastro[]> {
    if (this.segurarHistorico) return new Promise<never>(() => {})
    if (this.falharHistorico) throw new Error('falha de conexão simulada')
    return [...this.historico]
  }

  private acharVinculo(macroprocessoId: string, setorId: string): Vinculo | undefined {
    return this.vinculos.find((vinculo) => vinculo.macroprocessoId === macroprocessoId && vinculo.setorId === setorId)
  }

  private falharSeConfigurado(): void {
    if (this.falhaDeGravacao === null) return
    throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
  }

  private comCor(setor: SetorDoTeste): Setor {
    return { ...setor, cor: setor.cor ?? 1 }
  }

  /** Imita o gatilho do banco: a menor cor de 1 a 30 que nenhum setor tem (ativo ou inativo); com as 30 em uso, a 1. */
  private primeiraCorLivre(): number {
    const emUso = new Set(this.setores.map((setor) => this.comCor(setor).cor))
    return Array.from({ length: 30 }, (_, i) => i + 1).find((cor) => !emUso.has(cor)) ?? 1
  }

  private acharSetor(id: string): SetorDoTeste {
    const setor = this.setores.find((outro) => outro.id === id)
    if (!setor) throw new CadastroInexistente()
    return setor
  }

  private trocarSetor(id: string, mudancas: Partial<SetorDoTeste>): void {
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
