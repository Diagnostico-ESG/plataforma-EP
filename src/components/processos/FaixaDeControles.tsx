import type { ReactNode } from 'react'
import type { FormaDeVer } from '../../processos/enderecoDosProcessos'
import { Icone } from '../Icone'
import { LegendaDasEtiquetas } from './LegendaDasEtiquetas'
import { MenuDaFormaDeVer } from './MenuDaFormaDeVer'
import './FaixaDeControles.css'

type FaixaDeControlesProps = {
  forma: FormaDeVer
  aoEscolherForma: (forma: FormaDeVer) => void
  /** Sem ele (Consulta), a faixa não tem [Cadastrar processo]. */
  podeCadastrar: boolean
  aoCadastrar: () => void
  /** Enquanto os processos carregam: a faixa já aparece, com os controles da visão desabilitados, para não pular. */
  desabilitada: boolean
  /** Os controles da forma de ver, depois do separador (Filtros e Só os meus no Quadro; Agrupar por na Lista). */
  children: ReactNode
}

/**
 * A faixa de altura fixa da área de processos, igual nas quatro formas de ver: [Cadastrar processo], "Quadro ▾", separador,
 * os controles da forma de ver e, nos quadros, a legenda das etiquetas na ponta direita. O fieldset (display: contents)
 * desabilita de uma vez o que depende dos dados; [Cadastrar processo] fica fora dele, porque abrir o cadastro não depende da lista.
 */
export function FaixaDeControles({ forma, aoEscolherForma, podeCadastrar, aoCadastrar, desabilitada, children }: FaixaDeControlesProps) {
  return (
    <div className="faixa-de-controles" role="group" aria-label="Controles dos processos">
      {podeCadastrar && (
        <button type="button" className="botao botao-principal" onClick={aoCadastrar}>
          <Icone nome="mais" tamanho={16} />
          Cadastrar processo
        </button>
      )}
      <fieldset className="faixa-de-controles-da-visao" disabled={desabilitada}>
        <MenuDaFormaDeVer forma={forma} aoEscolher={aoEscolherForma} />
        <span className="faixa-separador" aria-hidden="true" />
        {children}
      </fieldset>
      {forma !== 'lista' && <LegendaDasEtiquetas />}
    </div>
  )
}
