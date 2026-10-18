import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { recalcularProcesso } from './andamentoFalso'
import { FRASE_DA_ORDEM_DOS_NIVEIS, fraseDaEtapaUsada, fraseDeCodigoRepetido, fraseDeNomeRepetido } from './frasesDoCatalogo'
import type {
  DadosDaEtapa, EtapaDoCatalogo, EtapaDoProcesso, EtapaDoCaminho, EtapaNoCatalogo, EtapaNova, ModuloDoCatalogo,
  ProcessoLido, SentidoDaOrdem, SituacaoDoProcesso,
} from './tipos'

/** O que o catálogo falso mexe no `ProcessosFalso` (sem importá-lo, para não criar dependência circular). */
export type DonoDoCatalogo = {
  processos: ProcessoLido[]
  etapasDoCatalogo: EtapaDoCatalogo[]
}

// Como a função do banco: a etapa entra nos processos não concluídos e não cancelados (ADR 0004).
const SITUACOES_QUE_RECEBEM = new Set<SituacaoDoProcesso>(['em_andamento', 'suspenso'])

const porOrdem = <T extends { ordem: number }>(a: T, b: T) => a.ordem - b.ordem

function pendente(etapa: EtapaNoCatalogo, id: string): EtapaDoCaminho {
  return {
    id, codigo: etapa.codigo, nome: etapa.nome, ordem: etapa.ordem, obrigatoria: etapa.obrigatoria, status: 'pendente',
    nota: null, iniciadaEm: null, resolvidaEm: null,
  }
}

function pendenteDoProcesso(etapa: EtapaNoCatalogo, id: string): EtapaDoProcesso {
  return { ...pendente(etapa, id), responsavelId: null, responsavelNome: null, responsavelInativo: false }
}

// Como o gatilho de comando do banco: nenhuma etapa do setor depois de uma do processo.
function conferirOrdemDosNiveis(etapas: EtapaNoCatalogo[]): void {
  const ultimaDoSetor = Math.max(0, ...etapas.filter((etapa) => etapa.nivel === 'setor').map((etapa) => etapa.ordem))
  if (etapas.some((etapa) => etapa.nivel === 'processo' && etapa.ordem < ultimaDoSetor)) {
    throw new TravaDoBanco(FRASE_DA_ORDEM_DOS_NIVEIS)
  }
}

/** Implementação falsa do catálogo para os testes: muda as colunas do Quadro e o caminho dos processos do dono. */
export class CatalogoFalso implements ModuloDoCatalogo {
  /** O catálogo inteiro, ativas e inativas. */
  etapas: EtapaNoCatalogo[] = []
  falharLeitura = false
  segurarLeitura = false
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaDeGravacao: string | Error | null = null
  private proximoId = 1
  private readonly dono: DonoDoCatalogo

  constructor(dono: DonoDoCatalogo) {
    this.dono = dono
  }

  async listarCatalogo(): Promise<EtapaNoCatalogo[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return [...this.etapas].sort(porOrdem)
  }

  async acrescentarEtapa(dados: EtapaNova): Promise<void> {
    this.conferirGravacao()
    this.conferirRepetida(dados.nome, dados.codigo)
    const antes = this.etapas.find((etapa) => etapa.id === dados.antesDe)
    const posicao = antes?.ordem ?? Math.max(0, ...this.etapas.map((etapa) => etapa.ordem)) + 1
    const nova: EtapaNoCatalogo = {
      id: `c${this.proximoId++}`, codigo: dados.codigo, nome: dados.nome.trim(), ordem: posicao, nivel: dados.nivel,
      obrigatoria: dados.obrigatoria, ativa: true,
    }
    const abertas = this.etapas.map((etapa) => (etapa.ordem >= posicao ? { ...etapa, ordem: etapa.ordem + 1 } : etapa))
    this.gravar([...abertas, nova])
    this.incluirPendentes(nova)
  }

  async editarEtapa(id: string, dados: DadosDaEtapa): Promise<void> {
    this.conferirGravacao()
    this.acharEtapa(id)
    this.conferirRepetida(dados.nome, null, id)
    this.gravar(this.etapas.map((etapa) => (etapa.id === id ? { ...etapa, ...dados, nome: dados.nome.trim() } : etapa)))
  }

