import type { ReactNode } from 'react'
import { chaveDoMacro, chaveDoSetor, useAbertosDaArvore } from '../../hooks/useAbertosDaArvore'
import { useArquivosDosProcessos } from '../../hooks/useArquivosDosProcessos'
import { type ItemDaArvore, type MacroDaArvore, type SetorDaArvore, montarArvore } from '../../processos/arvoreDaLista'
import type { LinhaDaLista } from '../../processos/linhasDaLista'
import type { ProcessoDaLista, SetorDoQuadro } from '../../processos/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { LinhaDoProcesso } from './LinhaDoProcesso'
import { LinhaDosArquivos } from './LinhaDosArquivos'
import { LinhaDoMacro, LinhaDoSetor } from './LinhasDeGrupo'
import { CanceladosDaLista } from './TabelaDeProcessos'

type ArvoreDaListaProps = {
  /** O cabeçalho com os menus de ordenação e filtro, o mesmo da tabela. */
  cabecalho: ReactNode
  /** As linhas já filtradas e ordenadas: a árvore só as agrupa. */
  linhas: LinhaDaLista[]
  todos: ProcessoDaLista[]
  setores: SetorDoQuadro[]
  cancelados: LinhaDaLista[]
  idEscolhido: string | null
  aoAbrir: (id: string) => void
  busca: string | null
  modulo: ModuloDeVersoes
}

/** A Lista agrupada por macroprocesso: a mesma tabela, com linhas de macroprocesso e de setor e, em cada processo, os arquivos. */
export function ArvoreDaLista({ cabecalho, linhas, todos, setores, cancelados, idEscolhido, aoAbrir, busca, modulo }: ArvoreDaListaProps) {
  const arvore = montarArvore(linhas, todos, setores)
  const abertos = useAbertosDaArvore(arvore)
  const { estados, buscar } = useArquivosDosProcessos(modulo)
  const alternarProcesso = (id: string) => {
    if (abertos.alternarProcesso(id)) buscar([id])
  }
  const alternarTudo = () => (abertos.tudoAberto ? abertos.fecharTudo() : buscar(abertos.abrirTudo()))
  const linhaDe = (linha: LinhaDaLista) => (
    <LinhaDoProcesso key={linha.id} linha={linha} escolhida={linha.id === idEscolhido} aoAbrir={aoAbrir} busca={busca} />
  )
  return (
    <>
      <div className="barra-da-arvore">
        <button type="button" className="botao botao-secundario" onClick={alternarTudo}>{abertos.tudoAberto ? 'Fechar todos' : 'Abrir todos'}</button>
      </div>
      <table className="tabela-cadastros tabela-de-processos">
        {cabecalho}
        <tbody>
          {arvore.map((macro) => (
            <RamoDoMacro key={macro.id} macro={macro} abertos={abertos} estados={estados} alternarProcesso={alternarProcesso}
              buscar={buscar} modulo={modulo} idEscolhido={idEscolhido} aoAbrir={aoAbrir} busca={busca} />
          ))}
        </tbody>
        <CanceladosDaLista cancelados={cancelados} linhaDe={linhaDe} />
      </table>
    </>
  )
}

type Abertos = ReturnType<typeof useAbertosDaArvore>
type Estados = ReturnType<typeof useArquivosDosProcessos>['estados']

type RamoProps = {
  abertos: Abertos; estados: Estados; alternarProcesso: (id: string) => void; buscar: (ids: string[]) => void
  modulo: ModuloDeVersoes; idEscolhido: string | null; aoAbrir: (id: string) => void; busca: string | null
}

function RamoDoMacro({ macro, ...ramo }: RamoProps & { macro: MacroDaArvore }) {
  const chave = chaveDoMacro(macro.id)
  const aberto = ramo.abertos.grupoAberto(chave)
  return (
    <>
      <LinhaDoMacro macro={macro} aberto={aberto} aoAlternar={() => ramo.abertos.alternarGrupo(chave)} />
      {aberto && macro.setores.map((setor) => <RamoDoSetor key={setor.id} macroId={macro.id} setor={setor} {...ramo} />)}
    </>
  )
}

function RamoDoSetor({ macroId, setor, ...ramo }: RamoProps & { macroId: string; setor: SetorDaArvore }) {
  const chave = chaveDoSetor(macroId, setor.id)
  const aberto = ramo.abertos.grupoAberto(chave)
  return (
    <>
      <LinhaDoSetor setor={setor} aberto={aberto} aoAlternar={() => ramo.abertos.alternarGrupo(chave)} />
      {aberto && setor.itens.map((item) => <ProcessoDaArvore key={item.linha.id} item={item} {...ramo} />)}
    </>
  )
}

function ProcessoDaArvore({ item, ...ramo }: RamoProps & { item: ItemDaArvore }) {
  const { linha, nivel, subprocessoDe } = item
  const aberto = ramo.abertos.processoAberto(linha.id)
  return (
    <>
      <LinhaDoProcesso linha={linha} escolhida={linha.id === ramo.idEscolhido} aoAbrir={ramo.aoAbrir} busca={ramo.busca}
        arvore={{ nivel, aberto, subprocessoDe, aoAlternar: () => ramo.alternarProcesso(linha.id) }} />
      {aberto && <LinhaDosArquivos estado={ramo.estados[linha.id]} modulo={ramo.modulo} aoTentarDeNovo={() => ramo.buscar([linha.id])} />}
    </>
  )
}
