import type { AcoesDaEtapaEmUso } from '../../hooks/useAcoesDaEtapa'
import { responsavelMarcado, usuariosParaAEtapa } from '../../processos/caminhoDeEtapas'
import { fraseDoBloqueioDaConclusao } from '../../processos/frasesDaVersaoCompleta'
import type { PedidoDeAvanco, PedidoDeTexto } from '../../processos/gravarAcoes'
import type { EtapaDoCaminho, UltimaVersao, UsuarioResponsavel } from '../../processos/tipos'
import { voltaDesfazAprovacao } from '../../revisoes/conferirAprovacao'
import { fraseDoAvisoDaVolta } from '../../revisoes/frasesDeAprovacao'
import { opcoesDaRevisao } from '../../revisoes/opcoesDaRevisao'
import type { Aprovacao, DadosDaAprovacao, DadosDaRevisao } from '../../revisoes/tipos'
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
  /** A aprovação do processo e as etapas dele: a janela de voltar avisa quando a volta a desfaz. Sem elas (o Quadro), sem aviso. */
  aprovacao?: Aprovacao | null
  etapasDoProcesso?: EtapaDoCaminho[]
}

/** As janelas das ações da etapa: a da nota (Dispensar e Realizada anteriormente sem pendente depois) e a de avanço. */
export function JanelasDaEtapa({ acoes, usuarios, usuarioId, ultimaVersao, aprovacao, etapasDoProcesso }: JanelasDaEtapaProps) {
  const { pedido, avanco, gravarComTexto, gravarComAvanco, gravarRevisaoDaEtapa, gravarAprovacaoDaEtapa, fecharPedido, fecharAvanco } = acoes
  const janela = pedido ? JANELA_DO_TEXTO[pedido.acao] : null
  return (
    <>
      <JanelaComCampo aberta={pedido !== null} titulo={janela && pedido ? janela.titulo(pedido.etapa.nome) : ''}
        rotuloDoCampo={janela?.rotuloDoCampo ?? ''} rotuloDaAcao={janela?.rotuloDaAcao ?? ''}
        aoConfirmar={gravarComTexto} aoFechar={fecharPedido} />
      {avanco && (
        <JanelaDoAvancoDaEtapa avanco={avanco} usuarios={usuarios} usuarioId={usuarioId} ultimaVersao={ultimaVersao}
          aviso={avisoDaVolta(avanco, aprovacao, etapasDoProcesso)}
          aoConfirmar={gravarComAvanco} aoConfirmarRevisao={gravarRevisaoDaEtapa} aoConfirmarAprovacao={gravarAprovacaoDaEtapa}
          aoFechar={fecharAvanco} />
      )}
    </>
  )
}

type JanelaDoAvancoDaEtapaProps = {
  avanco: PedidoDeAvanco
  aviso: string | null
  usuarios?: UsuarioResponsavel[]
  usuarioId: string
  ultimaVersao: UltimaVersao | null
  aoConfirmar: (nota: string, responsavelId: string | null) => void
  aoConfirmarRevisao: (dados: DadosDaRevisao, responsavelId: string | null) => Promise<string | null>
  aoConfirmarAprovacao: (dados: DadosDaAprovacao, responsavelId: string | null) => Promise<string | null>
  aoFechar: () => void
}

// Sem etapa pendente depois (só a Aprovação chega aqui assim) não há "iniciar" nem escolha de responsável.
function textosDoAvanco({ acao, etapa, proxima }: PedidoDeAvanco) {
  const textos = JANELA_DO_AVANCO[acao]
  if (proxima === null) return { titulo: `Concluir ${etapa.nome}`, rotuloDaAcao: 'Concluir', pergunta: null }
  return { titulo: textos.titulo(etapa.nome, proxima.nome), rotuloDaAcao: textos.rotuloDaAcao(proxima.nome), pergunta: textos.pergunta }
}

// Voltar para a Aprovação ou antes dela desfaz a aprovação: a janela avisa antes de confirmar.
function avisoDaVolta({ acao, etapa }: PedidoDeAvanco, aprovacao: Aprovacao | null | undefined, etapas: EtapaDoCaminho[] | undefined): string | null {
  if (acao !== 'voltar' || !aprovacao || !voltaDesfazAprovacao(etapas ?? [], etapa.codigo)) return null
  return fraseDoAvisoDaVolta(aprovacao.versao)
}

// O banco só deixa concluir a Revisão pelo setor e a Aprovação com a versão mais recente completa; a janela já diz o que falta.
function bloqueioDaConclusao({ acao, etapa }: PedidoDeAvanco, ultimaVersao: UltimaVersao | null): string | null {
  const confere = acao === 'concluir' && (etapa.codigo === 'revisao_setor' || etapa.codigo === 'aprovacao_setor')
  return confere ? fraseDoBloqueioDaConclusao(ultimaVersao) : null
}

// Sem a lista de usuários (ainda não lida, ou a leitura falhou), a janela só oferece "Ninguém por enquanto". A lista já
// vem sem o autor da versão mais recente quando a etapa que ganha o responsável é a Revisão interna.
function JanelaDoAvancoDaEtapa({
  avanco, aviso, usuarios = [], usuarioId, ultimaVersao, aoConfirmar, aoConfirmarRevisao, aoConfirmarAprovacao, aoFechar,
}: JanelaDoAvancoDaEtapaProps) {
  const { acao, etapa, proxima } = avanco
  const possiveis = proxima ? usuariosParaAEtapa(proxima, usuarios, ultimaVersao) : []
  const textos = textosDoAvanco(avanco)
  // Concluir a Revisão interna pede o resultado da revisão e grava a revisão junto da conclusão (quem conclui é o revisor).
  const revisao = acao === 'concluir' && etapa.codigo === 'revisao_interna'
    ? { opcoes: opcoesDaRevisao(ultimaVersao, usuarioId), aoConfirmar: aoConfirmarRevisao } : undefined
  // Concluir a Aprovação mostra a versão aprovada e pede o E-protocolo (opcional), gravando a aprovação junto da conclusão.
  const aprovacao = acao === 'concluir' && etapa.codigo === 'aprovacao_setor'
    ? { versao: ultimaVersao?.numero ?? 0, aoConfirmar: aoConfirmarAprovacao } : undefined
  return (
    <JanelaDeAvanco key={etapa.id} titulo={textos.titulo} rotuloDaAcao={textos.rotuloDaAcao} comNota={acao !== 'concluir'}
      rotuloDoCampo={JANELA_DO_AVANCO[acao].rotuloDoCampo} pergunta={textos.pergunta} usuarios={possiveis}
      marcadoAoAbrir={proxima ? responsavelMarcado(proxima, usuarioId, possiveis) : null}
      bloqueio={bloqueioDaConclusao(avanco, ultimaVersao)} aviso={aviso} revisao={revisao} aprovacao={aprovacao}
      aoConfirmar={aoConfirmar} aoFechar={aoFechar} />
  )
}
