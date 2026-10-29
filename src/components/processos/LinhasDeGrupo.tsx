import './ArvoreDaLista.css'
import { COLUNAS_DA_LISTA } from '../../processos/colunasDaLista'
import type { MacroDaArvore, SetorDaArvore } from '../../processos/arvoreDaLista'
import { SeloDoSetor } from '../SeloDoSetor'

const plural = (quantos: number) => `${quantos} ${quantos === 1 ? 'processo' : 'processos'}`

type GrupoProps = { aberto: boolean; aoAlternar: () => void }

/** A linha do macroprocesso: nome, quantos processos tem e a seta que abre e fecha o ramo. */
export function LinhaDoMacro({ macro, aberto, aoAlternar }: GrupoProps & { macro: MacroDaArvore }) {
  return (
    <tr className="linha-de-macro">
      <th scope="rowgroup" colSpan={COLUNAS_DA_LISTA.length}>
        <button type="button" className="botao-do-grupo" aria-expanded={aberto} aria-label={`${macro.nome}, ${plural(macro.total)}`} onClick={aoAlternar}>
          <span aria-hidden="true">{aberto ? '▾' : '▸'}</span>
          <span className="nome-do-grupo" aria-hidden="true">{macro.nome}</span>
          <span className="contagem-do-grupo" aria-hidden="true">{macro.total}</span>
        </button>
      </th>
    </tr>
  )
}

/** A linha do setor dentro do macroprocesso: selo da sigla, nome e quantos processos tem. */
export function LinhaDoSetor({ setor, aberto, aoAlternar }: GrupoProps & { setor: SetorDaArvore }) {
  return (
    <tr className="linha-de-setor">
      <th scope="rowgroup" colSpan={COLUNAS_DA_LISTA.length}>
        <button type="button" className="botao-do-grupo" aria-expanded={aberto} aria-label={`${setor.sigla} ${setor.nome}, ${plural(setor.itens.length)}`}
          onClick={aoAlternar}>
          <span aria-hidden="true">{aberto ? '▾' : '▸'}</span>
          <SeloDoSetor sigla={setor.sigla} cor={setor.cor} />
          <span className="nome-do-grupo" aria-hidden="true">{setor.nome}</span>
          <span className="contagem-do-grupo" aria-hidden="true">{setor.itens.length}</span>
        </button>
      </th>
    </tr>
  )
}
