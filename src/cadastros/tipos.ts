export type Setor = { id: string; sigla: string; nome: string; observacoes: string | null; ativo: boolean }
export type DadosDoSetor = { nome: string; sigla: string; observacoes: string | null }

/**
 * Único ponto por onde a interface fala com o banco nos cadastros (setores; macroprocessos, setores envolvidos e
 * histórico chegam nos tickets seguintes). Recusa do banco chega como TravaDoBanco, com a frase pronta;
 * outra falha de gravação, como Error cuja mensagem é o motivo em português;
 * gravação em setor que não existe mais, como CadastroInexistente.
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
}
