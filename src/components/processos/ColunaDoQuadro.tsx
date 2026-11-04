import type { DragEvent } from 'react'
import type { ArrastoDoQuadro } from '../../hooks/useArrastoDoQuadro'
import { useTirarDoQuadroDaTela } from '../../hooks/useTirarDoQuadro'
import type { ColunaDoQuadro as Coluna } from '../../processos/colunasDoQuadro'
import { podeArrastar } from '../../processos/destinoDoArrastar'
import type { AgruparQuadroPor } from '../../processos/enderecoDosProcessos'
import { CHAVE_DOS_CONCLUIDOS } from '../../processos/publicacao'
import type { EtapaDoCatalogo } from '../../processos/tipos'
import { iconeDaEtapa } from '../../processos/iconeDaEtapa'
import { chaveDaLinha, type TipoDeLinha } from '../../processos/linhasDoQuadro'
import { Icone } from '../Icone'
import { Pilula } from '../Pilula'
import { CartaoDoProcesso } from './CartaoDoProcesso'
import { PeDaColunaDosConcluidos } from './PeDaColunaDosConcluidos'

type ColunaDoQuadroProps = {
  coluna: Coluna
  idEscolhido: string | null
  enderecoDoProcesso: (id: string) => string
  /** Quem não altera (Consulta) não arrasta cartão. */
  podeAlterar: boolean
  arrasto: ArrastoDoQuadro
  /** Fora do Quadro por etapa o cartão mostra a barra da etapa e não se arrasta. */
  agrupar: AgruparQuadroPor
  /** As etapas do catálogo: o cartão e os selos precisam delas. */
  etapas: EtapaDoCatalogo[]
  /** Id do setor → nome, para o selo do cartão dizer o nome. */
  nomesDosSetores: Record<string, string>
  /** Só a coluna Concluídos do Quadro por etapa: os concluídos fora do Quadro e a Lista que os mostra. */
  foraDoQuadro?: { quantos: number; enderecoDaLista: string }
  /** O Destacar os meus ligado: o id de quem está na tela; o cartão de outro responsável fica esmaecido. */
  destacarDe: string | null
  /** Quem está na tela, para o cartão dizer "Você". */
  usuarioId: string
  /** Só dentro das Linhas: a célula da coluna naquela linha, sem título (o cabeçalho das etapas fica uma vez no alto). */
  linha?: { chave: string; titulo: string; tipo: TipoDeLinha; aoSoltarFora: () => void }
}

export function ColunaDoQuadro({ coluna, idEscolhido, enderecoDoProcesso, podeAlterar, arrasto, agrupar, etapas, nomesDosSetores, foraDoQuadro, destacarDe, usuarioId, linha }: ColunaDoQuadroProps) {
  const { levantado } = arrasto
  const tirar = useTirarDoQuadroDaTela()
  const dosConcluidos = agrupar === 'etapa' && coluna.chave === CHAVE_DOS_CONCLUIDOS
  const { realce, aoEntrar, aoPassar, aoSoltar } = recebedorDoCartao(coluna, agrupar, arrasto, linha)
  return (
    <section className={classesDaColuna(realce)} aria-label={linha ? `${linha.titulo}: ${coluna.titulo}` : rotuloDaColuna(coluna)}
      onDragEnter={aoEntrar} onDragOver={aoPassar} onDrop={aoSoltar}>
      {!linha && <CabecalhoDaColuna coluna={coluna} agrupar={agrupar} />}
      <div className="coluna-cartoes">
        {!linha && <AvisoDaColunaVazia coluna={coluna} agrupar={agrupar} />}
        {coluna.processos.map((processo) => {
          const cartao = (
            <CartaoDoProcesso key={processo.id} processo={processo} escolhido={processo.id === idEscolhido}
              href={enderecoDoProcesso(processo.id)} arrastavel={podeAlterar && agrupar === 'etapa' && podeArrastar(processo)}
              agrupar={agrupar} etapas={etapas} nomeDoSetor={nomesDosSetores[processo.setorId]} usuarioId={usuarioId} naLinha={linha?.tipo} apagado={levantado?.id === processo.id}
              esmaecido={destacarDe !== null && processo.responsavel?.id !== destacarDe}
              aoLevantar={() => arrasto.levantar(processo)} aoBaixar={arrasto.baixar} />
          )
          if (!dosConcluidos || !podeAlterar || !tirar) return cartao
          // O botão não pode ficar dentro do <a> do cartão: vai logo abaixo dele, num envoltório.
          return (
            <div key={processo.id} className="cartao-com-acao">
              {cartao}
              <button type="button" className="botao botao-secundario cartao-tirar" aria-label={`Tirar do Quadro: ${processo.nome}`}
                onClick={() => tirar({ id: processo.id, nome: processo.nome })}>
                Tirar do Quadro
              </button>
            </div>
          )
        })}
        {dosConcluidos && !linha && foraDoQuadro && <PeDaColunaDosConcluidos {...foraDoQuadro} />}
      </div>
    </section>
  )
}

