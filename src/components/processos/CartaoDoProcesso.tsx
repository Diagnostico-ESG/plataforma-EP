import type { DragEvent } from 'react'
import { diasDoProcessoParado } from '../../processos/diasNaEtapa'
import type { AgruparQuadroPor } from '../../processos/enderecoDosProcessos'
import { ROTULO_DO_TIPO } from '../../processos/rotulos'
import { hojeEmBrasilia } from '../../lib/datas'
import type { EtapaDoCatalogo, ProcessoDaLista } from '../../processos/tipos'
import { Avatar } from '../Avatar'
import { Pilula } from '../Pilula'
import { BarraDeProgresso } from './BarraDeProgresso'
import { EtiquetaDoProcesso } from './EtiquetaDoProcesso'
import { SelosDoCartao } from './SelosDoCartao'

type CartaoDoProcessoProps = {
  processo: ProcessoDaLista
  escolhido: boolean
  href: string
  /** Só Administrador e Integrante, só agrupado por etapa e só o processo em andamento ou concluído não arquivado. */
  arrastavel: boolean
  /** O cartão arrastado fica levemente apagado no lugar de origem. */
  apagado: boolean
  /**
   * O cartão não repete o que a coluna já diz: fora do Quadro por etapa traz a barra da etapa; por responsável dispensa o
   * avatar e o selo Sem responsável; por setor dispensa a sigla.
   */
  agrupar: AgruparQuadroPor
  /** As etapas do catálogo: o selo de relatório pendente compara a posição da etapa atual com a da Revisão interna. */
  etapas: EtapaDoCatalogo[]
  aoLevantar: () => void
  aoBaixar: () => void
}

/** O cartão do Quadro é um link: focável, e Enter abre o painel do processo. Arrastar usa o recurso nativo do navegador. */
export function CartaoDoProcesso({ processo, escolhido, href, arrastavel, apagado, agrupar, etapas, aoLevantar, aoBaixar }: CartaoDoProcessoProps) {
  const { id, nome, tipo, setorSigla, situacao } = processo
  const porResponsavel = agrupar === 'responsavel'
  function comecarAArrastar(evento: DragEvent<HTMLAnchorElement>) {
    // O Firefox só inicia o arrastar se houver algum dado na transferência.
    evento.dataTransfer.setData('text/plain', id)
    evento.dataTransfer.effectAllowed = 'move'
    aoLevantar()
  }
  return (
    // O <a> se arrasta por padrão (leva o endereço): fora dos casos permitidos, draggable="false" a impede.
    <a id={`cartao-${id}`} className={classesDoCartao(processo, apagado)} href={href} aria-current={escolhido ? 'true' : undefined}
      draggable={arrastavel} onDragStart={arrastavel ? comecarAArrastar : undefined} onDragEnd={arrastavel ? aoBaixar : undefined}>
      {agrupar !== 'setor' && (
        <span className="cartao-topo">
          <span className="cartao-sigla">{setorSigla}</span>
        </span>
      )}
      <span className="cartao-nome">{nome}</span>
      {agrupar !== 'etapa' && <BarraDeProgresso processo={processo} />}
      <SelosDoCartao processo={processo} hoje={hojeEmBrasilia()} etapas={etapas} semSeloDeResponsavel={porResponsavel} />
      <span className="cartao-rodape">
        <span className="cartao-pilulas">
          {tipo !== 'processo' && <Pilula situacao="neutra">{ROTULO_DO_TIPO[tipo]}</Pilula>}
          {situacao === 'suspenso' && <Pilula situacao="vencendo">Suspenso</Pilula>}
          <EtiquetaDoProcesso etiqueta={processo.etiqueta} />
        </span>
        {!porResponsavel && <QuemCuida responsavel={processo.responsavel} />}
      </span>
    </a>
  )
}


/** Processo parado ganha a faixa vermelha na borda; o cartão arrastado fica apagado. */
function classesDoCartao(processo: ProcessoDaLista, apagado: boolean): string {
  const parado = diasDoProcessoParado(processo, hojeEmBrasilia()) !== null
  return ['cartao', apagado && 'cartao-apagado', parado && 'cartao-parado'].filter(Boolean).join(' ')
}

/** No rodapé: o avatar de quem cuida do processo. */
function QuemCuida({ responsavel }: { responsavel: ProcessoDaLista['responsavel'] }) {
  return responsavel && <Avatar nome={responsavel.nome} fotoUrl={responsavel.fotoUrl ?? undefined} tamanho={20} />
}
