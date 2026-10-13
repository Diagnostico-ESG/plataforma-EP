import type { EtapaDoSetor, ModuloDeProcessos } from './tipos'

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

  private mudar(chamada: ChamadaDeEtapa, mudancas: Partial<EtapaDoSetor>): void {
    if (this.falhaDeGravacao !== null) {
      throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
    }
    this.chamadas.push(chamada)
    for (const [setorId, etapas] of Object.entries(this.etapasDoSetor)) {
      this.etapasDoSetor[setorId] = etapas.map((etapa) => (etapa.id === chamada.id ? { ...etapa, ...mudancas } : etapa))
    }
  }
}
