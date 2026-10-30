import type { ReactNode } from 'react'
import {
  chaveDoMacro, chaveDoMacroNoSetor, chaveDoSetor, chaveDoSetorRaiz, estruturaPorMacro, estruturaPorSetor, useAbertosDaArvore,
} from '../../hooks/useAbertosDaArvore'
import { useArquivosDosProcessos } from '../../hooks/useArquivosDosProcessos'
import {
  type ItemDaArvore, type MacroDaArvore, type MacroNoSetor, type SetorDaArvore, type SetorRaizDaArvore, montarArvore, montarArvorePorSetor,
} from '../../processos/arvoreDaLista'
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
  /** Macroprocesso → setor → processo, ou setor → macroprocesso → processo. */
  agrupar: 'macroprocesso' | 'setor'
  /** As linhas já filtradas e ordenadas: a árvore só as agrupa. */
  linhas: LinhaDaLista[]
  todos: ProcessoDaLista[]
  setores: SetorDoQuadro[]
  cancelados: LinhaDaLista[]
  idEscolhido: string | null
  aoAbrir: (id: string) => void
  modulo: ModuloDeVersoes
}

/** A Lista agrupada: a mesma tabela, com linhas de macroprocesso e de setor e, em cada processo, os arquivos. */
export function ArvoreDaLista({ cabecalho, agrupar, linhas, todos, setores, cancelados, idEscolhido, aoAbrir, modulo }: ArvoreDaListaProps) {
  const porSetor = agrupar === 'setor'
  const arvorePorMacro = porSetor ? [] : montarArvore(linhas, todos, setores)
  const arvorePorSetor = porSetor ? montarArvorePorSetor(linhas, todos, setores) : []
  const abertos = useAbertosDaArvore(porSetor ? estruturaPorSetor(arvorePorSetor) : estruturaPorMacro(arvorePorMacro))
  const { estados, buscar } = useArquivosDosProcessos(modulo)
  const alternarProcesso = (id: string) => {
    if (abertos.alternarProcesso(id)) buscar([id])
  }
  const alternarTudo = () => (abertos.tudoAberto ? abertos.fecharTudo() : buscar(abertos.abrirTudo()))
  const linhaDe = (linha: LinhaDaLista) => <LinhaDoProcesso key={linha.id} linha={linha} escolhida={linha.id === idEscolhido} aoAbrir={aoAbrir} />
  const ramo: RamoProps = { abertos, estados, alternarProcesso, buscar, modulo, idEscolhido, aoAbrir }
  return (
    <>
      <div className="barra-da-arvore">
        <button type="button" className="botao botao-secundario" onClick={alternarTudo}>{abertos.tudoAberto ? 'Fechar todos' : 'Abrir todos'}</button>
      </div>
      <table className="tabela-cadastros tabela-de-processos">
        {cabecalho}
        <tbody>
          {arvorePorMacro.map((macro) => <RamoDoMacro key={macro.id} macro={macro} {...ramo} />)}
          {arvorePorSetor.map((setor) => <RamoDoSetorRaiz key={setor.id} setor={setor} {...ramo} />)}
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
  modulo: ModuloDeVersoes; idEscolhido: string | null; aoAbrir: (id: string) => void
}

function RamoDoMacro({ macro, ...ramo }: RamoProps & { macro: MacroDaArvore }) {
  const chave = chaveDoMacro(macro.id)
  const aberto = ramo.abertos.grupoAberto(chave)
  return (
    <>
      <LinhaDoMacro macro={macro} aberto={aberto} aoAlternar={() => ramo.abertos.alternarGrupo(chave)} raiz />
      {aberto && macro.setores.map((setor) => <RamoDoSetor key={setor.id} macroId={macro.id} setor={setor} {...ramo} />)}
    </>
  )
}

function RamoDoSetor({ macroId, setor, ...ramo }: RamoProps & { macroId: string; setor: SetorDaArvore }) {
  const chave = chaveDoSetor(macroId, setor.id)
  const aberto = ramo.abertos.grupoAberto(chave)
  return (
    <>
      <LinhaDoSetor setor={setor} total={setor.itens.length} aberto={aberto} aoAlternar={() => ramo.abertos.alternarGrupo(chave)} />
      {aberto && setor.itens.map((item) => <ProcessoDaArvore key={item.linha.id} item={item} {...ramo} />)}
    </>
  )
}

function RamoDoSetorRaiz({ setor, ...ramo }: RamoProps & { setor: SetorRaizDaArvore }) {
  const chave = chaveDoSetorRaiz(setor.id)
  const aberto = ramo.abertos.grupoAberto(chave)
  return (
    <>
      <LinhaDoSetor setor={setor} total={setor.total} aberto={aberto} aoAlternar={() => ramo.abertos.alternarGrupo(chave)} raiz />
      {aberto && setor.macros.map((macro) => <RamoDoMacroNoSetor key={macro.id} setorId={setor.id} macro={macro} {...ramo} />)}
    </>
  )
}

function RamoDoMacroNoSetor({ setorId, macro, ...ramo }: RamoProps & { setorId: string; macro: MacroNoSetor }) {
  const chave = chaveDoMacroNoSetor(setorId, macro.id)
  const aberto = ramo.abertos.grupoAberto(chave)
  return (
    <>
      <LinhaDoMacro macro={{ nome: macro.nome, total: macro.itens.length }} aberto={aberto} aoAlternar={() => ramo.abertos.alternarGrupo(chave)} />
      {aberto && macro.itens.map((item) => <ProcessoDaArvore key={item.linha.id} item={item} {...ramo} />)}
    </>
  )
}

function ProcessoDaArvore({ item, ...ramo }: RamoProps & { item: ItemDaArvore }) {
  const { linha, nivel, subprocessoDe } = item
  const aberto = ramo.abertos.processoAberto(linha.id)
  return (
    <>
      <LinhaDoProcesso linha={linha} escolhida={linha.id === ramo.idEscolhido} aoAbrir={ramo.aoAbrir}
        arvore={{ nivel, aberto, subprocessoDe, aoAlternar: () => ramo.alternarProcesso(linha.id) }} />
      {aberto && <LinhaDosArquivos nivel={nivel} estado={ramo.estados[linha.id]} modulo={ramo.modulo} aoTentarDeNovo={() => ramo.buscar([linha.id])} />}
    </>
  )
}
