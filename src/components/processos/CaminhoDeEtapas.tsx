import { acoesDaEtapa, ehEtapaDoProcesso, indiceDaEtapaAtual } from '../../processos/caminhoDeEtapas'
import type { DatasDaEtapa, EtapaDoCaminho, ModuloDeProcessos, UsuarioResponsavel } from '../../processos/tipos'
import { JanelaComCampo } from '../JanelaComCampo'
import { EdicaoDaEtapa } from './EdicaoDaEtapa'
import { LinhaDaEtapa } from './LinhaDaEtapa'
import { type PedidoDeTexto, useAcoesDaEtapa } from './useAcoesDaEtapa'

const JANELA_DO_TEXTO: Record<PedidoDeTexto['acao'], {
  titulo: (nome: string) => string; rotuloDoCampo: string; rotuloDaAcao: string
}> = {
  dispensar: { titulo: (nome) => `Dispensar a etapa ${nome}?`, rotuloDoCampo: 'Nota', rotuloDaAcao: 'Dispensar' },
  realizada: {
    titulo: (nome) => `Registrar a etapa ${nome} como realizada anteriormente?`, rotuloDoCampo: 'Nota', rotuloDaAcao: 'Registrar',
  },
  voltar: { titulo: (nome) => `Voltar à etapa ${nome}?`, rotuloDoCampo: 'Motivo', rotuloDaAcao: 'Voltar' },
}

type CaminhoDeEtapasProps = {
  processos: ModuloDeProcessos
  /** Do setor ou do processo (só esta traz o responsável). */
  etapas: EtapaDoCaminho[]
  podeAlterar: boolean
  /** Quem pode ser responsável; sem a lista, não há seletor de responsável. */
  usuarios?: UsuarioResponsavel[]
  aoMudar: () => void
  aoSumir: () => void
}

// O nome fica de fora quando o seletor o mostra e na etapa sem responsável lido: undefined esconde a linha.
function nomeDoResponsavel(etapa: EtapaDoCaminho, comSeletor: boolean): string | null | undefined {
  return ehEtapaDoProcesso(etapa) && !comSeletor ? etapa.responsavelNome : undefined
}

/**
 * O caminho de etapas (do setor ou do processo): só a etapa atual anda e as resolvidas anteriores voltam;
 * Dispensar, Realizada anteriormente e Voltar pedem nota ou motivo. Quem pode alterar também corrige as datas.
 */
export function CaminhoDeEtapas({ processos, etapas, podeAlterar, usuarios, aoMudar, aoSumir }: CaminhoDeEtapasProps) {
  const { falha, pedido, agir, gravarComTexto, mudarResponsavel, fecharPedido } = useAcoesDaEtapa(processos, aoMudar, aoSumir)
  const atual = indiceDaEtapaAtual(etapas)
  const janela = pedido ? JANELA_DO_TEXTO[pedido.acao] : null

  async function corrigirDatas(etapa: EtapaDoCaminho, datas: DatasDaEtapa) {
    await processos.corrigirDatasDaEtapa(etapa.id, datas)
    aoMudar()
  }

  return (
    <>
      <ol className="caminho-de-etapas">
        {etapas.map((etapa, indice) => (
          <LinhaDaEtapa key={etapa.id} etapa={etapa} atual={indice === atual}
            acoes={podeAlterar ? acoesDaEtapa(etapas, indice) : []} aoAgir={(acao) => agir(acao, etapa)}
            responsavelNome={nomeDoResponsavel(etapa, podeAlterar && usuarios !== undefined)}
            responsavelInativo={ehEtapaDoProcesso(etapa) && etapa.responsavelInativo}>
            {podeAlterar && (
              <EdicaoDaEtapa etapa={etapa} usuarios={usuarios} aoSumir={aoSumir}
                aoCorrigirDatas={(datas) => corrigirDatas(etapa, datas)}
                aoEscolherResponsavel={(usuarioId) => mudarResponsavel(etapa, usuarioId)} />
            )}
          </LinhaDaEtapa>
        ))}
      </ol>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      <JanelaComCampo aberta={pedido !== null} titulo={janela && pedido ? janela.titulo(pedido.etapa.nome) : ''}
        rotuloDoCampo={janela?.rotuloDoCampo ?? ''} rotuloDaAcao={janela?.rotuloDaAcao ?? ''}
        aoConfirmar={gravarComTexto} aoFechar={fecharPedido} />
    </>
  )
}