  async moverEtapa(id: string, sentido: SentidoDaOrdem): Promise<void> {
    this.conferirGravacao()
    const movida = this.acharEtapa(id)
    const ordenadas = [...this.etapas].sort(porOrdem)
    const vizinha = ordenadas[ordenadas.indexOf(movida) + (sentido === 'subir' ? -1 : 1)]
    if (!vizinha) return
    const trocar = (etapa: EtapaNoCatalogo) => {
      if (etapa.id === movida.id) return { ...etapa, ordem: vizinha.ordem }
      return etapa.id === vizinha.id ? { ...etapa, ordem: movida.ordem } : etapa
    }
    this.gravar(this.etapas.map(trocar))
  }

  async desativarEtapa(id: string): Promise<void> {
    this.conferirGravacao()
    const etapa = this.acharEtapa(id)
    this.gravar(this.etapas.map((outra) => (outra.id === id ? { ...outra, ativa: false } : outra)))
    this.tirarPendentes(etapa.codigo)
  }

  async reativarEtapa(id: string): Promise<void> {
    this.conferirGravacao()
    const etapa = this.acharEtapa(id)
    this.gravar(this.etapas.map((outra) => (outra.id === id ? { ...outra, ativa: true } : outra)))
    this.incluirPendentes(etapa)
  }

  async excluirEtapa(id: string): Promise<void> {
    this.conferirGravacao()
    const etapa = this.acharEtapa(id)
    if (this.andamentosDe(etapa.codigo).some((andamento) => andamento.status !== 'pendente')) {
      throw new TravaDoBanco(fraseDaEtapaUsada(etapa.nome))
    }
    this.gravar(this.etapas.filter((outra) => outra.id !== id))
    this.tirarPendentes(etapa.codigo)
  }

  private conferirGravacao(): void {
    if (this.falhaDeGravacao === null) return
    throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
  }

  private acharEtapa(id: string): EtapaNoCatalogo {
    const etapa = this.etapas.find((outra) => outra.id === id)
    if (!etapa) throw new CadastroInexistente()
    return etapa
  }

  // Imita os índices únicos do banco: nome sem diferenciar maiúsculas e código.
  private conferirRepetida(nome: string, codigo: string | null, idDaPropria?: string): void {
    const outras = this.etapas.filter((etapa) => etapa.id !== idDaPropria)
    if (outras.some((etapa) => etapa.nome.toLowerCase() === nome.trim().toLowerCase())) throw new TravaDoBanco(fraseDeNomeRepetido(nome))
    if (outras.some((etapa) => etapa.codigo === codigo)) throw new TravaDoBanco(fraseDeCodigoRepetido(codigo ?? ''))
  }

  // Confere a ordem dos níveis antes de gravar, e o Quadro passa a mostrar as etapas do processo na ordem nova.
  private gravar(etapas: EtapaNoCatalogo[]): void {
    conferirOrdemDosNiveis(etapas)
    this.etapas = etapas
    this.dono.etapasDoCatalogo = etapas.filter((etapa) => etapa.nivel === 'processo').sort(porOrdem)
      .map(({ id, codigo, nome, ordem, ativa }) => ({ id, codigo, nome, ordem, ativa }))
  }

  private andamentosDe(codigo: string): EtapaDoCaminho[] {
    const todos = this.dono.processos.flatMap((processo) => processo.etapasDoProcesso)
    return todos.filter((andamento) => andamento.codigo === codigo)
  }

  private incluirPendentes(etapa: EtapaNoCatalogo): void {
    if (etapa.nivel === 'setor') return
    this.dono.processos = this.dono.processos.map((processo) => {
      if (!SITUACOES_QUE_RECEBEM.has(processo.situacao) || processo.etapasDoProcesso.some((outra) => outra.codigo === etapa.codigo)) return processo
      return recalcularProcesso(processo, [...processo.etapasDoProcesso, pendenteDoProcesso(etapa, `a${this.proximoId++}`)].sort(porOrdem))
    })
  }

  private tirarPendentes(codigo: string): void {
    const ficam = (andamento: EtapaDoCaminho) => andamento.codigo !== codigo || andamento.status !== 'pendente'
    this.dono.processos = this.dono.processos.map((processo) => {
      const restantes = processo.etapasDoProcesso.filter(ficam)
      return restantes.length === processo.etapasDoProcesso.length ? processo : recalcularProcesso(processo, restantes)
    })
  }

}