/**
 * Como a coluna (ou a célula, dentro das Linhas) recebe o cartão levantado. Só as colunas de etapa recebem (por responsável e
 * por setor não se arrasta); nas Linhas a célula só acende para o cartão da própria linha, e soltar em outra linha só avisa.
 */
function recebedorDoCartao(coluna: Coluna, agrupar: AgruparQuadroPor, arrasto: ArrastoDoQuadro, linha: ColunaDoQuadroProps['linha']) {
  const { levantado } = arrasto
  const recebe = levantado !== null && agrupar === 'etapa'
  const mesmaLinha = !linha || levantado === null || chaveDaLinha(linha.tipo, levantado) === linha.chave
  const chaveDoRealce = linha ? `${linha.chave}/${coluna.chave}` : coluna.chave
  return {
    realce: recebe && mesmaLinha && arrasto.sobre === chaveDoRealce,
    aoEntrar: () => { if (recebe && mesmaLinha) arrasto.passarPor(chaveDoRealce) },
    aoPassar: (evento: DragEvent) => {
      if (!recebe) return
      evento.preventDefault()
      if (mesmaLinha) arrasto.passarPor(chaveDoRealce)
    },
    aoSoltar: (evento: DragEvent) => {
      evento.preventDefault()
      if (mesmaLinha) return arrasto.soltarEm(coluna.chave)
      arrasto.baixar()
      linha?.aoSoltarFora()
    },
  }
}

/** O título da coluna: o ícone da etapa (só enfeite, o nome está ao lado), o nome, a contagem e, por setor, o nome do setor. */
export function CabecalhoDaColuna({ coluna, agrupar }: { coluna: Coluna; agrupar: AgruparQuadroPor }) {
  return (
    <h3 className="coluna-titulo">
      <span className="coluna-titulo-texto">
        <span className="coluna-titulo-principal">
          {agrupar === 'etapa' && <Icone nome={iconeDaEtapa(coluna.chave)} tamanho={16} />}
          <TituloDaColuna coluna={coluna} />{coluna.inativo && <> <Pilula situacao="neutra">Inativo</Pilula></>}
        </span>
      </span>
      {coluna.subtitulo && <span className="coluna-titulo-nome">{coluna.subtitulo}</span>}
      <span className="coluna-contagem">{coluna.processos.length}</span>
    </h3>
  )
}

// Por setor a sigla é só o texto em negrito, sem a pílula: o selo da cor do setor fica no cartão (ADR 0040 e 0042).
function TituloDaColuna({ coluna }: { coluna: Coluna }) {
  return <>{coluna.titulo}</>
}

// Por setor a coluna é anunciada pela sigla, pelo nome e, no setor desativado, por "inativo": o aria-label encobre a pílula.
function rotuloDaColuna({ titulo, subtitulo, inativo }: Coluna): string {
  if (!subtitulo) return titulo
  return inativo ? `${titulo} · ${subtitulo} · inativo` : `${titulo} · ${subtitulo}`
}

// Por etapa, só Concluídos vazia ganha frase; por setor, toda coluna vazia (os setores sem processo também aparecem).
function AvisoDaColunaVazia({ coluna, agrupar }: { coluna: Coluna; agrupar: AgruparQuadroPor }) {
  if (coluna.processos.length > 0) return null
  if (agrupar === 'setor') return <p className="coluna-vazia">Nenhum processo deste setor no Quadro.</p>
  if (coluna.chave === CHAVE_DOS_CONCLUIDOS) return <p className="coluna-vazia">Nenhum processo concluído.</p>
  return null
}

// A coluna só ganha o realce de destino do arrastar: a cor do setor mora no selo do cartão, nunca na coluna.
function classesDaColuna(realce: boolean): string {
  return realce ? 'coluna coluna-destino' : 'coluna'
}
