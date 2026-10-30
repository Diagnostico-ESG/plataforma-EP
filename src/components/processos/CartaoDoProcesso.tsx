import type { DragEvent } from 'react'
import { diasDoProcessoParado } from '../../processos/diasNaEtapa'
import type { AgruparQuadroPor } from '../../processos/enderecoDosProcessos'
import { ROTULO_DO_TIPO } from '../../processos/rotulos'
import { hojeEmBrasilia } from '../../lib/datas'
import type { EtapaDoCatalogo, ProcessoDaLista } from '../../processos/tipos'
import { Icone } from '../Icone'
import { SeloDoSetor } from '../SeloDoSetor'
import { Pilula } from '../Pilula'
import { BarraDeProgresso } from './BarraDeProgresso'
import { EtiquetaDoProcesso } from './EtiquetaDoProcesso'
import { SelosDoCartao } from './SelosDoCartao'

type CartaoDoProcessoProps = {
  processo: ProcessoDaLista
  escolhido: boolean
  href: string
  /** Só Administrador e Integrante, só agrupado por etapa e só o processo em andamento ou concluído. */
  arrastavel: boolean
  /** O cartão arrastado fica levemente apagado no lugar de origem. */
  apagado: boolean
  /**
   * O cartão não repete o que a coluna já diz: fora do Quadro por etapa traz a barra da etapa; por responsável dispensa a
   * linha do responsável; por setor dispensa o selo, porque o setor está na coluna.
   */
  agrupar: AgruparQuadroPor
  /** As etapas do catálogo: o selo de relatório pendente compara a posição da etapa atual com a da Revisão interna. */
  etapas: EtapaDoCatalogo[]
  aoLevantar: () => void
  aoBaixar: () => void
}

/** O cartão do Quadro é um link: focável, e Enter abre o painel do processo. Arrastar usa o recurso nativo do navegador. */
export function CartaoDoProcesso({ processo, escolhido, href, arrastavel, apagado, agrupar, etapas, aoLevantar, aoBaixar }: CartaoDoProcessoProps) {
  const { id, nome, tipo, situacao } = processo
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
      <span className="cartao-topo">
        {agrupar !== 'setor' && <SeloDoSetor sigla={processo.setorSigla} cor={processo.setorCor ?? 1} />}
        {tipo !== 'processo' && <Pilula situacao="neutra">{ROTULO_DO_TIPO[tipo]}</Pilula>}
        {situacao === 'suspenso' && <Pilula situacao="neutra">Suspenso</Pilula>}
        <EtiquetaDoProcesso etiqueta={processo.etiqueta} soIcone />
      </span>
      <span className="cartao-nome">{nome}</span>
      {agrupar !== 'etapa' && <BarraDeProgresso processo={processo} />}
      {!porResponsavel && <QuemCuida responsavel={processo.responsavel} />}
      <SelosDoCartao processo={processo} hoje={hojeEmBrasilia()} etapas={etapas} />
    </a>
  )
}


/** Processo parado ganha a faixa vermelha na borda; o cartão arrastado fica apagado. */
function classesDoCartao(processo: ProcessoDaLista, apagado: boolean): string {
  const parado = diasDoProcessoParado(processo, hojeEmBrasilia()) !== null
  return ['cartao', apagado && 'cartao-apagado', parado && 'cartao-parado'].filter(Boolean).join(' ')
}

/** A linha de quem cuida do processo: ícone de pessoa e o nome, ou "Sem responsável" em cinza. */
function QuemCuida({ responsavel }: { responsavel: ProcessoDaLista['responsavel'] }) {
  return (
    <span className={responsavel ? 'cartao-responsavel' : 'cartao-responsavel cartao-responsavel-vazio'}>
      <Icone nome="conta" tamanho={14} />
      {responsavel ? responsavel.nome : 'Sem responsável'}
    </span>
  )
}
