import { useState } from 'react'

/**
 * "Vai para publicação?" na janela que resolve a Aprovação (ADR 0020): nada marcado ao abrir, e a janela só confirma com
 * resposta. "Sim" mostra a escolha do responsável da Publicação; "Não" a esconde e o avanço não leva ninguém. Sem a
 * pergunta (`perguntar` falso), a janela segue como antes e a escolha vai nula.
 */
export function useEscolhaDaPublicacao(perguntar: boolean) {
  const [resposta, setResposta] = useState<boolean | null>(null)
  return {
    resposta, responder: setResposta,
    respondida: !perguntar || resposta !== null,
    /** A escolha do responsável aparece sem a pergunta ou depois do "Sim". */
    comResponsavel: !perguntar || resposta === true,
    /** O que vai ao banco: a resposta, ou null sem a pergunta. */
    escolha: perguntar ? resposta : null,
  }
}
