import { extensaoDoNome } from '../../supabase/functions/_shared/decisao.ts'
import type { EventoDoCadastro } from '../cadastros/tipos'
import type { ProcessoDoFalso } from '../versoes/regrasDoFalso'
import { ordenarAnexos } from './regrasDoAnexo'
import type { Anexo, ModuloDeAnexos, PedidoDeAnexo } from './tipos'

/** Implementação falsa de anexos para os testes de tela: sem rede, com falhas e esperas programáveis. */
export class AnexosFalso implements ModuloDeAnexos {
  /** Os anexos gravados, por processo. */
  anexos: Record<string, Anexo[]> = {}
  falharLeitura = false
  segurarLeitura = false
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaNoEnvio: string | Error | null = null
  /** Verdadeiro: o envio fica parado depois de avisar que o arquivo chegou (para ver o "Enviando…"). */
  segurarEnvio = false
  /** Os pedidos de envio que chegaram, na ordem. */
  envios: PedidoDeAnexo[] = []
  /** A etapa em que o processo está agora, como o banco a lê no envio; quem liga a falsa à de processos a troca. */
  etapaAtual: (processoId: string) => string | null = (processoId) => this.processos[processoId]?.etapa ?? null
  private proximoId = 1

  private readonly processos: Record<string, ProcessoDoFalso>
  private readonly aoRegistrar: (processoId: string, evento: EventoDoCadastro) => void

  /** `aoRegistrar` recebe o evento de cada envio (o histórico do processo fica no falso de processos), como o gatilho do banco. */
  constructor(processos: Record<string, ProcessoDoFalso>, aoRegistrar: (processoId: string, evento: EventoDoCadastro) => void) {
    this.processos = processos
    this.aoRegistrar = aoRegistrar
  }

  async listarAnexos(processoId: string): Promise<Anexo[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return ordenarAnexos(this.anexos[processoId] ?? [])
  }

  async enviarAnexo(pedido: PedidoDeAnexo, aoProgredir: (enviados: number, total: number) => void): Promise<void> {
    this.envios.push(pedido)
    if (typeof this.falhaNoEnvio === 'string') throw new Error(this.falhaNoEnvio)
    if (this.falhaNoEnvio) throw this.falhaNoEnvio
    aoProgredir(1, 1)
    if (this.segurarEnvio) await new Promise<never>(() => {})
    this.guardar(pedido)
  }

  // O mais recente vai para o começo da lista; o instante cresce a cada envio, como o relógio do banco.
  private guardar({ processoId, arquivo }: PedidoDeAnexo): void {
    const processo = this.processos[processoId] ?? { sigla: 'TSA', nome: processoId, etapa: null }
    const numero = this.proximoId++
    const novo: Anexo = {
      id: `an${numero}`, papel: 'anexo', nome: arquivo.name, formato: extensaoDoNome(arquivo.name), tamanho: arquivo.size,
      etapa: this.etapaAtual(processoId), autor: 'Pessoa de Teste', enviadoEm: new Date(Date.now() + numero).toISOString(),
    }
    this.anexos[processoId] = [novo, ...(this.anexos[processoId] ?? [])]
    this.aoRegistrar(processoId, {
      id: Date.now() + numero, ocorridoEm: novo.enviadoEm, autor: 'Pessoa de Teste', acao: 'enviar', entidade: 'anexo',
      entidadeRef: processoId, antes: null,
      depois: { nome: novo.nome, formato: novo.formato, etapa: novo.etapa, processo_nome: processo.nome, setor_sigla: processo.sigla },
    })
  }
}
