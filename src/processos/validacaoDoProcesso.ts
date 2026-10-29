import { textoParaGravar } from './anotacoes'
import type { DadosDoProcesso, TipoDeProcesso } from './tipos'

/** O que a pessoa digitou ou escolheu no formulário, ainda sem normalizar. */
export type CamposDoProcesso = {
  nome: string
  setorId: string
  macroprocessoId: string
  tipo: TipoDeProcesso
  /** Só vale no subprocesso; vazio enquanto não foi escolhido. */
  processoPaiId: string
  /** Só no cadastro. */
  anotacoes: string
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

// Mesma normalização do banco (private.preparar_processo): sem espaços nas pontas no nome; Anotações vazias como nulas.
export function dadosDoProcesso(campos: CamposDoProcesso): DadosDoProcesso {
  return {
    nome: campos.nome.trim(), setorId: campos.setorId, macroprocessoId: campos.macroprocessoId, tipo: campos.tipo,
    processoPaiId: campos.tipo === 'subprocesso' ? campos.processoPaiId : null,
    anotacoes: textoParaGravar(campos.anotacoes),
  }
}
