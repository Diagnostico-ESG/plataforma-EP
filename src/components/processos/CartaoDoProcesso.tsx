import type { DragEvent } from 'react'
import { ROTULO_DO_TIPO } from '../../processos/rotulos'
import { hojeLocal } from '../../processos/textoDaReuniao'
import type { ProcessoDaLista } from '../../processos/tipos'
import { Avatar } from '../Avatar'
import { Pilula } from '../Pilula'
import { BarraDeProgresso } from './BarraDeProgresso'
import { SelosDoCartao } from './SelosDoCartao'

type CartaoDoProcessoProps = {
  processo: ProcessoDaLista
  escolhido: boolean
  href: string
  /** Só Administrador e Integrante, com a etapa em andamento e etapa pendente depois (spec, "Arrastar para concluir"). */
  arrastavel: boolean
  /** O cartão arrastado fica levemente apagado no lugar de origem. */
  apagado: boolean
  /** O Quadro por responsável: a coluna já diz quem é, então o cartão diz a etapa e dispensa o selo Sem responsável. */
  agrupadoPorResponsavel: boolean
  aoLevantar: () => void
  aoBaixar: () => void
}

/** O cartão do Quadro é um link: focável, e Enter abre o painel do processo. Arrastar usa o recurso nativo do navegador. */
export function CartaoDoProcesso({ processo, escolhido, href, arrastavel, apagado, agrupadoPorResponsavel, aoLevantar, aoBaixar }: CartaoDoProcessoProps) {
  const { id, nome, tipo, setorSigla, macroprocessoNome, situacao } = processo
  function comecarAArrastar(evento: DragEvent<HTMLAnchorElement>) {
    // O Firefox só inicia o arrastar se houver algum dado na transferência.
    evento.dataTransfer.setData('text/plain', id)
    evento.dataTransfer.effectAllowed = 'move'
    aoLevantar()
  }
  return (
    // O <a> se arrasta por padrão (leva o endereço): fora dos casos permitidos, draggable="false" a impede.
    <a id={`cartao-${id}`} className={apagado ? 'cartao cartao-apagado' : 'cartao'} href={href} aria-current={escolhido ? 'true' : undefined}
      draggable={arrastavel} onDragStart={arrastavel ? comecarAArrastar : undefined} onDragEnd={arrastavel ? aoBaixar : undefined}>
      <span className="cartao-topo">
        <span className="cartao-sigla">{setorSigla}</span>
        <span className="cartao-macroprocesso">{macroprocessoNome}</span>
      </span>
      <span className="cartao-nome">{nome}</span>
      <BarraDeProgresso processo={processo} />
      <SelosDoCartao processo={processo} hoje={hojeLocal()} semSeloDeResponsavel={agrupadoPorResponsavel} />
      <span className="cartao-rodape">
        <span className="cartao-pilulas">
          {tipo !== 'processo' && <Pilula situacao="neutra">{ROTULO_DO_TIPO[tipo]}</Pilula>}
          {situacao === 'suspenso' && <Pilula situacao="vencendo">Suspenso</Pilula>}
        </span>
        <QuemOuOndeNoRodape processo={processo} agrupadoPorResponsavel={agrupadoPorResponsavel} />
      </span>
    </a>
  )
}

/** No rodapé: o avatar de quem cuida; no Quadro por responsável, a etapa atual no lugar dele. */
function QuemOuOndeNoRodape({ processo, agrupadoPorResponsavel }: { processo: ProcessoDaLista; agrupadoPorResponsavel: boolean }) {
  const { responsavel, etapaAtual } = processo
  if (agrupadoPorResponsavel) return <span className="cartao-etapa">{etapaAtual?.nome}</span>
  return responsavel && <Avatar nome={responsavel.nome} fotoUrl={responsavel.fotoUrl ?? undefined} tamanho={20} />
}
