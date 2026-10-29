import './ArvoreDaLista.css'
import type { LinhaDaLista } from '../../processos/linhasDaLista'
import { ROTULO_DO_TIPO } from '../../processos/rotulos'
import { SeloDoSetor } from '../SeloDoSetor'
import { BarraDeProgresso } from './BarraDeProgresso'
import { NomeComTrecho } from './NomeComTrecho'
import { PilulaDaSituacao } from './PilulaDaSituacao'
import { SeloDeParado } from './SeloDeParado'

/** O que a árvore acrescenta à linha: o recuo, a seta que abre os arquivos e a indicação do subprocesso sem o pai. */
export type LinhaNaArvore = { nivel: number; aberto: boolean; subprocessoDe: string | null; aoAlternar: () => void }

type LinhaDoProcessoProps = {
  linha: LinhaDaLista; escolhida: boolean; aoAbrir: (id: string) => void; busca: string | null; arvore?: LinhaNaArvore
}

// A linha inteira abre o painel; o botão no nome dá o mesmo caminho a quem usa o teclado e recebe o foco ao fechar.
export function LinhaDoProcesso({ linha, escolhida, aoAbrir, busca, arvore }: LinhaDoProcessoProps) {
  return (
    <tr className="linha-clicavel" aria-current={escolhida ? 'true' : undefined} onClick={() => aoAbrir(linha.id)}>
      <td className={arvore && arvore.nivel > 0 ? 'processo-recuado' : undefined}>
        {arvore && <SetaDoProcesso nome={linha.nome} aberto={arvore.aberto} aoAlternar={arvore.aoAlternar} />}
        <button type="button" id={`linha-${linha.id}`} className="cadastros-abrir">
          <NomeComTrecho nome={linha.nome} busca={busca} />
        </button>
        <IndicacaoDoPai linha={linha} arvore={arvore} />
        <SeloDeParado processo={linha} />
      </td>
      <td>{ROTULO_DO_TIPO[linha.tipo]}</td>
      <td><SeloDoSetor sigla={linha.setorSigla} cor={linha.setorCor ?? 1} /></td>
      <td>{linha.macroprocessoNome}</td>
      <td>{linha.etapaAtual ? <BarraDeProgresso processo={linha} /> : '—'}</td>
      <td>{linha.responsavel?.nome ?? '—'}</td>
      <td>
        <span className="lista-situacao">
          <PilulaDaSituacao situacao={linha.situacao} />
        </span>
      </td>
    </tr>
  )
}

// Na tabela, "↳ pai"; na árvore, o subprocesso já vem recuado sob o pai, e só o que ficou sem o pai diz de quem é.
function IndicacaoDoPai({ linha, arvore }: { linha: LinhaDaLista; arvore?: LinhaNaArvore }) {
  if (!arvore) return linha.nomeDoPai ? <span className="lista-pai">↳ {linha.nomeDoPai}</span> : null
  return arvore.subprocessoDe ? <span className="lista-pai">subprocesso de {arvore.subprocessoDe}</span> : null
}

type SetaDoProcessoProps = { nome: string; aberto: boolean; aoAlternar: () => void }

// A seta abre os arquivos; o clique não sobe até a linha, que abriria o verso.
function SetaDoProcesso({ nome, aberto, aoAlternar }: SetaDoProcessoProps) {
  return (
    <button type="button" className="seta-da-arvore" aria-expanded={aberto} aria-label={`${aberto ? 'Fechar' : 'Abrir'} arquivos de ${nome}`}
      onClick={(evento) => {
        evento.stopPropagation()
        aoAlternar()
      }}>
      <span aria-hidden="true">{aberto ? '▾' : '▸'}</span>
    </button>
  )
}
