import type { AcoesDaEtapaEmUso } from '../../hooks/useAcoesDaEtapa'
import { responsavelMarcado, usuariosParaAEtapa } from '../../processos/caminhoDeEtapas'
import { fraseDoBloqueioDaConclusao } from '../../processos/frasesDaVersaoCompleta'
import type { PedidoDeAvanco, PedidoDeTexto } from '../../processos/gravarAcoes'
import type { UltimaVersao, UsuarioResponsavel } from '../../processos/tipos'
import { JanelaComCampo } from '../JanelaComCampo'
import { JanelaDeAvanco } from './JanelaDeAvanco'

const JANELA_DO_TEXTO: Record<PedidoDeTexto['acao'], {
  titulo: (nome: string) => string; rotuloDoCampo: string; rotuloDaAcao: string
}> = {
  dispensar: { titulo: (nome) => `Dispensar a etapa ${nome}?`, rotuloDoCampo: 'Nota', rotuloDaAcao: 'Dispensar' },
  realizada: {
    titulo: (nome) => `Registrar a etapa ${nome} como realizada anteriormente?`, rotuloDoCampo: 'Nota', rotuloDaAcao: 'Registrar',
  },
}

const PERGUNTA_DA_PROXIMA = 'Quem fica com a próxima etapa?'

// A janela de avanço: o título diz qual etapa se resolve e qual vem a seguir; o botão repete a próxima. Voltar usa a mesma
// janela, com o motivo e a pergunta sobre a própria etapa reaberta.
const JANELA_DO_AVANCO: Record<PedidoDeAvanco['acao'], {
  titulo: (nome: string, proxima: string) => string; rotuloDaAcao: (proxima: string) => string
  rotuloDoCampo: string; pergunta: string
}> = {
  concluir: {
    titulo: (nome, proxima) => `Concluir ${nome} e iniciar ${proxima}`, rotuloDaAcao: (proxima) => `Concluir e iniciar ${proxima}`,
    rotuloDoCampo: 'Nota', pergunta: PERGUNTA_DA_PROXIMA,
  },
  dispensar: {
    titulo: (nome, proxima) => `Dispensar ${nome} e iniciar ${proxima}`, rotuloDaAcao: (proxima) => `Dispensar e iniciar ${proxima}`,
    rotuloDoCampo: 'Nota', pergunta: PERGUNTA_DA_PROXIMA,
  },
  realizada: {
    titulo: (nome, proxima) => `Registrar ${nome} como realizada anteriormente e iniciar ${proxima}`,
    rotuloDaAcao: (proxima) => `Registrar e iniciar ${proxima}`, rotuloDoCampo: 'Nota', pergunta: PERGUNTA_DA_PROXIMA,
  },
  voltar: {
    titulo: (nome) => `Voltar à etapa ${nome}?`, rotuloDaAcao: () => 'Voltar', rotuloDoCampo: 'Motivo',
    pergunta: 'Quem fica com esta etapa?',
  },
}

type JanelasDaEtapaProps = {
  acoes: AcoesDaEtapaEmUso
  usuarios?: UsuarioResponsavel[]
  /** Quem está na tela: a janela de avanço o marca quando a próxima etapa não tem responsável. */
  usuarioId: string
  /** A versão mais recente não histórica do processo: o autor dela não é escolhido para a Revisão interna. */
  ultimaVersao: UltimaVersao | null
}

/** As janelas das ações da etapa: a da nota (Dispensar e Realizada anteriormente sem pendente depois) e a de avanço. */
export function JanelasDaEtapa({ acoes, usuarios, usuarioId, ultimaVersao }: JanelasDaEtapaProps) {
  const { pedido, avanco, gravarComTexto, gravarComAvanco, fecharPedido, fecharAvanco } = acoes
  const janela = pedido ? JANELA_DO_TEXTO[pedido.acao] : null
  return (
    <>
      <JanelaComCampo aberta={pedido !== null} titulo={janela && pedido ? janela.titulo(pedido.etapa.nome) : ''}
        rotuloDoCampo={janela?.rotuloDoCampo ?? ''} rotuloDaAcao={janela?.rotuloDaAcao ?? ''}
        aoConfirmar={gravarComTexto} aoFechar={fecharPedido} />
      {avanco && (
        <JanelaDoAvancoDaEtapa avanco={avanco} usuarios={usuarios} usuarioId={usuarioId} ultimaVersao={ultimaVersao}
          aoConfirmar={gravarComAvanco} aoFechar={fecharAvanco} />
      )}
    </>
  )
}

type JanelaDoAvancoDaEtapaProps = {
  avanco: PedidoDeAvanco
  usuarios?: UsuarioResponsavel[]
  usuarioId: string
  ultimaVersao: UltimaVersao | null
  aoConfirmar: (nota: string, responsavelId: string | null) => void
  aoFechar: () => void
}

// Sem a lista de usuários (ainda não lida, ou a leitura falhou), a janela só oferece "Ninguém por enquanto". A lista já
// vem sem o autor da versão mais recente quando a etapa que ganha o responsável é a Revisão interna.
function JanelaDoAvancoDaEtapa({ avanco, usuarios = [], usuarioId, ultimaVersao, aoConfirmar, aoFechar }: JanelaDoAvancoDaEtapaProps) {
  const { acao, etapa, proxima } = avanco
  const possiveis = usuariosParaAEtapa(proxima, usuarios, ultimaVersao)
  const textos = JANELA_DO_AVANCO[acao]
  // O banco só deixa concluir a Revisão pelo setor com a versão mais recente completa; a janela já diz o que falta.
  const bloqueio = acao === 'concluir' && etapa.codigo === 'revisao_setor' ? fraseDoBloqueioDaConclusao(ultimaVersao) : null
  return (
    <JanelaDeAvanco key={etapa.id} titulo={textos.titulo(etapa.nome, proxima.nome)}
      rotuloDaAcao={textos.rotuloDaAcao(proxima.nome)} comNota={acao !== 'concluir'} rotuloDoCampo={textos.rotuloDoCampo}
      pergunta={textos.pergunta} usuarios={possiveis} marcadoAoAbrir={responsavelMarcado(proxima, usuarioId, possiveis)}
      bloqueio={bloqueio} aoConfirmar={aoConfirmar} aoFechar={aoFechar} />
  )
}
