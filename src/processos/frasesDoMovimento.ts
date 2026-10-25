// As frases das recusas de mover, da etiqueta e da chegada a Concluídos (migrações do Andamento livre), as mesmas no módulo
// real e no falso.

export function fraseDaEtapaInativa(nome: string): string {
  return `A etapa ${nome} está inativa.`
}

/** O banco pede a data da publicação (com o link) ou a explicação ao chegar a Concluídos sem a data já registrada. */
export const FRASE_DA_CHEGADA_OBRIGATORIA = 'Para ir a Concluídos, informe a data da publicação ou conclua sem publicação.'

export const FRASE_DA_EXPLICACAO_OBRIGATORIA = 'A explicação é obrigatória para concluir sem publicação.'

export function fraseDaExplicacaoLonga(tamanho: number | string): string {
  return `A explicação tem ${tamanho} caracteres; o máximo é 2.000.`
}

export const FRASE_DA_ETIQUETA_FIXA = 'Em Concluídos a etiqueta é sempre Concluído e não muda.'

export function fraseDaEtiquetaInexistente(valor: string): string {
  return `A etiqueta ${valor} não existe; use A fazer, Em andamento ou Concluído.`
}

/** A passagem que já saiu não muda, nem pela API. */
export const FRASE_DA_PASSAGEM_FECHADA = 'Só a etapa atual do processo tem etiqueta para mudar.'

export const FRASE_DA_PASSAGEM_SO_PELA_FUNCAO = 'O processo só muda de etapa pela lista Etapa ou arrastando o cartão.'
