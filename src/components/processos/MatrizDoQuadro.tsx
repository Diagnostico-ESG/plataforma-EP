import { useState } from 'react'
import type { ArrastoDoQuadro } from '../../hooks/useArrastoDoQuadro'
import type { ColunaDoQuadro as Coluna } from '../../processos/colunasDoQuadro'
import { CHAVE_SEM_RESPONSAVEL, chaveDaLinha, type LinhaDoQuadro, type TipoDeLinha } from '../../processos/linhasDoQuadro'
import { CHAVE_DOS_CONCLUIDOS } from '../../processos/publicacao'
import type { EtapaDoCatalogo } from '../../processos/tipos'
import { Avatar } from '../Avatar'
import { Icone } from '../Icone'
import { Pilula } from '../Pilula'
import { SeloDoSetor } from '../SeloDoSetor'
import { CabecalhoDaColuna, ColunaDoQuadro } from './ColunaDoQuadro'
import { PeDaColunaDosConcluidos } from './PeDaColunaDosConcluidos'
import './Matriz.css'

type MatrizDoQuadroProps = {
  tipo: TipoDeLinha
  colunas: Coluna[]
  linhas: LinhaDoQuadro[]
  idEscolhido: string | null
  enderecoDoProcesso: (id: string) => string
  podeAlterar: boolean
  arrasto: ArrastoDoQuadro
  etapas: EtapaDoCatalogo[]
  nomesDosSetores: Record<string, string>
  foraDoQuadro: { quantos: number; enderecoDaLista: string }
  destacarDe: string | null
  usuarioId: string
  /** O cartão foi solto numa linha que não é a dele. */
  aoSoltarFora: () => void
}

const nomeDaLinha = (linha: LinhaDoQuadro): string => (linha.voce ? 'Você' : linha.titulo)

/** O nome da linha: a sigla no selo (por setor) ou o avatar e o nome (por responsável), "Você" para quem está na tela. */
function RotuloDaLinha({ tipo, linha }: { tipo: TipoDeLinha; linha: LinhaDoQuadro }) {
  if (tipo === 'setor') return <SeloDoSetor sigla={linha.titulo} cor={linha.cor ?? 1} nome={linha.nome} />
  return (
    <>
      {linha.chave !== CHAVE_SEM_RESPONSAVEL && <Avatar nome={linha.titulo} tamanho={24} decorativo proprio={linha.voce} />}
      <b className="matriz-quem">{nomeDaLinha(linha)}</b>
      {linha.inativo && <Pilula situacao="neutra">Inativo</Pilula>}
    </>
  )
}

/**
 * O Quadro por etapa com Linhas: o cabeçalho das etapas uma vez no alto e uma linha por setor ou por responsável, com as mesmas
 * colunas alinhadas. Cada linha recolhe pela setinha (o estado é só da tela: ao recarregar, todas voltam abertas).
 */
export function MatrizDoQuadro(props: MatrizDoQuadroProps) {
  const { colunas, linhas, foraDoQuadro } = props
  const [recolhidas, setRecolhidas] = useState<Set<string>>(new Set())
  const alternar = (chave: string) => setRecolhidas((antes) => {
    const depois = new Set(antes)
    if (!depois.delete(chave)) depois.add(chave)
    return depois
  })
  const modelo = `var(--largura-linha-quadro) repeat(${colunas.length}, var(--largura-coluna-quadro))`
  return (
    <div className="quadro-colunas quadro-matriz" style={{ gridTemplateColumns: modelo }}>
      <div className="matriz-canto" />
      {colunas.map((coluna) => (
        <div key={coluna.chave} className="matriz-cabecalho">
          <CabecalhoDaColuna coluna={coluna} agrupar="etapa" />
          {coluna.chave === CHAVE_DOS_CONCLUIDOS && <PeDaColunaDosConcluidos {...foraDoQuadro} />}
        </div>
      ))}
      {linhas.map((linha) => (
        <LinhaDaMatriz key={linha.chave} {...props} linha={linha} aberta={!recolhidas.has(linha.chave)} aoAlternar={() => alternar(linha.chave)} />
      ))}
    </div>
  )
}

type LinhaDaMatrizProps = MatrizDoQuadroProps & { linha: LinhaDoQuadro; aberta: boolean; aoAlternar: () => void }

function LinhaDaMatriz({ linha, aberta, aoAlternar, ...props }: LinhaDaMatrizProps) {
  const { tipo, colunas } = props
  const quantos = colunas.reduce((total, coluna) => total + coluna.processos.filter((p) => chaveDaLinha(tipo, p) === linha.chave).length, 0)
  return (
    <>
      <div className="matriz-linha-cabeca">
        <button type="button" className="matriz-setinha" aria-expanded={aberta}
          aria-label={`${aberta ? 'Recolher' : 'Abrir'} a linha ${nomeDaLinha(linha)}`} onClick={aoAlternar}>
          <Icone nome="seta" tamanho={16} />
        </button>
        <RotuloDaLinha tipo={tipo} linha={linha} />
        <span className="coluna-contagem">{quantos}</span>
      </div>
      {aberta
        ? colunas.map((coluna) => <CelulaDaMatriz key={coluna.chave} {...props} linha={linha} coluna={coluna} />)
        : <p className="matriz-recolhida">{quantos === 1 ? '1 processo' : `${quantos} processos`} · linha recolhida</p>}
    </>
  )
}

function CelulaDaMatriz({ coluna, linha, ...props }: MatrizDoQuadroProps & { linha: LinhaDoQuadro; coluna: Coluna }) {
  const { tipo } = props
  const daLinha = { ...coluna, processos: coluna.processos.filter((processo) => chaveDaLinha(tipo, processo) === linha.chave) }
  return (
    <ColunaDoQuadro coluna={daLinha} idEscolhido={props.idEscolhido} enderecoDoProcesso={props.enderecoDoProcesso}
      podeAlterar={props.podeAlterar} arrasto={props.arrasto} agrupar="etapa" etapas={props.etapas}
      nomesDosSetores={props.nomesDosSetores} destacarDe={props.destacarDe} usuarioId={props.usuarioId}
      linha={{ chave: linha.chave, titulo: nomeDaLinha(linha), tipo, aoSoltarFora: props.aoSoltarFora }} />
  )
}
