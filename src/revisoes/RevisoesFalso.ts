import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import type { ProcessosFalso } from '../processos/ProcessosFalso'
import type { ProcessoLido, UltimaVersao, UsuarioResponsavel } from '../processos/tipos'
import { FRASE_DO_ESCOPO_OBRIGATORIO, FRASE_DO_ESCOPO_SO_NA_CORRIGIDA } from './frasesDeRevisao'
import { opcoesDaRevisao } from './opcoesDaRevisao'
import type { DadosDaRevisao, ModuloDeRevisoes, RevisaoInterna } from './tipos'

// O mesmo dia fixo da falsa de processos: os testes de tela não dependem da data em que rodam.
const HOJE = '2026-10-13'

/** As recusas do banco para a revisão: escopo e quem pode revisar a versão mais recente (as regras de opcoesDaRevisao). */
function conferirRevisao(ultima: UltimaVersao | null, usuarioId: string, dados: DadosDaRevisao): void {
  if (dados.resultado === 'sem_alteracao' && dados.escopo !== null) throw new TravaDoBanco(FRASE_DO_ESCOPO_SO_NA_CORRIGIDA)
  if (dados.resultado === 'corrigida' && dados.escopo === null) throw new TravaDoBanco(FRASE_DO_ESCOPO_OBRIGATORIO)
  const opcoes = opcoesDaRevisao(ultima, usuarioId)
  const opcao = dados.resultado === 'corrigida' ? opcoes.corrigida : opcoes.semAlteracao
  if (!opcao.disponivel) throw new TravaDoBanco(opcao.motivo ?? opcoes.bloqueio ?? '')
}

/**
 * Implementação falsa de revisões para os testes de tela: sem rede, com falhas e esperas programáveis. Concluir a revisão
 * conclui a etapa na falsa de processos, como a função do banco faz numa gravação só.
 */
export class RevisoesFalso implements ModuloDeRevisoes {
  /** As revisões gravadas, por processo, da mais recente para a mais antiga. */
  revisoes: Record<string, RevisaoInterna[]> = {}
  falharLeitura = false
  segurarLeitura = false
  /** Segura a gravação (para ver o "Salvando…"). */
  segurarGravacao = false
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaNaGravacao: string | Error | null = null
  /** As conclusões que chegaram ao banco, na ordem. */
  conclusoes: { andamentoId: string; dados: DadosDaRevisao; responsavelId: string | null }[] = []
  private proximoId = 1
  private readonly processos: ProcessosFalso | undefined
  private readonly usuario: UsuarioResponsavel

  /** `processos` é a falsa onde as etapas vivem; `usuario` é quem está na tela (o revisor). */
  constructor(processos?: ProcessosFalso, usuario: UsuarioResponsavel = { id: 'usuario-de-teste', nome: 'Pessoa de Teste' }) {
    this.processos = processos
    this.usuario = usuario
  }

  async listarRevisoes(processoId: string): Promise<RevisaoInterna[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return [...(this.revisoes[processoId] ?? [])]
  }

  async concluirRevisaoInterna(andamentoId: string, dados: DadosDaRevisao, responsavelId: string | null): Promise<void> {
    if (this.falhaNaGravacao !== null) {
      throw typeof this.falhaNaGravacao === 'string' ? new Error(this.falhaNaGravacao) : this.falhaNaGravacao
    }
    if (this.segurarGravacao) await new Promise<never>(() => {})
    const processo = this.processoDaEtapa(andamentoId)
    conferirRevisao(processo.ultimaVersao, this.usuario.id, dados)
    // Conclui primeiro: a recusa da conclusão (responsável, processo parado) não deixa a revisão, como no banco.
    await (this.processos as ProcessosFalso).concluirEtapa(andamentoId, responsavelId)
    this.conclusoes.push({ andamentoId, dados, responsavelId })
    this.guardar(processo, dados)
  }

  private processoDaEtapa(andamentoId: string): ProcessoLido {
    if (!this.processos) throw new Error('RevisoesFalso sem ProcessosFalso: monte new RevisoesFalso(processos, usuario)')
    const processo = this.processos.processos.find((outro) => outro.etapasDoProcesso.some((etapa) => etapa.id === andamentoId))
    if (!processo) throw new CadastroInexistente()
    return processo
  }

  private guardar(processo: ProcessoLido, dados: DadosDaRevisao): void {
    const ultima = processo.ultimaVersao as UltimaVersao
    const corrigida = dados.resultado === 'corrigida'
    const revisao: RevisaoInterna = {
      id: `r${this.proximoId++}`,
      versaoRevisada: corrigida ? (ultima.anterior as { numero: number }).numero : ultima.numero,
      versaoCorrigida: corrigida ? ultima.numero : null,
      resultado: dados.resultado, escopo: corrigida ? dados.escopo : null, comentario: dados.comentario,
      revisor: this.usuario.nome, revisadaEm: HOJE,
    }
    this.revisoes[processo.id] = [revisao, ...(this.revisoes[processo.id] ?? [])]
  }
}
