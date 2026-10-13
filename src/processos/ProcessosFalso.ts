import type { DadosDoResponsavel, EtapaDoSetor, ModuloDeProcessos, ResponsavelDoSetor } from './tipos'

type ChamadaDeEtapa = { acao: string; id: string; nota?: string }

// Dia fixo: os testes de tela não dependem da data em que rodam.
const HOJE = '2026-10-13'

/** Implementação falsa de processos para os testes de tela: sem rede, com falhas e esperas simuladas. */
export class ProcessosFalso implements ModuloDeProcessos {
  /** As etapas de cada setor (pelo id do setor), na ordem do catálogo. */
  etapasDoSetor: Record<string, EtapaDoSetor[]> = {}
  falharLeitura = false
  segurarLeitura = false
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaDeGravacao: string | Error | null = null
  /** As ações gravadas, na ordem. */
  chamadas: ChamadaDeEtapa[] = []
  /** Os responsáveis de cada setor (pelo id do setor). Leitura e gravação seguem as falhas acima. */
  responsaveisDoSetor: Record<string, ResponsavelDoSetor[]> = {}
  private proximoId = 1

  async lerEtapasDoSetor(setorId: string): Promise<EtapaDoSetor[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return [...(this.etapasDoSetor[setorId] ?? [])]
  }

  async iniciarEtapa(id: string): Promise<void> {
    this.mudar({ acao: 'iniciar', id }, { status: 'em_andamento', iniciadaEm: HOJE })
  }

  async concluirEtapa(id: string): Promise<void> {
    this.mudar({ acao: 'concluir', id }, { status: 'concluida', resolvidaEm: HOJE })
  }

  async dispensarEtapa(id: string, nota: string): Promise<void> {
    this.mudar({ acao: 'dispensar', id, nota }, { status: 'dispensada', nota, resolvidaEm: HOJE })
  }

  async registrarRealizadaAnteriormente(id: string, nota: string): Promise<void> {
    this.mudar({ acao: 'realizada', id, nota }, { status: 'realizada_anteriormente', nota, resolvidaEm: HOJE })
  }

  async lerResponsaveisDoSetor(setorId: string): Promise<ResponsavelDoSetor[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return [...(this.responsaveisDoSetor[setorId] ?? [])].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }

  async criarResponsavel(setorId: string, dados: DadosDoResponsavel): Promise<void> {
    this.conferirGravacao()
    const novo = { id: `r${this.proximoId++}`, ...dados }
    this.responsaveisDoSetor[setorId] = [...(this.responsaveisDoSetor[setorId] ?? []), novo]
  }

  async editarResponsavel(id: string, dados: DadosDoResponsavel): Promise<void> {
    this.conferirGravacao()
    this.mudarResponsaveis((lista) => lista.map((responsavel) => (responsavel.id === id ? { id, ...dados } : responsavel)))
  }

  async excluirResponsavel(id: string): Promise<void> {
    this.conferirGravacao()
    this.mudarResponsaveis((lista) => lista.filter((responsavel) => responsavel.id !== id))
  }

  private conferirGravacao(): void {
    if (this.falhaDeGravacao === null) return
    throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
  }

  private mudarResponsaveis(mudar: (lista: ResponsavelDoSetor[]) => ResponsavelDoSetor[]): void {
    for (const [setorId, lista] of Object.entries(this.responsaveisDoSetor)) this.responsaveisDoSetor[setorId] = mudar(lista)
  }

  private mudar(chamada: ChamadaDeEtapa, mudancas: Partial<EtapaDoSetor>): void {
    this.conferirGravacao()
    this.chamadas.push(chamada)
    for (const [setorId, etapas] of Object.entries(this.etapasDoSetor)) {
      this.etapasDoSetor[setorId] = etapas.map((etapa) => (etapa.id === chamada.id ? { ...etapa, ...mudancas } : etapa))
    }
  }
}
