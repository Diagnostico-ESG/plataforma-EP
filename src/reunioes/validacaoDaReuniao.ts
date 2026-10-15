import type { ModeloDaReuniao } from './enderecoDasReunioes'
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
  usuariosIds: string[]
  responsaveisIds: string[]
  /** Um nome por linha, como a pessoa escreve na área de texto. */
  outrosParticipantes: string
}

export const CAMPOS_DA_REUNIAO_EM_BRANCO: CamposDaReuniao = {
  tipo: '', setorId: '', processosIds: [], data: '', hora: '', local: '', anotacoes: '',
  usuariosIds: [], responsaveisIds: [], outrosParticipantes: '',
}

/** Os campos da edição, a partir da reunião que já existe. */
export function camposDaReuniao(reuniao: Reuniao): CamposDaReuniao {
  return {
    tipo: reuniao.tipo, setorId: reuniao.setorId, processosIds: reuniao.processos.map((processo) => processo.id),
    data: reuniao.data, hora: reuniao.hora ?? '', local: reuniao.local ?? '', anotacoes: reuniao.anotacoes ?? '',
    usuariosIds: reuniao.usuarios.map((usuario) => usuario.id),
    responsaveisIds: reuniao.responsaveis.map((responsavel) => responsavel.id),
    outrosParticipantes: reuniao.outrosParticipantes.join('\n'),
  }
}

/** Salvar fica desabilitado enquanto falta tipo, setor, data ou, na modelagem, ao menos um processo. */
export function faltaPreencher(campos: CamposDaReuniao): boolean {
  if (!campos.tipo || !campos.setorId || !campos.data) return true
  return campos.tipo === 'modelagem' && campos.processosIds.length === 0
}

/**
 * Trocar o setor desmarca os processos e os responsáveis, que são dele; passar para sensibilização desmarca só os
 * processos. Os usuários do EP não pertencem a setor e seguem marcados.
 */
export function comMudanca(atuais: CamposDaReuniao, mudanca: Partial<CamposDaReuniao>): CamposDaReuniao {
  const novos = { ...atuais, ...mudanca }
  const trocouSetor = novos.setorId !== atuais.setorId
  const virouSensibilizacao = novos.tipo === 'sensibilizacao'
  const semProcessos = trocouSetor || virouSensibilizacao ? { ...novos, processosIds: [] } : novos
  return trocouSetor ? { ...semProcessos, responsaveisIds: [] } : semProcessos
}

function textoOuNulo(texto: string): string | null {
  return texto.trim() || null
}

/** Um nome por linha: aparado, sem as linhas vazias. */
function linhasDoTexto(texto: string): string[] {
  return texto.split('\n').map((linha) => linha.trim()).filter((linha) => linha !== '')
}

/** Os dados para gravar; só vale com faltaPreencher falso. */
export function dadosDaReuniao(campos: CamposDaReuniao): DadosDaReuniao {
  return {
    tipo: campos.tipo as TipoDeReuniao, setorId: campos.setorId, data: campos.data, hora: textoOuNulo(campos.hora),
    local: textoOuNulo(campos.local), anotacoes: textoOuNulo(campos.anotacoes), processosIds: campos.processosIds,
    usuariosIds: campos.usuariosIds, responsaveisIds: campos.responsaveisIds,
    outrosParticipantes: linhasDoTexto(campos.outrosParticipantes),
  }
}

/**
 * Os campos do registro "preenchido" (vindo do setor ou do processo). O setor do modelo só vale se estiver entre os
 * ativos: o banco recusa reunião nova em setor inativo, e o formulário não deve partir de um setor que não oferece.
 */
export function camposDoModelo(modelo: ModeloDaReuniao | null, setoresAtivosIds: string[]): CamposDaReuniao {
  if (!modelo || !setoresAtivosIds.includes(modelo.setorId)) return CAMPOS_DA_REUNIAO_EM_BRANCO
  const processosIds = modelo.tipo === 'modelagem' && modelo.processoId ? [modelo.processoId] : []
  return { ...CAMPOS_DA_REUNIAO_EM_BRANCO, tipo: modelo.tipo ?? '', setorId: modelo.setorId, processosIds }
}
