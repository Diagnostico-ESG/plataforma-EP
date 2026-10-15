import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import {
  FRASE_DA_MODELAGEM_SEM_PROCESSO, FRASE_DA_SENSIBILIZACAO_COM_PROCESSO, fraseDoProcessoDeOutroSetor, fraseDoSetorInativo,
} from './recusasDeReunioes'
import type { DadosDaReuniao, ModuloDeReunioes, ProcessoDaReuniao, Reuniao, SetorParaReuniao } from './tipos'

export type SetorDoFalso = SetorParaReuniao & { ativo: boolean }
export type GravacaoDeReuniao = { id: string | null; dados: DadosDaReuniao }

/** Implementação falsa de reuniões para os testes de tela: sem rede, com falhas, esperas e as recusas do banco. */
export class ReunioesFalso implements ModuloDeReunioes {
  /** As reuniões gravadas; a lista e a leitura partem daqui. */
  reunioes: Reuniao[] = []
  /** Os setores do cadastro, ativos ou não (a escolha do formulário só mostra os ativos). */
  setores: SetorDoFalso[] = []
  /** Os processos de cada setor (pelo id do setor), por nome. */
  processosDosSetores: Record<string, ProcessoDaReuniao[]> = {}
  falharLeitura = false
  segurarLeitura = false
  falharLeituraDaReuniao = false
  segurarLeituraDaReuniao = false
  /** A leitura dos setores e dos processos do formulário. */
  falharOpcoes = false
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaDeGravacao: string | Error | null = null
  /** As gravações que o banco aceitou, na ordem. */
  gravacoes: GravacaoDeReuniao[] = []
  private proximoId = 1

  async listarReunioes(): Promise<Reuniao[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return [...this.reunioes]
  }

  async lerReuniao(id: string): Promise<Reuniao | null> {
    if (this.segurarLeituraDaReuniao) return new Promise<never>(() => {})
    if (this.falharLeituraDaReuniao) throw new Error('falha de conexão simulada')
    return this.reunioes.find((reuniao) => reuniao.id === id) ?? null
  }

  async listarSetoresAtivos(): Promise<SetorParaReuniao[]> {
    this.conferirOpcoes()
    return this.setores.filter((setor) => setor.ativo).map(({ id, sigla, nome }) => ({ id, sigla, nome }))
  }

  async listarProcessosDoSetor(setorId: string): Promise<ProcessoDaReuniao[]> {
    this.conferirOpcoes()
    return [...(this.processosDosSetores[setorId] ?? [])]
  }

  async salvarReuniao(id: string | null, dados: DadosDaReuniao): Promise<void> {
    if (typeof this.falhaDeGravacao === 'string') throw new Error(this.falhaDeGravacao)
    if (this.falhaDeGravacao) throw this.falhaDeGravacao
    const anterior = this.reunioes.find((reuniao) => reuniao.id === id)
    const setor = this.setores.find((candidato) => candidato.id === dados.setorId)
    this.conferirRegras(dados, setor, anterior)
    const reuniao = this.montar(id ?? `r${this.proximoId++}`, dados, setor)
    this.reunioes = anterior ? this.reunioes.map((r) => (r.id === reuniao.id ? reuniao : r)) : [...this.reunioes, reuniao]
    this.gravacoes.push({ id, dados })
  }

  private conferirOpcoes(): void {
    if (this.falharOpcoes) throw new Error('falha de conexão simulada')
  }

  // As recusas do banco: setor inativo só para reunião nova ou setor trocado; tipo e processos; processo de outro setor.
  private conferirRegras(dados: DadosDaReuniao, setor: SetorDoFalso | undefined, anterior: Reuniao | undefined): void {
    const trocouDeSetor = !anterior || anterior.setorId !== dados.setorId
    if (setor && !setor.ativo && trocouDeSetor) throw new TravaDoBanco(fraseDoSetorInativo(setor.sigla))
    conferirTipoEProcessos(dados)
    const doSetor = this.processosDosSetores[dados.setorId] ?? []
    const fora = dados.processosIds.find((processoId) => !doSetor.some((processo) => processo.id === processoId))
    if (fora) throw new TravaDoBanco(fraseDoProcessoDeOutroSetor(this.nomeDoProcesso(fora)))
  }

  private nomeDoProcesso(id: string): string {
    const todos = Object.values(this.processosDosSetores).flat()
    return todos.find((processo) => processo.id === id)?.nome ?? id
  }

  private montar(id: string, dados: DadosDaReuniao, setor: SetorDoFalso | undefined): Reuniao {
    const doSetor = this.processosDosSetores[dados.setorId] ?? []
    return {
      id, tipo: dados.tipo, setorId: dados.setorId, setorSigla: setor?.sigla ?? dados.setorId, setorAtivo: setor?.ativo ?? true,
      data: dados.data, hora: dados.hora, local: dados.local, anotacoes: dados.anotacoes,
      processos: doSetor.filter((processo) => dados.processosIds.includes(processo.id)),
    }
  }
}

function conferirTipoEProcessos({ tipo, processosIds }: DadosDaReuniao): void {
  if (tipo === 'modelagem' && !processosIds.length) throw new TravaDoBanco(FRASE_DA_MODELAGEM_SEM_PROCESSO)
  if (tipo === 'sensibilizacao' && processosIds.length) throw new TravaDoBanco(FRASE_DA_SENSIBILIZACAO_COM_PROCESSO)
}
