import { extensaoDoNome } from '../../supabase/functions/_shared/decisao.ts'
import { tipoMimeDaExtensao } from '../../supabase/functions/_shared/drive.ts'
import { nomePadrao } from '../../supabase/functions/_shared/nomePadrao.ts'
import { nomeComORotuloNovo } from '../../supabase/functions/_shared/renumerar.ts'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { AnexosFalso } from '../anexos/AnexosFalso'
import type { EventoDoCadastro } from '../cadastros/tipos'
import { type DonoDoPdf, eventoDoPdfDaAprovacao } from '../revisoes/eventosDaValidacaoEDoPdf'
import { falhaDaFuncao } from './recusasDeVersoes'
import { proximoNumeroDoRelatorio } from './relatorioQueVale'
import {
  type ProcessoDoFalso, conferirPedido, conferirRelatorioSozinho, eventoDaSubstituicao, eventoDaVersao, eventoDoNumero, versaoRenumerada,
} from './regrasDoFalso'
import { ordenarVersoes, proximoNumero } from './rotulos'
import type {
  ArquivoDaVersao, ConferenciaDosArquivos, ModuloDeVersoes, PedidoDeAcrescimo, PedidoDePdfDaAprovacao, PedidoDeRelatorio,
  PedidoDeSubstituicao, PedidoDeVersao, Versao,
} from './tipos'

export type { ProcessoDoFalso }

