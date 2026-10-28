import type { CSSProperties } from 'react'
import { estiloDaCor } from '../../cadastros/corDoSetor'
import type { ArrastoDoQuadro } from '../../hooks/useArrastoDoQuadro'
import type { ColunaDoQuadro as Coluna } from '../../processos/colunasDoQuadro'
import { podeArrastar } from '../../processos/destinoDoArrastar'
import type { AgruparQuadroPor } from '../../processos/enderecoDosProcessos'
import { CHAVE_DOS_CONCLUIDOS } from '../../processos/publicacao'
import type { EtapaDoCatalogo } from '../../processos/tipos'
import { Pilula } from '../Pilula'
import { CartaoDoProcesso } from './CartaoDoProcesso'

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
}

export function ColunaDoQuadro({ coluna, idEscolhido, enderecoDoProcesso, podeAlterar, arrasto, agrupar, etapas }: ColunaDoQuadroProps) {
  const { levantado } = arrasto
  // Só as colunas de etapa recebem o cartão (por responsável e por setor não se arrasta), e a coluna sob o cartão ganha o realce.
  const recebe = levantado !== null && agrupar === 'etapa'
  const realce = recebe && arrasto.sobre === coluna.chave
  return (
    <section className={classesDaColuna(coluna, realce)} style={estiloDaColuna(coluna)} aria-label={rotuloDaColuna(coluna)}
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
      <h3 className={coluna.cor === undefined ? 'coluna-titulo' : 'coluna-titulo coluna-titulo-setor'}>
        <span className="coluna-titulo-texto">
          <span className="coluna-titulo-principal">{coluna.titulo}{coluna.inativo && <> <Pilula situacao="neutra">Inativo</Pilula></>}</span>
          {coluna.subtitulo && <span className="coluna-titulo-nome">{coluna.subtitulo}</span>}
        </span>
        <span className="coluna-contagem">{coluna.processos.length}</span>
      </h3>
      <div className="coluna-cartoes">
        <AvisoDaColunaVazia coluna={coluna} agrupar={agrupar} />
        {coluna.processos.map((processo) => (
          <CartaoDoProcesso key={processo.id} processo={processo} escolhido={processo.id === idEscolhido}
            href={enderecoDoProcesso(processo.id)} arrastavel={podeAlterar && agrupar === 'etapa' && podeArrastar(processo)}
            agrupar={agrupar} etapas={etapas} apagado={levantado?.id === processo.id}
            aoLevantar={() => arrasto.levantar(processo)} aoBaixar={arrasto.baixar} />
        ))}
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

// Por setor a coluna leva a cor do setor até o último cartão (ADR 0031 e 0032); vazia, só o cabeçalho é colorido. A do setor
// inativo fica cinza, sem a cor.
function classesDaColuna({ cor, inativo, processos }: Coluna, realce: boolean): string {
  return [
    'coluna',
    realce && 'coluna-destino',
    cor !== undefined && (inativo ? 'coluna-inativa' : 'coluna-do-setor'),
    cor !== undefined && processos.length === 0 && 'coluna-sem-cartao',
  ].filter(Boolean).join(' ')
}

function estiloDaColuna({ cor, inativo }: Coluna): CSSProperties | undefined {
  return cor === undefined || inativo ? undefined : (estiloDaCor(cor) as CSSProperties)
}
