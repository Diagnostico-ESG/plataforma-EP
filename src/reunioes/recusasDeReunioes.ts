import { type ErroDoBanco, TravaDoBanco, recusaPorPerfil } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'

export const SEM_PERMISSAO_DAS_REUNIOES = 'Seu perfil não permite alterar as reuniões.'

export const FRASE_DA_MODELAGEM_SEM_PROCESSO = 'A reunião de modelagem precisa de ao menos um processo.'
export const FRASE_DA_SENSIBILIZACAO_COM_PROCESSO = 'A reunião de sensibilização não tem processos.'
export const fraseDoSetorInativo = (sigla: string) => `O setor ${sigla} está inativo; escolha um setor ativo.`
export const fraseDoProcessoDeOutroSetor = (nome: string) => `O processo ${nome} não é do setor da reunião.`
const fraseDoTextoLongo = (campo: string, verbo: string, limite: string, recebido: number) =>
  `${campo} ${verbo} ter no máximo ${limite} caracteres. Recebido: ${recebido}.`

// O banco recusa com "motivo:valor" (migração reunioes); o PostgREST pode acrescentar texto em volta.
const PADRAO_COM_VALOR = /\b(setor_inativo|processo_de_outro_setor):(.*)$/m
const PADRAO_SEM_VALOR = /\b(modelagem_sem_processo|sensibilizacao_com_processo)\b/

const FRASE_COM_VALOR: Record<string, (valor: string) => string> = {
  setor_inativo: fraseDoSetorInativo, processo_de_outro_setor: fraseDoProcessoDeOutroSetor,
}
const FRASE_SEM_VALOR: Record<string, string> = {
  modelagem_sem_processo: FRASE_DA_MODELAGEM_SEM_PROCESSO, sensibilizacao_com_processo: FRASE_DA_SENSIBILIZACAO_COM_PROCESSO,
}

type TextosDaReuniao = { local: string | null; anotacoes: string | null }

// 23514 é a restrição de tamanho: a frase usa o tamanho do que foi enviado.
function fraseDoTextoLongoRecusado(erro: ErroDoBanco, textos: TextosDaReuniao): string | null {
  if (erro.code !== '23514') return null
  if (erro.message.includes('reunioes_local_tamanho')) return fraseDoTextoLongo('O local', 'pode', '300', textos.local?.length ?? 0)
  if (erro.message.includes('reunioes_anotacoes_tamanho')) {
    return fraseDoTextoLongo('As anotações', 'podem', '10.000', textos.anotacoes?.length ?? 0)
  }
  return null
}

/** A recusa do banco ao salvar, com a frase pronta da tela; outra falha vira Error com o motivo. */
export function falhaDaReuniao(erro: ErroDoBanco, textos: TextosDaReuniao): Error {
  const comValor = erro.message.match(PADRAO_COM_VALOR)
  if (comValor) return new TravaDoBanco(FRASE_COM_VALOR[comValor[1]](comValor[2].trim()))
  const semValor = erro.message.match(PADRAO_SEM_VALOR)
  if (semValor) return new TravaDoBanco(FRASE_SEM_VALOR[semValor[1]])
  const longo = fraseDoTextoLongoRecusado(erro, textos)
  if (longo) return new TravaDoBanco(longo)
  // O setor ou o processo escolhido foi excluído por outra pessoa enquanto o formulário estava aberto.
  if (erro.code === '23503' || erro.message.includes('registro_inexistente')) return new CadastroInexistente()
  return recusaPorPerfil(erro, SEM_PERMISSAO_DAS_REUNIOES)
}
