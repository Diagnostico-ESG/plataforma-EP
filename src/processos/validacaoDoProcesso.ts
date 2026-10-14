import type { DadosDoProcesso, OrigemDoProcesso, TipoDeProcesso } from './tipos'

/** O que a pessoa digitou ou escolheu no formulário, ainda sem normalizar. */
export type CamposDoProcesso = {
  nome: string
  setorId: string
  macroprocessoId: string
  tipo: TipoDeProcesso
  /** Só vale no subprocesso; vazio enquanto não foi escolhido. */
  processoPaiId: string
  origem: OrigemDoProcesso
  contexto: string
  observacoes: string
}

// O banco confere de novo (migrações processos e subprocessos_e_reclassificacao); aqui a pessoa vê o problema antes
// de enviar. O macroprocesso do subprocesso vem do pai, por isso o pai é conferido antes dele.
export function problemaNoProcesso({ nome, setorId, macroprocessoId, tipo, processoPaiId }: CamposDoProcesso): string | null {
  if (nome.trim() === '') return 'O nome do processo é obrigatório.'
  if (setorId === '') return 'Escolha o setor do processo.'
  if (tipo === 'subprocesso' && processoPaiId === '') return 'Escolha o processo pai.'
  if (macroprocessoId === '') return 'Escolha o macroprocesso do processo.'
  return null
}

// Mesma normalização do banco (private.preparar_processo): sem espaços nas pontas, textos vazios como nulos.
export function dadosDoProcesso(campos: CamposDoProcesso): DadosDoProcesso {
  return {
    nome: campos.nome.trim(), setorId: campos.setorId, macroprocessoId: campos.macroprocessoId, tipo: campos.tipo,
    processoPaiId: campos.tipo === 'subprocesso' ? campos.processoPaiId : null, origem: campos.origem,
    contexto: campos.contexto.trim() || null, observacoes: campos.observacoes.trim() || null,
  }
}
