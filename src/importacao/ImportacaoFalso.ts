import { extensaoDoNome } from '../../supabase/functions/_shared/decisao.ts'
import { nomePadrao } from '../../supabase/functions/_shared/nomePadrao.ts'
import type { ArquivoDaVersao, ArquivoEscolhido, Versao } from '../versoes/tipos'
import { type ProcessoDoFalso, eventoDaVersao } from '../versoes/regrasDoFalso'
import { VersoesFalso } from '../versoes/VersoesFalso'
import { chaveDoProcesso } from './chaves'
import type {
  ExistentesNaPlataforma, ModuloDeImportacao, PedidoDeImportacaoDeVersao, ProcessoDaPasta, ProcessoParaImportar, ProcessosParaAPasta,
  ResultadoDaGravacao, ResultadoDaVersao,
} from './tipos'

/**
 * Importação em memória para os testes de tela: o que já existe, o que foi gravado e falhas programáveis. As versões
 * importadas vão para o `VersoesFalso` recebido, para aparecerem no painel do processo como qualquer outra.
 */
export class ImportacaoFalso implements ModuloDeImportacao {
  existentes: ExistentesNaPlataforma = { setores: [], macroprocessos: [], processos: [] }
  gravados: ProcessoParaImportar[] = []
  falharAoListar = false
  /** O nome do processo cuja gravação falha (para ver a falha no meio da carga). */
  falharNoProcesso: string | null = null
  /** Chamado a cada processo criado, para o teste levar o processo aos outros falsos (Lista, Quadro, Cadastros). */
  aoCriar: ((processo: ProcessoParaImportar) => void) | null = null
  /** Os processos da plataforma para a pasta; as versões e o maior relatório saem do `VersoesFalso`. */
  processosDaPasta: Omit<ProcessoDaPasta, 'versoes' | 'maiorRelatorio' | 'anexos'>[] = []
  falharAoListarAPasta = false
  /** Já houve importação da planilha; a gravação de um processo também liga. */
  haImportado = false
  /** O nome do arquivo cujo envio falha (a versão dele não é registrada). */
  falharNoArquivo: string | null = null
  /** O nome do arquivo depois do qual o envio fica parado (para ver o andamento na tela). */
  segurarDepoisDe: string | null = null
  anexosImportados: { processoId: string; nome: string }[] = []
  subpastasAnotadas: { processoId: string; subpasta: string }[] = []
  readonly versoes: VersoesFalso
  private proximoId = 1

  constructor(versoes: VersoesFalso = new VersoesFalso()) {
    this.versoes = versoes
  }

  async listarExistentes(): Promise<ExistentesNaPlataforma> {
    if (this.falharAoListar) throw new Error('falha de teste ao ler o que já existe')
    return {
      setores: [...this.existentes.setores], macroprocessos: [...this.existentes.macroprocessos],
      processos: [...this.existentes.processos],
    }
  }

  async gravarProcesso(processo: ProcessoParaImportar): Promise<ResultadoDaGravacao> {
    if (processo.nome === this.falharNoProcesso) throw new Error(`falha de teste ao gravar ${processo.nome}`)
    const chave = chaveDoProcesso(processo.setor, processo.nome)
    if (this.existentes.processos.includes(chave)) return 'ja_existia'
    this.existentes.processos.push(chave)
    this.existentes.setores.push(processo.setor.toUpperCase())
    this.existentes.macroprocessos.push(processo.macroprocesso.toLowerCase())
    this.gravados.push(processo)
    this.haImportado = true
    this.aoCriar?.(processo)
    return 'criado'
  }

  async listarProcessosDaPasta(): Promise<ProcessosParaAPasta> {
    if (this.falharAoListarAPasta) throw new Error('falha de teste ao ler os processos')
    const processos = this.processosDaPasta.map((p) => {
      const doProcesso = this.versoes.versoes[p.id] ?? []
      const relatorios = doProcesso.flatMap((v) => v.arquivos.map((a) => a.numeroDoRelatorio ?? 0))
      const anexos = this.anexosImportados.filter((a) => a.processoId === p.id).map((a) => a.nome.toLowerCase())
      return { ...p, versoes: doProcesso.map((v) => v.numero), maiorRelatorio: Math.max(0, ...relatorios), anexos }
    })
    return { processos, haImportado: this.haImportado }
  }

