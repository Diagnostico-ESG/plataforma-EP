export type Setor = { id: string; sigla: string; nome: string; observacoes: string | null; ativo: boolean }
export type DadosDoSetor = { nome: string; sigla: string; observacoes: string | null }

export type CategoriaDoMacroprocesso = 'finalistico' | 'apoio' | 'gerencial'
export type Macroprocesso = {
  id: string
  codigo: string | null
  nome: string
  descricao: string | null
  categoria: CategoriaDoMacroprocesso | null
  ativo: boolean
}
export type DadosDoMacroprocesso = Pick<Macroprocesso, 'codigo' | 'nome' | 'descricao' | 'categoria'>

/** Um macroprocesso visto do setor aberto, com a observação do papel do setor nele. */
export type MacroprocessoDoSetor = { id: string; codigo: string | null; nome: string; observacao: string | null }
export type SetorDaLista = Setor & { quantidadeDeMacroprocessos: number }
export type SetorComMacroprocessos = Setor & { macroprocessos: MacroprocessoDoSetor[] }

/** Um setor visto do macroprocesso aberto, com a observação do papel dele ali. */
export type SetorEnvolvido = { setorId: string; sigla: string; nome: string; ativo: boolean; observacao: string | null }
export type MacroprocessoDaLista = Macroprocesso & { quantidadeDeSetores: number }
export type MacroprocessoComSetores = Macroprocesso & { setoresEnvolvidos: SetorEnvolvido[] }

/** Antes ou depois de uma mudança, como o gatilho gravou em eventos.detalhes (as exclusões trazem também listas). */
export type EstadoDoCadastro = Record<string, unknown> | null
/** Um evento de setor, macroprocesso ou setor envolvido; a referência do vínculo é 'macroprocessoId:setorId'. */
export type EventoDoCadastro = {
  id: number
  ocorridoEm: string
  autor: string | null
  acao: string
  entidade: string
  entidadeRef: string
  antes: EstadoDoCadastro
  depois: EstadoDoCadastro
}
export type ItemDoFiltro = { id: string; nome: string }

/**
 * Único ponto por onde a interface fala com o banco nos cadastros (setores, macroprocessos e setores envolvidos;
 * o histórico chega no ticket seguinte). Recusa do banco chega como TravaDoBanco, com a frase pronta;
 * outra falha de gravação, como Error cuja mensagem é o motivo em português;
 * gravação em item que não existe mais, como CadastroInexistente.
 */
export type ModuloDeCadastros = {
  /** Ordem da sigla; cada setor traz em quantos macroprocessos participa. */
  listarSetores(): Promise<SetorDaLista[]>
  criarSetor(dados: DadosDoSetor): Promise<void>
  /** null: o setor não existe (mais). Traz os macroprocessos de que participa, na ordem da lista. */
  lerSetor(id: string): Promise<SetorComMacroprocessos | null>
  editarSetor(id: string, dados: DadosDoSetor): Promise<void>
  desativarSetor(id: string): Promise<void>
  reativarSetor(id: string): Promise<void>
  excluirSetor(id: string): Promise<void>
  /** Ordem do código, com os sem código depois, e do nome. */
  listarMacroprocessos(): Promise<MacroprocessoDaLista[]>
  criarMacroprocesso(dados: DadosDoMacroprocesso): Promise<void>
  /** null: o macroprocesso não existe (mais). Traz os setores envolvidos, na ordem da sigla. */
  lerMacroprocesso(id: string): Promise<MacroprocessoComSetores | null>
  editarMacroprocesso(id: string, dados: DadosDoMacroprocesso): Promise<void>
  desativarMacroprocesso(id: string): Promise<void>
  reativarMacroprocesso(id: string): Promise<void>
  excluirMacroprocesso(id: string): Promise<void>
  /** Recusa do mesmo setor duas vezes chega como TravaDoBanco ("O setor {SIGLA} já está neste macroprocesso."). */
  porSetorNoMacroprocesso(macroprocessoId: string, setorId: string): Promise<void>
  /** Tirar um vínculo que já não existe não é erro. */
  tirarSetorDoMacroprocesso(macroprocessoId: string, setorId: string): Promise<void>
  mudarObservacaoDoSetorEnvolvido(macroprocessoId: string, setorId: string, observacao: string | null): Promise<void>
}
