import { useAcoesDaEtapa } from '../../hooks/useAcoesDaEtapa'
import {
  acoesDaEtapa, ehEtapaDoProcesso, indiceDaEtapaAtual, proximaPendente, responsavelMarcado,
} from '../../processos/caminhoDeEtapas'
import type { PedidoDeAvanco, PedidoDeTexto } from '../../processos/gravarAcoes'
import type { DatasDaEtapa, EtapaDoCaminho, ModuloDeProcessos, UsuarioResponsavel } from '../../processos/tipos'
import { JanelaComCampo } from '../JanelaComCampo'
import { EdicaoDaEtapa } from './EdicaoDaEtapa'
import { JanelaDeAvanco } from './JanelaDeAvanco'
import { LinhaDaEtapa } from './LinhaDaEtapa'

const JANELA_DO_TEXTO: Record<PedidoDeTexto['acao'], {
  titulo: (nome: string) => string; rotuloDoCampo: string; rotuloDaAcao: string
}> = {
  dispensar: { titulo: (nome) => `Dispensar a etapa ${nome}?`, rotuloDoCampo: 'Nota', rotuloDaAcao: 'Dispensar' },
  realizada: {
    titulo: (nome) => `Registrar a etapa ${nome} como realizada anteriormente?`, rotuloDoCampo: 'Nota', rotuloDaAcao: 'Registrar',
  },
  voltar: { titulo: (nome) => `Voltar à etapa ${nome}?`, rotuloDoCampo: 'Motivo', rotuloDaAcao: 'Voltar' },
}

// A janela de avanço: o título diz qual etapa se resolve e qual vem a seguir; o botão repete a próxima.
const JANELA_DO_AVANCO: Record<PedidoDeAvanco['acao'], {
  titulo: (nome: string, proxima: string) => string; rotuloDaAcao: (proxima: string) => string
}> = {
  concluir: { titulo: (nome, proxima) => `Concluir ${nome} e iniciar ${proxima}`, rotuloDaAcao: (proxima) => `Concluir e iniciar ${proxima}` },
  dispensar: { titulo: (nome, proxima) => `Dispensar ${nome} e iniciar ${proxima}`, rotuloDaAcao: (proxima) => `Dispensar e iniciar ${proxima}` },
  realizada: {
    titulo: (nome, proxima) => `Registrar ${nome} como realizada anteriormente e iniciar ${proxima}`,
    rotuloDaAcao: (proxima) => `Registrar e iniciar ${proxima}`,
  },
}

type CaminhoDeEtapasProps = {
  processos: ModuloDeProcessos
  /** Do setor ou do processo (só esta traz o responsável). */
  etapas: EtapaDoCaminho[]
  podeAlterar: boolean
  /** Quem pode ser responsável; sem a lista, não há seletor de responsável. */
  usuarios?: UsuarioResponsavel[]
  /** Quem está na tela: a janela de avanço o marca quando a próxima etapa não tem responsável. */
  usuarioId: string
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
export function CaminhoDeEtapas({ processos, etapas, podeAlterar, usuarios, usuarioId, aoMudar, aoSumir }: CaminhoDeEtapasProps) {
  const {
    falha, pedido, avanco, agir, gravarComTexto, gravarComAvanco, mudarResponsavel, fecharPedido, fecharAvanco,
  } = useAcoesDaEtapa(processos, aoMudar, aoSumir)
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
            acoes={podeAlterar ? acoesDaEtapa(etapas, indice) : []} aoAgir={(acao) => agir(acao, etapa, proximaPendente(etapas, indice))}
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
      {avanco && (
        <JanelaDoAvancoDaEtapa avanco={avanco} usuarios={usuarios} usuarioId={usuarioId} aoConfirmar={gravarComAvanco}
          aoFechar={fecharAvanco} />
      )}
    </>
  )
}

type JanelaDoAvancoDaEtapaProps = {
  avanco: PedidoDeAvanco
  usuarios?: UsuarioResponsavel[]
  usuarioId: string
  aoConfirmar: (nota: string, responsavelId: string | null) => void
  aoFechar: () => void
}

// Sem a lista de usuários (ainda não lida, ou a leitura falhou), a janela só oferece "Ninguém por enquanto".
function JanelaDoAvancoDaEtapa({ avanco, usuarios = [], usuarioId, aoConfirmar, aoFechar }: JanelaDoAvancoDaEtapaProps) {
  const { acao, etapa, proxima } = avanco
  return (
    <JanelaDeAvanco key={etapa.id} titulo={JANELA_DO_AVANCO[acao].titulo(etapa.nome, proxima.nome)}
      rotuloDaAcao={JANELA_DO_AVANCO[acao].rotuloDaAcao(proxima.nome)} comNota={acao !== 'concluir'} usuarios={usuarios}
      marcadoAoAbrir={responsavelMarcado(proxima, usuarioId, usuarios)} aoConfirmar={aoConfirmar} aoFechar={aoFechar} />
  )
}
