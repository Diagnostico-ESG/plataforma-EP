import type { DadosDoProcesso, OrigemDoProcesso } from './tipos'

/** O que a pessoa digitou ou escolheu no formulário, ainda sem normalizar. */
export type CamposDoProcesso = {
  nome: string
  setorId: string
  macroprocessoId: string
  tipo: DadosDoProcesso['tipo']
  origem: OrigemDoProcesso
  contexto: string
  observacoes: string
}

// O banco confere de novo (migração processos); aqui a pessoa vê o problema antes de enviar.
export function problemaNoProcesso({ nome, setorId, macroprocessoId }: CamposDoProcesso): string | null {
  if (nome.trim() === '') return 'O nome do processo é obrigatório.'
  if (setorId === '') return 'Escolha o setor do processo.'
  if (macroprocessoId === '') return 'Escolha o macroprocesso do processo.'
  return null
}

// Mesma normalização do banco (private.preparar_processo): sem espaços nas pontas, textos vazios como nulos.
export function dadosDoProcesso(campos: CamposDoProcesso): DadosDoProcesso {
  return {
    nome: campos.nome.trim(), setorId: campos.setorId, macroprocessoId: campos.macroprocessoId, tipo: campos.tipo,
    processoPaiId: null, origem: campos.origem, contexto: campos.contexto.trim() || null, observacoes: campos.observacoes.trim() || null,
  }
}
