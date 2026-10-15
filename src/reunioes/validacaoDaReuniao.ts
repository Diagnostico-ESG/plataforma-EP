import type { DadosDaReuniao, Reuniao, TipoDeReuniao } from './tipos'

/** Os campos do formulário como a pessoa os preenche (tudo texto, para os campos nativos). */
export type CamposDaReuniao = {
  tipo: TipoDeReuniao | ''
  setorId: string
  processosIds: string[]
  data: string
  hora: string
  local: string
  anotacoes: string
  /** Guardados para a edição devolvê-los sem mexer; a tela só os mostra no ticket de participantes. */
  outrosParticipantes: string[]
}

export const CAMPOS_DA_REUNIAO_EM_BRANCO: CamposDaReuniao = {
  tipo: '', setorId: '', processosIds: [], data: '', hora: '', local: '', anotacoes: '',
  outrosParticipantes: [],
}

/** Os campos da edição, a partir da reunião que já existe. */
export function camposDaReuniao(reuniao: Reuniao): CamposDaReuniao {
  return {
    tipo: reuniao.tipo, setorId: reuniao.setorId, processosIds: reuniao.processos.map((processo) => processo.id),
    data: reuniao.data, hora: reuniao.hora ?? '', local: reuniao.local ?? '', anotacoes: reuniao.anotacoes ?? '',
    outrosParticipantes: reuniao.outrosParticipantes,
  }
}

/** Salvar fica desabilitado enquanto falta tipo, setor, data ou, na modelagem, ao menos um processo. */
export function faltaPreencher(campos: CamposDaReuniao): boolean {
  if (!campos.tipo || !campos.setorId || !campos.data) return true
  return campos.tipo === 'modelagem' && campos.processosIds.length === 0
}

/** Trocar o setor ou passar para sensibilização desmarca os processos, que já não cabem. */
export function comMudanca(atuais: CamposDaReuniao, mudanca: Partial<CamposDaReuniao>): CamposDaReuniao {
  const novos = { ...atuais, ...mudanca }
  const trocouSetor = novos.setorId !== atuais.setorId
  const virouSensibilizacao = novos.tipo === 'sensibilizacao'
  return trocouSetor || virouSensibilizacao ? { ...novos, processosIds: [] } : novos
}

function textoOuNulo(texto: string): string | null {
  return texto.trim() || null
}

/** Os dados para gravar; só vale com faltaPreencher falso. */
export function dadosDaReuniao(campos: CamposDaReuniao): DadosDaReuniao {
  return {
    tipo: campos.tipo as TipoDeReuniao, setorId: campos.setorId, data: campos.data, hora: textoOuNulo(campos.hora),
    local: textoOuNulo(campos.local), anotacoes: textoOuNulo(campos.anotacoes), processosIds: campos.processosIds,
    outrosParticipantes: campos.outrosParticipantes,
  }
}
