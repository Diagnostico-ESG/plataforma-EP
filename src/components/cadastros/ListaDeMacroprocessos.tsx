import { useState } from 'react'
import { rotuloDaCategoria } from '../../cadastros/categorias'
import type { MacroprocessoDaLista } from '../../cadastros/tipos'
import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'
import { Pilula } from '../Pilula'
import { ErroAoCarregar } from './ErroAoCarregar'
import { CaixaMostrarInativos, LinhaFantasma } from './PecasDaLista'

const LINHAS_FANTASMA = 3
const SEM_VALOR = '—'

type ListaDeMacroprocessosProps = {
  estado: EstadoDoCarregamento<MacroprocessoDaLista[]>
  aoTentarDeNovo: () => void
  aoAbrir: (id: string) => void
}

export function ListaDeMacroprocessos({ estado, aoTentarDeNovo, aoAbrir }: ListaDeMacroprocessosProps) {
  const [mostrarInativos, setMostrarInativos] = useState(false)
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os macroprocessos" aoTentarDeNovo={aoTentarDeNovo} />
  if (estado.tipo === 'pronto' && estado.valor.length === 0) {
    return <p className="cadastros-vazio">Nenhum macroprocesso cadastrado ainda.</p>
  }
  const visiveis = estado.tipo === 'pronto'
    ? estado.valor.filter((macroprocesso) => mostrarInativos || macroprocesso.ativo)
    : []
  return (
    <>
      {estado.tipo === 'pronto' && <CaixaMostrarInativos marcada={mostrarInativos} aoMudar={setMostrarInativos} />}
      {estado.tipo === 'pronto' && visiveis.length === 0
        ? <p className="cadastros-vazio">Nenhum macroprocesso ativo para mostrar.</p>
        : <TabelaDeMacroprocessos carregando={estado.tipo === 'carregando'} macroprocessos={visiveis} aoAbrir={aoAbrir} />}
    </>
  )
}

type TabelaProps = { carregando: boolean; macroprocessos: MacroprocessoDaLista[]; aoAbrir: (id: string) => void }

function TabelaDeMacroprocessos({ carregando, macroprocessos, aoAbrir }: TabelaProps) {
  return (
    <table className="tabela-cadastros" aria-busy={carregando}>
      {carregando && <caption>Carregando macroprocessos…</caption>}
      <thead>
        <tr>
          <th scope="col">Código</th><th scope="col">Nome</th><th scope="col">Categoria</th>
          <th scope="col">Setores</th><th scope="col">Situação</th>
        </tr>
      </thead>
      <tbody>
        {carregando
          ? Array.from({ length: LINHAS_FANTASMA }, (_, i) => <LinhaFantasma key={i} colunas={5} />)
          : macroprocessos.map((macroprocesso) => (
            <LinhaDeMacroprocesso key={macroprocesso.id} macroprocesso={macroprocesso} aoAbrir={aoAbrir} />
          ))}
      </tbody>
    </table>
  )
}

// A linha inteira abre o macroprocesso; o botão no nome dá o mesmo caminho a quem usa o teclado (nem todos têm código).
function LinhaDeMacroprocesso({ macroprocesso, aoAbrir }: { macroprocesso: MacroprocessoDaLista; aoAbrir: (id: string) => void }) {
  return (
    <tr className="linha-clicavel" onClick={() => aoAbrir(macroprocesso.id)}>
      <td>{macroprocesso.codigo ?? SEM_VALOR}</td>
      <td><button type="button" className="cadastros-abrir">{macroprocesso.nome}</button></td>
      <td>{macroprocesso.categoria === null ? SEM_VALOR : rotuloDaCategoria(macroprocesso.categoria)}</td>
      <td>{macroprocesso.quantidadeDeSetores}</td>
      <td>{!macroprocesso.ativo && <Pilula situacao="neutra">Inativo</Pilula>}</td>
    </tr>
  )
}