  async importarVersao(pedido: PedidoDeImportacaoDeVersao, aoProgredir: (enviados: number, total: number) => void): Promise<ResultadoDaVersao> {
    for (const [posicao, { arquivo }] of pedido.arquivos.entries()) {
      if (arquivo.name === this.falharNoArquivo) throw new Error(`o arquivo ${arquivo.name} não chegou ao Drive`)
      aoProgredir(posicao + 1, pedido.arquivos.length)
      if (arquivo.name === this.segurarDepoisDe) await new Promise<never>(() => {})
    }
    const doProcesso = this.versoes.versoes[pedido.processoId] ?? []
    if (doProcesso.some((v) => v.numero === pedido.numero)) return 'ja_existia'
    const processo = this.processoDoFalso(pedido.processoId)
    const versao = this.versaoImportada(pedido, processo)
    this.versoes.versoes[pedido.processoId] = [...doProcesso, versao]
    this.versoes.aoRegistrar?.(pedido.processoId, eventoDaVersao(pedido.processoId, versao, processo, 'importar'))
    return 'criada'
  }

  async importarAnexo(processoId: string, arquivo: File): Promise<ResultadoDaGravacao> {
    if (arquivo.name === this.falharNoArquivo) throw new Error(`o arquivo ${arquivo.name} não chegou ao Drive`)
    if (this.anexosImportados.some((a) => a.processoId === processoId && a.nome === arquivo.name)) return 'ja_existia'
    this.anexosImportados.push({ processoId, nome: arquivo.name })
    return 'criado'
  }

  async anotarSubpasta(processoId: string, subpasta: string): Promise<void> {
    if (this.subpastasAnotadas.some((s) => s.processoId === processoId && s.subpasta === subpasta)) return
    this.subpastasAnotadas.push({ processoId, subpasta })
  }

  private processoDoFalso(processoId: string): ProcessoDoFalso {
    const daPasta = this.processosDaPasta.find((p) => p.id === processoId)
    const sigla = daPasta?.chave.split('|')[0] ?? 'TSA'
    return this.versoes.processos[processoId] ?? { sigla, nome: daPasta?.nome ?? processoId, etapa: null }
  }

  // Como o banco (importar_versao): o número do pedido, a etapa do processo (a histórica não tem) e o nome padrão de cada arquivo.
  private versaoImportada(pedido: PedidoDeImportacaoDeVersao, processo: ProcessoDoFalso): Versao {
    const historica = pedido.tipo === 'historica'
    return {
      id: `vi${String(this.proximoId++)}`, numero: pedido.numero, historica, piloto: pedido.tipo === 'piloto',
      enviadaEm: new Date().toISOString(), autor: 'Pessoa de Teste', etapa: historica ? null : processo.etapa,
      arquivos: pedido.arquivos.map((escolhido) => this.arquivoImportado(pedido, processo, escolhido)),
    }
  }

  private arquivoImportado(pedido: PedidoDeImportacaoDeVersao, processo: ProcessoDoFalso, { papel, arquivo }: ArquivoEscolhido): ArquivoDaVersao {
    const formato = extensaoDoNome(arquivo.name)
    const numerado = papel === 'relatorio' && pedido.numeroDoRelatorio !== null ? { numeroDoRelatorio: pedido.numeroDoRelatorio } : {}
    const nome = nomePadrao({
      sigla: processo.sigla, numero: pedido.numero, historica: pedido.tipo === 'historica', piloto: pedido.tipo === 'piloto',
      ...numerado, nomeDoProcesso: processo.nome, papel, extensao: formato,
    })
    return { id: `ai${String(this.proximoId++)}`, papel, nome, formato, tamanho: arquivo.size, ...numerado }
  }
}
