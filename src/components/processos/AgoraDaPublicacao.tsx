import { useState } from 'react'
import { acaoDaPublicacao, textoDaPublicacaoNoAgora } from '../../processos/publicacao'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { JanelaDaPublicacao } from './JanelaDaPublicacao'

type PublicacaoProps = { processo: ProcessoLido; processos: ModuloDeProcessos; aoMudar: () => void }

// O link vem de fora: só http ou https vira link (o banco já garante, a tela não confia).
const ehLinkSeguro = (link: string) => /^https?:\/\//i.test(link)

/** A linha da publicação no Agora, com o link (numa aba nova) quando há. */
export function LinhaDaPublicacao({ texto, link }: { texto: string; link: string | null | undefined }) {
  return (
    <p className="agora-publicacao">
      <span>{texto}</span>
      {link && ehLinkSeguro(link) && <> · <a href={link} target="_blank" rel="noopener noreferrer">Abrir o link</a></>}
    </p>
  )
}

/** [Registrar publicação] ou [Corrigir publicação], com a janela; nada quando o processo não pode (ver acaoDaPublicacao). */
export function BotaoDaPublicacao({ processo, processos, aoMudar }: PublicacaoProps) {
  const [aberta, setAberta] = useState(false)
  const acao = acaoDaPublicacao(processo)
  if (acao === null) return null
  return (
    <>
      <button type="button" className="botao botao-secundario" onClick={() => setAberta(true)}>
        {acao === 'corrigir' ? 'Corrigir publicação' : 'Registrar publicação'}
      </button>
      {aberta && <JanelaDaPublicacao processo={processo} processos={processos} aoGravar={aoMudar} aoFechar={() => setAberta(false)} />}
    </>
  )
}

/** Na etapa Publicação: a data, se já registrada, e o botão de registrar ou corrigir. */
export function PublicacaoNoAgora(props: PublicacaoProps) {
  const texto = textoDaPublicacaoNoAgora(props.processo)
  return (
    <>
      {texto && <LinhaDaPublicacao texto={texto} link={props.processo.linkDaPublicacao} />}
      <div className="agora-botoes"><BotaoDaPublicacao {...props} /></div>
    </>
  )
}
