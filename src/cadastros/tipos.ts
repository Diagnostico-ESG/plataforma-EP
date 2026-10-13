export type Setor = { id: string; sigla: string; nome: string; observacoes: string | null; ativo: boolean }
export type DadosDoSetor = { nome: string; sigla: string; observacoes: string | null }

/**
 * Único ponto por onde a interface fala com o banco nos cadastros (setores; macroprocessos, setores envolvidos e
 * histórico chegam nos tickets seguintes). Recusa do banco chega como TravaDoBanco, com a frase pronta;
 * outra falha de gravação, como Error cuja mensagem é o motivo em português.
 */
export type ModuloDeCadastros = {
  listarSetores(): Promise<Setor[]>
  criarSetor(dados: DadosDoSetor): Promise<void>
}
