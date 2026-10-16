import { extensaoDoNome } from '../../supabase/functions/_shared/decisao.ts'
import { tipoMimeDaExtensao } from '../../supabase/functions/_shared/drive.ts'
import { nomePadrao } from '../../supabase/functions/_shared/nomePadrao.ts'
import type { EventoDoCadastro } from '../cadastros/tipos'
import { falhaDaFuncao } from './recusasDeVersoes'
import { haVersaoNova, ordenarVersoes, proximoNumero, relatorioPendente, rotuloDaVersao } from './rotulos'
import type {
  ArquivoDaVersao, ModuloDeVersoes, PedidoDeRelatorio, PedidoDeSubstituicao, PedidoDeVersao, Versao,
} from './tipos'

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
  /** Quantas vezes cada arquivo foi trocado: o hash (que o banco guarda) muda a cada troca. */
  private trocas: Record<string, number> = {}

  async listarVersoes(processoId: string): Promise<Versao[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return ordenarVersoes(this.versoes[processoId] ?? [])
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

  // Como o relatório depois do banco (função acrescentar_relatorio): só na versão nova que ainda não tem relatório.
  async acrescentarRelatorio(pedido: PedidoDeRelatorio, aoProgredir: (enviados: number, total: number) => void): Promise<void> {
    if (this.falharNoArquivo === 1) throw new Error(`o arquivo ${pedido.arquivo.name} não chegou ao Drive`)
    aoProgredir(1, 1)
    if (this.segurarDepoisDe === 1) await new Promise<never>(() => {})
    this.falharNoRegistroSeConfigurado()
    const versao = this.versaoDoPedido(pedido.processoId, pedido.versaoId)
    conferirRelatorioNovo(versao)
    this.guardarRelatorio(pedido.processoId, versao, { formato: extensaoDoNome(pedido.arquivo.name), tamanho: pedido.arquivo.size })
  }

  // Como o banco (funções origem_do_relatorio e registrar_sem_alteracao): copia o relatório da versão imediatamente
  // anterior, com o nome da versão nova, ligado ao original.
  async semAlteracaoDeConteudo(processoId: string, versaoId: string): Promise<void> {
    this.falharNoRegistroSeConfigurado()
    const versao = this.versaoDoPedido(processoId, versaoId)
    if (versao.historica) throw falhaDaFuncao('versao_historica_somente_leitura', '')
    const origem = relatorioDaAnterior(versao, this.versoes[processoId] ?? [])
    if (!origem) throw falhaDaFuncao('versao_anterior_sem_relatorio', '')
    conferirRelatorioNovo(versao)
    this.guardarRelatorio(processoId, versao, origem.arquivo, origem)
  }

  // Como o banco (função substituir_arquivo): o arquivo novo troca o conteúdo no mesmo registro, sem versão nova; a versão
  // histórica e o tipo diferente são recusados antes de o arquivo subir, como na sessão de envio da função.
  async substituirArquivo(pedido: PedidoDeSubstituicao, aoProgredir: (enviados: number, total: number) => void): Promise<void> {
    const { processoId, arquivo, novo } = pedido
    const versao = (this.versoes[processoId] ?? []).find((outra) => outra.arquivos.some((outro) => outro.id === arquivo.id))
    const atual = versao?.arquivos.find((outro) => outro.id === arquivo.id)
    if (!versao || !atual) throw new Error(`arquivo ${arquivo.id} não encontrado no processo ${processoId}`)
    if (versao.historica) throw falhaDaFuncao('versao_historica_somente_leitura', '')
    if (extensaoDoNome(novo.name) !== atual.formato) throw falhaDaFuncao('tipo_de_arquivo_diferente', atual.formato)
    if (this.falharNoArquivo === 1) throw new Error(`o arquivo ${novo.name} não chegou ao Drive`)
    aoProgredir(1, 1)
    if (this.segurarDepoisDe === 1) await new Promise<never>(() => {})
    this.falharNoRegistroSeConfigurado()
    this.guardarTroca(processoId, versao, atual, novo.size)
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

  // O relatório entra na versão (último na ordem dos papéis); o evento traz, na cópia, a versão de onde veio.
  private guardarRelatorio(processoId: string, versao: Versao, { formato, tamanho }: Pick<ArquivoDaVersao, 'formato' | 'tamanho'>,
    origem?: OrigemDaCopia): void {
    const processo = this.processos[processoId] ?? { sigla: 'TSA', nome: processoId, etapa: null }
    const nome = nomePadrao({ sigla: processo.sigla, numero: versao.numero, historica: false, nomeDoProcesso: processo.nome, papel: 'relatorio', extensao: formato })
    const copia = origem ? { copiadoDe: origem.arquivo.id } : {}
    const novo: ArquivoDaVersao = { id: `a${this.proximoId++}`, papel: 'relatorio', nome, formato, tamanho, ...copia }
    const atualizada: Versao = { ...versao, arquivos: [...versao.arquivos, novo] }
    this.versoes[processoId] = (this.versoes[processoId] ?? []).map((outra) => (outra.id === versao.id ? atualizada : outra))
    this.aoRegistrar?.(processoId, eventoDaVersao(processoId, atualizada, processo, origem ? 'sem_alteracao' : 'acrescentar_relatorio', origem?.rotulo))
  }

  // O arquivo fica com o mesmo id e o mesmo nome; muda o tamanho, e o evento traz o nome e o hash do que saiu.
  private guardarTroca(processoId: string, versao: Versao, atual: ArquivoDaVersao, tamanho: number): void {
    const processo = this.processos[processoId] ?? { sigla: 'TSA', nome: processoId, etapa: null }
    const hashQueSaiu = this.hashDe(atual.id)
    this.trocas[atual.id] = (this.trocas[atual.id] ?? 0) + 1
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

  // Como o banco: na nova o número é o maior + 1 (o do pedido é ignorado) e a etapa vem do processo; a histórica
  // guarda o número digitado, sem etapa, e as regras dela valem antes de gravar. O autor vem de quem grava.
  private registrar(pedido: PedidoDeVersao, historica: boolean): void {
    const doProcesso = this.versoes[pedido.processoId] ?? []
    const processo = this.processos[pedido.processoId] ?? { sigla: 'TSA', nome: pedido.processoId, etapa: null }
    if (historica) conferirHistorica(doProcesso, pedido)
    const numero = historica ? pedido.numero : proximoNumero(doProcesso)
    const versao: Versao = {
      id: `v${this.proximoId++}`, numero, historica, enviadaEm: new Date().toISOString(), autor: 'Pessoa de Teste',
      etapa: historica ? null : processo.etapa, observacao: pedido.observacao,
      arquivos: this.arquivos(pedido, processo, numero, historica),
    }
    this.versoes[pedido.processoId] = [...doProcesso, versao]
    this.envios.push(pedido)
    this.aoRegistrar?.(pedido.processoId, eventoDaVersao(pedido.processoId, versao, processo, historica ? 'registrar_historica' : 'enviar'))
  }

  private arquivos(pedido: PedidoDeVersao, processo: ProcessoDoFalso, numero: number, historica: boolean): ArquivoDaVersao[] {
    return pedido.arquivos.map(({ papel, arquivo }) => {
      const formato = extensaoDoNome(arquivo.name)
      const nome = nomePadrao({ sigla: processo.sigla, numero, historica, nomeDoProcesso: processo.nome, papel, extensao: formato })
      return { id: `a${this.proximoId++}`, papel, nome, formato, tamanho: arquivo.size }
    })
  }
}

// As regras que o banco impõe à histórica (migração versoes_historicas), com as mesmas frases do módulo real.
function conferirHistorica(doProcesso: Versao[], pedido: PedidoDeVersao): void {
  if (haVersaoNova(doProcesso)) throw falhaDaFuncao('historica_depois_de_versao_nova', '')
  if (doProcesso.some((versao) => versao.numero === pedido.numero)) {
    throw falhaDaFuncao('numero_historico_repetido', String(pedido.numero))
  }
  const papeis = pedido.arquivos.map(({ papel }) => papel)
  if (!papeis.includes('bpm') && !(papeis.includes('bpmn') && papeis.includes('png'))) {
    throw falhaDaFuncao('historica_sem_arquivo_de_fluxograma', '')
  }
}

// O relatório só entra na versão nova que ainda não tem relatório (migração relatorio_depois_e_sem_alteracao).
function conferirRelatorioNovo(versao: Versao): void {
  if (versao.historica) throw falhaDaFuncao('versao_historica_somente_leitura', '')
  if (!relatorioPendente(versao)) throw falhaDaFuncao('relatorio_ja_existe', '')
}

type OrigemDaCopia = { arquivo: ArquivoDaVersao; rotulo: string }

// O relatório da versão imediatamente anterior (a de maior número menor), com o rótulo dela.
function relatorioDaAnterior(versao: Versao, doProcesso: Versao[]): OrigemDaCopia | undefined {
  const anterior = ordenarVersoes(doProcesso).find((outra) => outra.numero < versao.numero)
  const arquivo = anterior?.arquivos.find((outro) => outro.papel === 'relatorio')
  return anterior && arquivo ? { arquivo, rotulo: rotuloDaVersao(anterior) } : undefined
}

// O evento do gatilho da substituição (migração substituir_arquivo): o antes guarda o nome e o hash do que saiu.
function eventoDaSubstituicao(processoId: string, versao: Versao, processo: ProcessoDoFalso, nome: string,
  hashes: { saiu: string; entrou: string }): EventoDoCadastro {
  return {
    id: Date.now(), ocorridoEm: new Date().toISOString(), autor: 'Pessoa de Teste', acao: 'substituir', entidade: 'versao',
    entidadeRef: processoId, antes: { nome, hash_md5: hashes.saiu },
    depois: {
      rotulo: rotuloDaVersao(versao), processo_nome: processo.nome, setor_sigla: processo.sigla, nome, hash_md5: hashes.entrou,
    },
  }
}

// O evento que o gatilho do banco grava (migração versoes): entidade "versao", referência no processo.
function eventoDaVersao(processoId: string, versao: Versao, processo: ProcessoDoFalso, acao: string, relatorioDe?: string): EventoDoCadastro {
  const depois = {
    rotulo: rotuloDaVersao(versao), processo_nome: processo.nome, setor_sigla: processo.sigla, etapa: versao.etapa,
    observacao: versao.observacao, arquivos: versao.arquivos.map(({ papel, nome }) => ({ papel, nome })),
    ...(relatorioDe ? { relatorio_de: relatorioDe } : {}),
  }
  return {
    id: Date.now(), ocorridoEm: versao.enviadaEm, autor: 'Pessoa de Teste', acao, entidade: 'versao',
    entidadeRef: processoId, antes: null, depois,
  }
}
