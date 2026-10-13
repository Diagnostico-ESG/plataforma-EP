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

/**
 * Único ponto por onde a interface fala com o banco nos cadastros (setores e macroprocessos; setores envolvidos e
 * histórico chegam nos tickets seguintes). Recusa do banco chega como TravaDoBanco, com a frase pronta;
 * outra falha de gravação, como Error cuja mensagem é o motivo em português;
 * gravação em item que não existe mais, como CadastroInexistente.
 */
export type ModuloDeCadastros = {
  listarSetores(): Promise<Setor[]>
  criarSetor(dados: DadosDoSetor): Promise<void>
  /** null: o setor não existe (mais). */
  lerSetor(id: string): Promise<Setor | null>
  editarSetor(id: string, dados: DadosDoSetor): Promise<void>
  desativarSetor(id: string): Promise<void>
  reativarSetor(id: string): Promise<void>
  excluirSetor(id: string): Promise<void>
  /** Ordem do código, com os sem código depois, e do nome. */
  listarMacroprocessos(): Promise<Macroprocesso[]>
  criarMacroprocesso(dados: DadosDoMacroprocesso): Promise<void>
  /** null: o macroprocesso não existe (mais). */
  lerMacroprocesso(id: string): Promise<Macroprocesso | null>
  editarMacroprocesso(id: string, dados: DadosDoMacroprocesso): Promise<void>
  desativarMacroprocesso(id: string): Promise<void>
  reativarMacroprocesso(id: string): Promise<void>
  excluirMacroprocesso(id: string): Promise<void>
}