/** Os .pdfs da aprovação de um processo: o atual (um por aprovação) e os guardados das aprovações trocadas. */
export type PdfsDaAprovacao = { atual: ArquivoDaVersao | null; guardados: ArquivoDaVersao[] }

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
  /** A situação de cada arquivo no Drive, pelo id do arquivo; o que não está aqui está `ok`. */
  conferencia: ConferenciaDosArquivos = {}
  /** Verdadeiro: a conferência com o Drive falha por conexão. */
  falharConferencia = false
  /** Os ids de processo conferidos com o Drive, na ordem. */
  conferidos: string[] = []
  /** O número da versão aprovada de cada processo (a falsa de revisões o preenche ao concluir a Aprovação e o apaga na volta). */
  aprovadas: Record<string, number> = {}
  /** Os .pdfs da aprovação, por processo (o histórico baixa os guardados). */
  pdfsDaAprovacao: Record<string, PdfsDaAprovacao> = {}
  /**
   * Quem liga a falsa de revisões: confere como o banco que o processo aceita o .pdf (andamento ou concluído) e
   * que a aprovação existe, e devolve o número da versão aprovada. Sem ela, o .pdf da aprovação não está disponível.
   */
  conferirAprovacaoDoPdf: ((processoId: string) => number) | null = null
  /** Falha a renomeação no Drive ao editar o número: Error é a recusa pronta (TravaDoBanco); nada muda. Null: o Drive aceita. */
  falharNaRenomeacao: Error | null = null
  /** Os envios que chegaram ao registro, na ordem. */
  envios: PedidoDeVersao[] = []
  /** Chamado com o evento de cada versão registrada (o histórico do processo fica no falso de processos). */
  aoRegistrar: ((processoId: string, evento: EventoDoCadastro) => void) | null = null
  /** Os anexos (módulo próprio): dividem o mapa de processos e o histórico com as versões. */
  anexos = new AnexosFalso(this.processos, (processoId, evento) => this.aoRegistrar?.(processoId, evento))
  private proximoId = 1
  /** Quantas vezes cada arquivo foi trocado: o hash (que o banco guarda) muda a cada troca. */
  private trocas: Record<string, number> = {}

  async listarVersoes(processoId: string): Promise<Versao[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    const aprovada = this.aprovadas[processoId]
    return ordenarVersoes(this.versoes[processoId] ?? []).map((versao) => (versao.numero === aprovada ? { ...versao, aprovada: true } : versao))
  }

  async enviarVersao(pedido: PedidoDeVersao, aoProgredir: (enviados: number, total: number) => void): Promise<void> {
    await this.enviar(pedido, aoProgredir, false)
  }

  async registrarVersaoHistorica(pedido: PedidoDeVersao, aoProgredir: (enviados: number, total: number) => void): Promise<void> {
    await this.enviar(pedido, aoProgredir, true)
  }

  private async enviar(pedido: PedidoDeVersao, aoProgredir: (enviados: number, total: number) => void,
    historica: boolean): Promise<void> {
    for (const [posicao, { arquivo }] of pedido.arquivos.entries()) {
      if (this.falharNoArquivo === posicao + 1) throw new Error(`o arquivo ${arquivo.name} não chegou ao Drive`)
      aoProgredir(posicao + 1, pedido.arquivos.length)
      if (this.segurarDepoisDe === posicao + 1) await new Promise<never>(() => {})
    }
    this.falharNoRegistroSeConfigurado()
    this.registrar(pedido, historica)
  }

  // Como o banco (função acrescentar_arquivo): o .png ou o .bpmn entra na versão piloto ou em sequência que ainda não o tem;
  // a histórica e a aprovada são recusadas, e o evento traz o papel.
  async acrescentarArquivo(pedido: PedidoDeAcrescimo, aoProgredir: (enviados: number, total: number) => void): Promise<void> {
    if (this.falharNoArquivo === 1) throw new Error(`o arquivo ${pedido.arquivo.name} não chegou ao Drive`)
    aoProgredir(1, 1)
    if (this.segurarDepoisDe === 1) await new Promise<never>(() => {})
    this.falharNoRegistroSeConfigurado()
    const versao = this.versaoDoPedido(pedido.processoId, pedido.versaoId)
    if (versao.historica) throw falhaDaFuncao('versao_historica_somente_leitura', '')
    if (this.aprovadas[pedido.processoId] === versao.numero) throw falhaDaFuncao('versao_aprovada', String(versao.numero))
    if (versao.arquivos.some((arquivo) => arquivo.papel === pedido.papel)) throw falhaDaFuncao('arquivo_ja_existe', '')
    this.guardarArquivo(pedido.processoId, versao, pedido.papel, pedido.arquivo)
  }

  // Como o banco (função enviar_relatorio): o relatório vai para a versão mais recente que não é histórica, com o próximo número do processo.
  async enviarRelatorio(pedido: PedidoDeRelatorio, aoProgredir: (enviados: number, total: number) => void): Promise<void> {
    if (this.falharNoArquivo === 1) throw new Error(`o arquivo ${pedido.arquivo.name} não chegou ao Drive`)
    aoProgredir(1, 1)
    if (this.segurarDepoisDe === 1) await new Promise<never>(() => {})
    this.falharNoRegistroSeConfigurado()
    const alvo = conferirRelatorioSozinho(this.versoes[pedido.processoId] ?? [], pedido)
    this.guardarRelatorio(pedido.processoId, alvo, pedido.arquivo, pedido.numeroDoRelatorio)
  }

  // Como o banco (função substituir_arquivo): o arquivo novo troca o conteúdo no mesmo registro, sem versão nova; a versão
  // histórica e o tipo diferente são recusados antes de o arquivo subir, como na sessão de envio da função.
  async substituirArquivo(pedido: PedidoDeSubstituicao, aoProgredir: (enviados: number, total: number) => void): Promise<void> {
    if (pedido.arquivo.papel === 'pdf_da_aprovacao') return await this.substituirPdf(pedido, aoProgredir)
    const { versao, atual } = this.alvoDaTroca(pedido)
    if (this.falharNoArquivo === 1) throw new Error(`o arquivo ${pedido.novo.name} não chegou ao Drive`)
    aoProgredir(1, 1)
    if (this.segurarDepoisDe === 1) await new Promise<never>(() => {})
    this.falharNoRegistroSeConfigurado()
    this.guardarTroca(pedido.processoId, versao, atual, pedido.novo.size)
  }

  // O arquivo a trocar com a versão dele, ou a recusa do banco (histórica, aprovada, tipo diferente).
  private alvoDaTroca({ processoId, arquivo, novo }: PedidoDeSubstituicao): { versao: Versao; atual: ArquivoDaVersao } {
    const versao = (this.versoes[processoId] ?? []).find((outra) => outra.arquivos.some((outro) => outro.id === arquivo.id))
    const atual = versao?.arquivos.find((outro) => outro.id === arquivo.id)
    if (!versao || !atual) throw new Error(`arquivo ${arquivo.id} não encontrado no processo ${processoId}`)
    if (versao.historica) throw falhaDaFuncao('versao_historica_somente_leitura', '')
    if (this.aprovadas[processoId] === versao.numero) throw falhaDaFuncao('versao_aprovada', String(versao.numero))
    if (extensaoDoNome(novo.name) !== atual.formato) throw falhaDaFuncao('tipo_de_arquivo_diferente', atual.formato)
    return { versao, atual }
  }

  // Como o banco (função registrar_pdf_da_aprovacao): o .pdf entra na aprovação do processo, na falta de um atual, depois de
  // o arquivo chegar ao Drive e de rodar o que o pedido mandava fazer antes (registrar a aprovação).
  async enviarPdfDaAprovacao(pedido: PedidoDePdfDaAprovacao, aoProgredir: (enviados: number, total: number) => void): Promise<void> {
    if (this.falharNoArquivo === 1) throw new Error(`o arquivo ${pedido.arquivo.name} não chegou ao Drive`)
    aoProgredir(1, 1)
    if (this.segurarDepoisDe === 1) await new Promise<never>(() => {})
    await pedido.antesDeRegistrar?.()
    this.falharNoRegistroSeConfigurado()
    const { processoId } = pedido
    const versao = this.aprovacaoDoPdf(processoId)
    const pdfs = this.pdfsDaAprovacao[processoId] ?? { atual: null, guardados: [] }
    if (pdfs.atual) throw falhaDaFuncao('pdf_ja_enviado', '')
    const processo = this.processos[processoId] ?? { sigla: 'TSA', nome: processoId, etapa: null }
    const nome = nomePadrao({
      sigla: processo.sigla, numero: versao, historica: false, nomeDoProcesso: processo.nome, papel: 'pdf_da_aprovacao', extensao: 'pdf',
    })
    const novo: ArquivoDaVersao = { id: `pdf${this.proximoId++}`, papel: 'pdf_da_aprovacao', nome, formato: 'pdf', tamanho: pedido.arquivo.size }
    this.pdfsDaAprovacao[processoId] = { ...pdfs, atual: novo }
    this.aoRegistrar?.(processoId, eventoDoPdfDaAprovacao(processoId, 'enviar_pdf', this.donoDoPdf(processoId, versao), { nome, hash: this.hashDe(novo.id) }))
  }

  /** Como registrar_aprovacao ao tomar o lugar da anterior: o .pdf atual fica guardado. Devolve o que ficou guardado, ou null. */
  guardarPdfAtual(processoId: string): ArquivoDaVersao | null {
    const pdfs = this.pdfsDaAprovacao[processoId]
    if (!pdfs?.atual) return null
    this.pdfsDaAprovacao[processoId] = { atual: null, guardados: [pdfs.atual, ...pdfs.guardados] }
    return pdfs.atual
  }

  // A troca do .pdf atual: o mesmo registro e o mesmo nome, outro tamanho e outro hash; só .pdf, e só enquanto o processo aceita.
  private async substituirPdf(pedido: PedidoDeSubstituicao, aoProgredir: (enviados: number, total: number) => void): Promise<void> {
    const { processoId, arquivo, novo } = pedido
    const atual = this.pdfsDaAprovacao[processoId]?.atual
    if (!atual || atual.id !== arquivo.id) throw new Error(`arquivo ${arquivo.id} não encontrado no processo ${processoId}`)
    if (extensaoDoNome(novo.name) !== 'pdf') throw falhaDaFuncao('tipo_de_arquivo_diferente', 'pdf')
    if (this.falharNoArquivo === 1) throw new Error(`o arquivo ${novo.name} não chegou ao Drive`)
    aoProgredir(1, 1)
    if (this.segurarDepoisDe === 1) await new Promise<never>(() => {})
    this.falharNoRegistroSeConfigurado()
    const versao = this.aprovacaoDoPdf(processoId)
    const hashQueSaiu = this.hashDe(atual.id)
    this.trocas[atual.id] = (this.trocas[atual.id] ?? 0) + 1
    delete this.conferencia[atual.id]
    this.pdfsDaAprovacao[processoId] = { ...this.pdfsDaAprovacao[processoId], atual: { ...atual, tamanho: novo.size } }
    const pdf = { nome: atual.nome, hash: this.hashDe(atual.id), hashQueSaiu }
    this.aoRegistrar?.(processoId, eventoDoPdfDaAprovacao(processoId, 'substituir_pdf', this.donoDoPdf(processoId, versao), pdf))
  }

  private aprovacaoDoPdf(processoId: string): number {
    if (!this.conferirAprovacaoDoPdf) throw new TravaDoBanco('A falsa de revisões não está ligada à falsa de versões.')
    return this.conferirAprovacaoDoPdf(processoId)
  }

  private donoDoPdf(processoId: string, versao: number): DonoDoPdf {
    const processo = this.processos[processoId] ?? { sigla: 'TSA', nome: processoId, etapa: null }
    return { versao, nomeDoProcesso: processo.nome, sigla: processo.sigla, autor: 'Pessoa de Teste' }
  }

  // Como a ação renumerar da função: confere o número, renomeia no Drive (a falha deixa tudo como estava) e então grava; o nome do
  // .pdf atual da aprovação acompanha, e o evento traz o rótulo de antes e o de depois.
  async editarNumero(versaoId: string, numeroEsperado: number, numeroNovo: number): Promise<void> {
    const processoId = Object.keys(this.versoes).find((id) => this.versoes[id].some((versao) => versao.id === versaoId))
    const versao = processoId === undefined ? undefined : this.versoes[processoId].find((outra) => outra.id === versaoId)
    if (processoId === undefined || !versao) throw new Error(`versão ${versaoId} não encontrada`)
    const nova = versaoRenumerada(this.versoes[processoId], versao, numeroEsperado, numeroNovo)
    if (this.falharNaRenomeacao) throw this.falharNaRenomeacao
    this.falharNoRegistroSeConfigurado()
    this.versoes[processoId] = this.versoes[processoId].map((outra) => (outra.id === versaoId ? nova : outra))
    const processo = this.processos[processoId] ?? { sigla: 'TSA', nome: processoId, etapa: null }
    this.aoRegistrar?.(processoId, eventoDoNumero(processoId, versao, nova, processo))
    this.acompanharAprovacao(processoId, versao.numero, nova.numero)
  }

  // A versão aprovada e o nome do .pdf atual dela seguem o número novo.
  private acompanharAprovacao(processoId: string, antigo: number, novo: number): void {
    if (this.aprovadas[processoId] !== antigo) return
    this.aprovadas[processoId] = novo
    const atual = this.pdfsDaAprovacao[processoId]?.atual
    if (atual) this.pdfsDaAprovacao[processoId].atual = { ...atual, nome: nomeComORotuloNovo(atual.nome, `_V${antigo}_`, `_V${novo}_`) }
  }

  // Como a ação conferir da função: uma situação por arquivo do processo, `ok` quando nada foi programado.
  async conferirArquivos(processoId: string): Promise<ConferenciaDosArquivos> {
    this.conferidos.push(processoId)
    if (this.falharConferencia) throw new Error('falha de conexão simulada')
    const pdfs = this.pdfsDaAprovacao[processoId]
    const doPdf = pdfs ? [...(pdfs.atual ? [pdfs.atual] : []), ...pdfs.guardados] : []
    const arquivos = [...(this.versoes[processoId] ?? []).flatMap((versao) => versao.arquivos), ...doPdf, ...(this.anexos.anexos[processoId] ?? [])]
    return Object.fromEntries(arquivos.map((arquivo) => [arquivo.id, this.conferencia[arquivo.id] ?? 'ok']))
  }

  async baixarArquivo(arquivo: ArquivoDaVersao): Promise<Blob> {
    if (this.falharNoDownload instanceof Error) throw this.falharNoDownload
    if (this.falharNoDownload) throw new Error('falha de conexão simulada')
    this.baixados.push(arquivo.id)
    return new Blob([`conteúdo de ${arquivo.nome}`], { type: tipoMimeDaExtensao(arquivo.formato) })
  }

  private versaoDoPedido(processoId: string, versaoId: string): Versao {
    const versao = (this.versoes[processoId] ?? []).find((outra) => outra.id === versaoId)
    if (!versao) throw new Error(`versão ${versaoId} não encontrada no processo ${processoId}`)
    return versao
  }

  // O relatório numerado entra na versão (último na ordem dos papéis); o evento traz o número do relatório.
  private guardarRelatorio(processoId: string, versao: Versao, arquivo: File, numeroDoRelatorio: number): void {
    const processo = this.processos[processoId] ?? { sigla: 'TSA', nome: processoId, etapa: null }
    const formato = extensaoDoNome(arquivo.name)
    const nome = nomePadrao({
      sigla: processo.sigla, numero: versao.numero, historica: false, piloto: versao.piloto, numeroDoRelatorio,
      nomeDoProcesso: processo.nome, papel: 'relatorio', extensao: formato,
    })
    const novo: ArquivoDaVersao = { id: `a${this.proximoId++}`, papel: 'relatorio', nome, formato, tamanho: arquivo.size, numeroDoRelatorio }
    const atualizada: Versao = { ...versao, arquivos: [...versao.arquivos, novo] }
    this.versoes[processoId] = (this.versoes[processoId] ?? []).map((outra) => (outra.id === versao.id ? atualizada : outra))
    this.aoRegistrar?.(processoId, eventoDaVersao(processoId, atualizada, processo, 'enviar_relatorio', { numero_do_relatorio: numeroDoRelatorio }))
  }

  // O .png ou o .bpmn entra na versão (na ordem dos papéis, no fim da lista); o evento traz o papel.
  private guardarArquivo(processoId: string, versao: Versao, papel: 'png' | 'bpmn', arquivo: File): void {
    const processo = this.processos[processoId] ?? { sigla: 'TSA', nome: processoId, etapa: null }
    const formato = extensaoDoNome(arquivo.name)
    const nome = nomePadrao({ sigla: processo.sigla, numero: versao.numero, historica: false, piloto: versao.piloto, nomeDoProcesso: processo.nome, papel, extensao: formato })
    const novo: ArquivoDaVersao = { id: `a${this.proximoId++}`, papel, nome, formato, tamanho: arquivo.size }
    const atualizada: Versao = { ...versao, arquivos: [...versao.arquivos, novo] }
    this.versoes[processoId] = (this.versoes[processoId] ?? []).map((outra) => (outra.id === versao.id ? atualizada : outra))
    this.aoRegistrar?.(processoId, eventoDaVersao(processoId, atualizada, processo, 'acrescentar_arquivo', { papel }))
  }

  // O arquivo fica com o mesmo id e o mesmo nome; muda o tamanho, e o evento traz o nome e o hash do que saiu.
  private guardarTroca(processoId: string, versao: Versao, atual: ArquivoDaVersao, tamanho: number): void {
    const processo = this.processos[processoId] ?? { sigla: 'TSA', nome: processoId, etapa: null }
    const hashQueSaiu = this.hashDe(atual.id)
    this.trocas[atual.id] = (this.trocas[atual.id] ?? 0) + 1
    delete this.conferencia[atual.id] // o banco passa a guardar o MD5 novo
    const atualizada: Versao = { ...versao, arquivos: versao.arquivos.map((outro) => (outro.id === atual.id ? { ...atual, tamanho } : outro)) }
    this.versoes[processoId] = (this.versoes[processoId] ?? []).map((outra) => (outra.id === versao.id ? atualizada : outra))
    const evento = eventoDaSubstituicao(processoId, atualizada, processo, atual.nome, { saiu: hashQueSaiu, entrou: this.hashDe(atual.id) })
    this.aoRegistrar?.(processoId, evento)
  }

  private hashDe(arquivoId: string): string {
    return `hash-${arquivoId}-${this.trocas[arquivoId] ?? 0}`
  }

  private falharNoRegistroSeConfigurado(): void {
    if (typeof this.falhaNoRegistro === 'string') throw new Error(this.falhaNoRegistro)
    if (this.falhaNoRegistro) throw this.falhaNoRegistro
  }

  // Como o banco: na em sequência o número é o maior + 1 (o do pedido é ignorado) e a etapa vem do processo; a histórica e a
  // piloto guardam o número digitado, e as regras delas valem antes de gravar (a histórica, sem etapa). O autor vem de quem grava.
  private registrar(pedido: PedidoDeVersao, historica: boolean): void {
    const doProcesso = this.versoes[pedido.processoId] ?? []
    const processo = this.processos[pedido.processoId] ?? { sigla: 'TSA', nome: pedido.processoId, etapa: null }
    const piloto = !historica && pedido.piloto === true
    conferirPedido(doProcesso, pedido, historica, piloto)
    const numero = historica || piloto ? pedido.numero : proximoNumero(doProcesso)
    const versao: Versao = {
      id: `v${this.proximoId++}`, numero, historica, piloto, enviadaEm: new Date().toISOString(), autor: 'Pessoa de Teste',
      etapa: historica ? null : processo.etapa, arquivos: this.arquivos(pedido, processo, numero, historica),
    }
    this.versoes[pedido.processoId] = [...doProcesso, versao]
    this.envios.push(pedido)
    const acao = historica ? 'registrar_historica' : piloto ? 'enviar_piloto' : 'enviar'
    this.aoRegistrar?.(pedido.processoId, eventoDaVersao(pedido.processoId, versao, processo, acao))
  }

  // O relatório que entra junto com a versão que não é histórica recebe o próximo número do processo (a histórica não numera).
  private arquivos(pedido: PedidoDeVersao, processo: ProcessoDoFalso, numero: number, historica: boolean): ArquivoDaVersao[] {
    const numeroDoRelatorio = proximoNumeroDoRelatorio(this.versoes[pedido.processoId] ?? [])
    return pedido.arquivos.map(({ papel, arquivo }) => {
      const formato = extensaoDoNome(arquivo.name)
      const doRelatorio = papel === 'relatorio' && !historica ? { numeroDoRelatorio } : {}
      const nome = nomePadrao({
        sigla: processo.sigla, numero, historica, piloto: pedido.piloto === true, ...doRelatorio, nomeDoProcesso: processo.nome, papel, extensao: formato,
      })
      return { id: `a${this.proximoId++}`, papel, nome, formato, tamanho: arquivo.size, ...doRelatorio }
    })
  }
}
