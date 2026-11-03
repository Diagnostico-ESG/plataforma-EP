import './ArvoreDaLista.css'
import { COLUNAS_DA_LISTA } from '../../processos/colunasDaLista'
import { SeloDoSetor } from '../SeloDoSetor'

const plural = (quantos: number) => `${quantos} ${quantos === 1 ? 'processo' : 'processos'}`

/** `raiz`: a linha é o primeiro nível da árvore (o macroprocesso na árvore por Macroprocesso, o setor na por Setor); senão vem recuada. */
type GrupoProps = { aberto: boolean; aoAlternar: () => void; raiz?: boolean }

const classeDoGrupo = (tipo: 'macro' | 'setor', raiz: boolean | undefined) => `linha-de-${tipo} ${raiz ? 'grupo-raiz' : 'grupo-filho'}`

/** A linha do macroprocesso: nome, quantos processos tem e a seta que abre e fecha o ramo. */
export function LinhaDoMacro({ macro, aberto, aoAlternar, raiz }: GrupoProps & { macro: { nome: string; total: number } }) {
  return (
    <tr className={classeDoGrupo('macro', raiz)}>
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

/** A linha do setor: selo da sigla, nome e quantos processos tem. */
export function LinhaDoSetor({ setor, total, aberto, aoAlternar, raiz }: GrupoProps & { setor: { sigla: string; nome: string; cor: number }; total: number }) {
  return (
    <tr className={classeDoGrupo('setor', raiz)}>
      <th scope="rowgroup" colSpan={COLUNAS_DA_LISTA.length}>
        <button type="button" className="botao-do-grupo" aria-expanded={aberto} aria-label={`${setor.sigla} ${setor.nome}, ${plural(total)}`}
          onClick={aoAlternar}>
          <span aria-hidden="true">{aberto ? '▾' : '▸'}</span>
          <SeloDoSetor sigla={setor.sigla} cor={setor.cor} />
          <span className="nome-do-grupo" aria-hidden="true">{setor.nome}</span>
          <span className="contagem-do-grupo" aria-hidden="true">{total}</span>
        </button>
      </th>
    </tr>
  )
}
