import { useEffect, useState } from 'react'
import { Icone, type NomeIcone } from '../Icone'

const DURACAO_DO_AVISO = 3000

type BotaoEmBreveProps = { rotulo: string; icone: NomeIcone }

/** Botão de algo que ainda não existe (busca, notificações): o clique só mostra "Em breve" por alguns segundos. */
export function BotaoEmBreve({ rotulo, icone }: BotaoEmBreveProps) {
  const [avisando, setAvisando] = useState(false)
  useEffect(() => {
    if (!avisando) return
    const prazo = setTimeout(() => setAvisando(false), DURACAO_DO_AVISO)
    return () => clearTimeout(prazo)
  }, [avisando])
  return (
    <span className="botao-em-breve">
      <button type="button" className="botao-icone" aria-label={rotulo} title={rotulo} onClick={() => setAvisando(true)}>
        <Icone nome={icone} />
      </button>
      {avisando && <span className="botao-em-breve-aviso" role="status">Em breve</span>}
    </span>
  )
}
