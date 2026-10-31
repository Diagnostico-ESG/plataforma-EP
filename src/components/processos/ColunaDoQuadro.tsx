import type { ArrastoDoQuadro } from '../../hooks/useArrastoDoQuadro'
import { useTirarDoQuadroDaTela } from '../../hooks/useTirarDoQuadro'
import type { ColunaDoQuadro as Coluna } from '../../processos/colunasDoQuadro'
import { podeArrastar } from '../../processos/destinoDoArrastar'
import type { AgruparQuadroPor } from '../../processos/enderecoDosProcessos'
import { CHAVE_DOS_CONCLUIDOS } from '../../processos/publicacao'
import type { EtapaDoCatalogo } from '../../processos/tipos'
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
}

export function ColunaDoQuadro({ coluna, idEscolhido, enderecoDoProcesso, podeAlterar, arrasto, agrupar, etapas, nomesDosSetores, foraDoQuadro }: ColunaDoQuadroProps) {
  const { levantado } = arrasto
  const tirar = useTirarDoQuadroDaTela()
  const dosConcluidos = agrupar === 'etapa' && coluna.chave === CHAVE_DOS_CONCLUIDOS
  // Só as colunas de etapa recebem o cartão (por responsável e por setor não se arrasta), e a coluna sob o cartão ganha o realce.
  const recebe = levantado !== null && agrupar === 'etapa'
  const realce = recebe && arrasto.sobre === coluna.chave
  return (
    <section className={classesDaColuna(realce)} aria-label={rotuloDaColuna(coluna)}
      onDragEnter={() => recebe && arrasto.passarPor(coluna.chave)}
      onDragOver={(evento) => {
        if (!recebe) return
        evento.preventDefault()
        arrasto.passarPor(coluna.chave)
      }}
      onDrop={(evento) => {
        evento.preventDefault()
        arrasto.soltarEm(coluna.chave)
      }}>
      <h3 className="coluna-titulo">
        <span className="coluna-titulo-texto">
          <span className="coluna-titulo-principal">{coluna.titulo}{coluna.inativo && <> <Pilula situacao="neutra">Inativo</Pilula></>}</span>
        </span>
        {coluna.subtitulo && <span className="coluna-titulo-nome">{coluna.subtitulo}</span>}
        <span className="coluna-contagem">{coluna.processos.length}</span>
      </h3>
      <div className="coluna-cartoes">
        <AvisoDaColunaVazia coluna={coluna} agrupar={agrupar} />
        {coluna.processos.map((processo) => {
          const cartao = (
            <CartaoDoProcesso key={processo.id} processo={processo} escolhido={processo.id === idEscolhido}
              href={enderecoDoProcesso(processo.id)} arrastavel={podeAlterar && agrupar === 'etapa' && podeArrastar(processo)}
              agrupar={agrupar} etapas={etapas} nomeDoSetor={nomesDosSetores[processo.setorId]} apagado={levantado?.id === processo.id}
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
        {dosConcluidos && foraDoQuadro && <PeDaColunaDosConcluidos {...foraDoQuadro} />}
      </div>
    </section>
  )
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
