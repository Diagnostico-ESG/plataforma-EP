import { extensaoDoNome } from '../../supabase/functions/_shared/decisao.ts'
import { tipoMimeDaExtensao } from '../../supabase/functions/_shared/drive.ts'
import { nomePadrao } from '../../supabase/functions/_shared/nomePadrao.ts'
import type { EventoDoCadastro } from '../cadastros/tipos'
import { ordenarVersoes, proximoNumero, rotuloDaVersao } from './rotulos'
import type { ArquivoDaVersao, ModuloDeVersoes, PedidoDeVersao, Versao } from './tipos'

/** O que o falso precisa saber do processo para nomear os arquivos e guardar a etapa, como o banco. */
export type ProcessoDoFalso = { sigla: string; nome: string; etapa: string | null }

/** Implementação falsa de versões para os testes de tela: sem rede, com falhas e esperas programáveis. */
export class VersoesFalso implements ModuloDeVersoes {
  /** As versões gravadas, por processo. */
  versoes: Record<string, Versao[]> = {}
  /** Sigla, nome e etapa atual de cada processo (pelo id). */
  processos: Record<string, ProcessoDoFalso> = {}
  falharLeitura = false
  segurarLeitura = false
  /** A posição (1, 2, …) do arquivo que não chega ao Drive; null: todos chegam. */
  falharNoArquivo: number | null = null
  /** Segura o envio depois que este número de arquivos chegou (para ver o progresso); null: não segura. */
  segurarDepoisDe: number | null = null
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaNoRegistro: string | Error | null = null
  /** Verdadeiro: o download falha por conexão; Error: a falha pronta (TravaDoBanco), como o módulo real. */
  falharNoDownload: boolean | Error = false
  /** Os ids dos arquivos baixados, na ordem. */
  baixados: string[] = []
  /** Os envios que chegaram ao registro, na ordem. */
  envios: PedidoDeVersao[] = []
  /** Chamado com o evento de cada versão registrada (o histórico do processo fica no falso de processos). */
  aoRegistrar: ((processoId: string, evento: EventoDoCadastro) => void) | null = null
  private proximoId = 1

  async listarVersoes(processoId: string): Promise<Versao[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return ordenarVersoes(this.versoes[processoId] ?? [])
  }

  async enviarVersao(pedido: PedidoDeVersao, aoProgredir: (enviados: number, total: number) => void): Promise<void> {
    for (const [posicao, { arquivo }] of pedido.arquivos.entries()) {
      if (this.falharNoArquivo === posicao + 1) throw new Error(`o arquivo ${arquivo.name} não chegou ao Drive`)
      aoProgredir(posicao + 1, pedido.arquivos.length)
      if (this.segurarDepoisDe === posicao + 1) await new Promise<never>(() => {})
    }
    this.falharNoRegistroSeConfigurado()
    this.registrar(pedido)
  }

  async baixarArquivo(arquivo: ArquivoDaVersao): Promise<Blob> {
    if (this.falharNoDownload instanceof Error) throw this.falharNoDownload
    if (this.falharNoDownload) throw new Error('falha de conexão simulada')
    this.baixados.push(arquivo.id)
    return new Blob([`conteúdo de ${arquivo.nome}`], { type: tipoMimeDaExtensao(arquivo.formato) })
  }

  private falharNoRegistroSeConfigurado(): void {
    if (typeof this.falhaNoRegistro === 'string') throw new Error(this.falhaNoRegistro)
    if (this.falhaNoRegistro) throw this.falhaNoRegistro
  }

  // Como o banco: o número é o maior + 1 (o do pedido é ignorado), e a etapa e o autor vêm de quem grava.
  private registrar(pedido: PedidoDeVersao): void {
    const doProcesso = this.versoes[pedido.processoId] ?? []
    const processo = this.processos[pedido.processoId] ?? { sigla: 'TSA', nome: pedido.processoId, etapa: null }
    const numero = proximoNumero(doProcesso)
    const versao: Versao = {
      id: `v${this.proximoId++}`, numero, historica: false, enviadaEm: new Date().toISOString(), autor: 'Pessoa de Teste',
      etapa: processo.etapa, observacao: pedido.observacao, arquivos: this.arquivos(pedido, processo, numero),
    }
    this.versoes[pedido.processoId] = [...doProcesso, versao]
    this.envios.push(pedido)
    this.aoRegistrar?.(pedido.processoId, eventoDoEnvio(pedido.processoId, versao, processo))
  }

  private arquivos(pedido: PedidoDeVersao, processo: ProcessoDoFalso, numero: number): ArquivoDaVersao[] {
    return pedido.arquivos.map(({ papel, arquivo }) => {
      const formato = extensaoDoNome(arquivo.name)
      const nome = nomePadrao({ sigla: processo.sigla, numero, historica: false, nomeDoProcesso: processo.nome, papel, extensao: formato })
      return { id: `a${this.proximoId++}`, papel, nome, formato, tamanho: arquivo.size }
    })
  }
}

// O evento que o gatilho do banco grava (migração versoes): entidade "versao", referência no processo.
function eventoDoEnvio(processoId: string, versao: Versao, processo: ProcessoDoFalso): EventoDoCadastro {
  const depois = {
    rotulo: rotuloDaVersao(versao), processo_nome: processo.nome, setor_sigla: processo.sigla, etapa: versao.etapa,
    observacao: versao.observacao, arquivos: versao.arquivos.map(({ papel, nome }) => ({ papel, nome })),
  }
  return {
    id: Date.now(), ocorridoEm: versao.enviadaEm, autor: 'Pessoa de Teste', acao: 'enviar', entidade: 'versao',
    entidadeRef: processoId, antes: null, depois,
  }
}
