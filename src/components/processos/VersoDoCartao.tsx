import './Painel.css'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { type EstadoDoCarregamento, useCarregamento } from '../../hooks/useCarregamento'
import { type Executar, useGravacaoComFalha } from '../../hooks/useGravacaoComFalha'
import { useRegistrosDoProcesso } from '../../hooks/useRegistrosDoProcesso'
import { type SaidaComAnotacoes, useSaidaComAnotacoes } from '../../hooks/useSaidaComAnotacoes'
import type { DadosDoProcesso, ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import type { ModuloDeRevisoes } from '../../revisoes/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { ItemInexistente } from '../cadastros/ItemInexistente'
import { SecaoDeVersoes } from '../versoes/SecaoDeVersoes'
import { AcoesDoProcesso } from './AcoesDoProcesso'
import { BlocoDasAnotacoes } from './BlocoDasAnotacoes'
import { BotaoFecharJanela, CabecalhoDoVerso } from './CabecalhoDoVerso'
import { ConfirmarSaidaSemSalvar } from './ConfirmarSaidaSemSalvar'
import { CabecalhoDoFormulario } from './CabecalhoDoFormulario'
import { CaminhoDoProcesso } from './CaminhoDoProcesso'
import { EstruturaDoProcesso } from './EstruturaDoProcesso'
import { FormularioDoProcesso } from './FormularioDoProcesso'
import { HistoricoDoProcesso } from './HistoricoDoProcesso'
import { JanelaDoVerso } from './JanelaDoVerso'
import { DataDaModelagemPiloto } from './DataDaModelagemPiloto'
import { SobreDoProcesso } from './SobreDoProcesso'
import { VersoCarregando } from './VersoCarregando'

type VersoDoCartaoProps = {
  processos: ModuloDeProcessos
  cadastros: ModuloDeCadastros
  versoes: ModuloDeVersoes
  revisoes: ModuloDeRevisoes
  id: string
  podeAlterar: boolean
  /** Quem está na tela. */
  usuarioId: string
  aoFechar: () => void
  /** O processo mudou ou foi excluído: o Quadro ou a Lista atrás precisam recarregar. */
  aoMudar: () => void
  /** O endereço de outro processo (pai ou subprocesso), aberto na mesma janela. */
  enderecoDoProcesso: (id: string) => string
  /** Uma confirmação logo abaixo do cabeçalho ("Processo cadastrado"). */
  aviso?: string
}

const TEXTO_DE_PROCESSO_INEXISTENTE = 'Este processo não existe mais. Ele pode ter sido excluído; veja o Histórico.'

/** O verso do cartão: a janela central com o processo inteiro (spec, "Verso do cartão"). Esc fecha. */
export function VersoDoCartao(props: VersoDoCartaoProps) {
  const { processos, id, aoFechar, aoMudar } = props
  const ler = useCallback(() => processos.lerProcesso(id), [processos, id])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const [sumiu, setSumiu] = useState<string | null>(null)
  const saida = useSaidaComAnotacoes()
  const [aberto, setAberto] = useState<{ id: string; modo: ModoDoVerso }>({ id, modo: 'verso' })
  // Trocar de processo (pai, subprocesso) volta ao verso: o modo guarda de quem ele é.
  const modo = aberto.id === id ? aberto.modo : 'verso'
  const aoMudarModo = (novo: ModoDoVerso) => setAberto({ id, modo: novo })
  const aoSumir = () => {
    setSumiu(id)
    aoMudar()
  }
  const atual = estadoDoVerso(estado, id, sumiu)
  const rotulo = atual.tipo === 'pronto' && atual.valor ? `Processo ${atual.valor.nome}` : 'Processo'
  // Fechar (botão, Esc) com anotações sem gravar grava na hora e, se não der, pergunta antes de sair.
  const fechar = () => saida.sair(aoFechar)
  return (
    <JanelaDoVerso rotulo={rotulo} aoFechar={fechar} aoCancelar={modo === 'verso' ? fechar : () => aoMudarModo('verso')}
      estreita={atual.tipo === 'pronto' && modo === 'editar'}>
      <ConteudoDoVerso {...props} aoFechar={fechar} saida={saida} modo={modo} aoMudarModo={aoMudarModo} estado={atual} aoTentarDeNovo={tentarDeNovo} aoAtualizar={recarregar} aoSumir={aoSumir} />
      <ConfirmarSaidaSemSalvar aberta={saida.seguir !== null} aoSair={() => saida.seguir?.()} aoContinuar={saida.desistir} />
    </JanelaDoVerso>
  )
}

// Pai e subprocesso abrem na mesma janela: até o outro processo chegar, mostra o carregando, e não o anterior.
function estadoDoVerso(
  estado: EstadoDoCarregamento<ProcessoLido | null>, id: string, sumiu: string | null,
): EstadoDoCarregamento<ProcessoLido | null> {
  if (sumiu === id) return { tipo: 'pronto', valor: null }
  if (estado.tipo === 'pronto' && estado.valor && estado.valor.id !== id) return { tipo: 'carregando' }
  return estado
}

type ConteudoProps = VersoDoCartaoProps & {
  saida: SaidaComAnotacoes
  modo: ModoDoVerso
  aoMudarModo: (modo: ModoDoVerso) => void
  estado: EstadoDoCarregamento<ProcessoLido | null>
  aoTentarDeNovo: () => void
  aoAtualizar: () => void
  aoSumir: () => void
}

function ConteudoDoVerso({ estado, aoTentarDeNovo, aoAtualizar, aoSumir, ...verso }: ConteudoProps) {
  const { aoFechar } = verso
  if (estado.tipo === 'carregando') return <VersoCarregando aoFechar={aoFechar} />
  if (estado.tipo === 'erro') {
    return <SemProcesso aoFechar={aoFechar}><ErroAoCarregar alvo="o processo" aoTentarDeNovo={aoTentarDeNovo} /></SemProcesso>
  }
  if (estado.valor === null) {
    return (
      <SemProcesso aoFechar={aoFechar}>
        <ItemInexistente aoVoltar={aoFechar} texto={TEXTO_DE_PROCESSO_INEXISTENTE} rotuloDoBotao="Voltar" />
      </SemProcesso>
    )
  }
  return <ProcessoAberto processo={estado.valor} aoAtualizar={aoAtualizar} aoSumir={aoSumir} {...verso} />
}

function SemProcesso({ aoFechar, children }: { aoFechar: () => void; children: ReactNode }) {
  return (
    <>
      <div className="verso-barra"><BotaoFecharJanela aoFechar={aoFechar} /></div>
      <div className="verso-mensagem">{children}</div>
    </>
  )
}

/** Verso, Histórico ou Editar: os dois últimos trocam o conteúdo da janela, sem endereço próprio (spec, "Navegação"). */
type ModoDoVerso = 'verso' | 'historico' | 'editar'

type ProcessoAbertoProps = VersoDoCartaoProps & {
  saida: SaidaComAnotacoes; processo: ProcessoLido; modo: ModoDoVerso; aoMudarModo: (modo: ModoDoVerso) => void; aoAtualizar: () => void; aoSumir: () => void
}

function ProcessoAberto(props: ProcessoAbertoProps) {
  const { processo, processos, podeAlterar, aoFechar, aoMudar, aoAtualizar, aoSumir, modo, aoMudarModo } = props
  const titulo = useRef<HTMLHeadingElement>(null)
  const { falha, executar } = useGravacaoComFalha(aoSumir)
  // O foco vai ao nome ao abrir, ao trocar de processo (pai, subprocesso) e ao trocar de modo, que some com o botão usado.
  // Sem rolar: o nome está no cabeçalho fixo, e o navegador rolava a janela para baixo ao focá-lo.
  useEffect(() => titulo.current?.focus({ preventScroll: true }), [processo.id, modo])
  const aposMudar = () => {
    aoAtualizar()
    aoMudar()
  }
  const aposExcluir = () => {
    aoMudar()
    aoFechar()
  }
  const acoes = (
    <AcoesDoProcesso processo={processo} processos={processos} podeAlterar={podeAlterar && !processo.arquivadoEm} executar={executar}
      aoAbrirHistorico={() => props.saida.sair(() => aoMudarModo('historico'))}
      aoEditar={() => props.saida.sair(() => aoMudarModo('editar'))} aoExcluir={aposExcluir}
      aoMudar={aposMudar} />
  )
  return (
    <>
      {modo === 'editar'
        ? <CabecalhoDoFormulario titulo={`Editar ${processo.nome}`} referencia={titulo} aoFechar={aoFechar} />
        : <CabecalhoDoVerso processo={processo} titulo={titulo} acoes={acoes} aoFechar={aoFechar} />}
      {props.aviso && modo === 'verso' && <p className="verso-aviso" role="status">{props.aviso}</p>}
      {falha && <p className="cadastros-falha verso-falha" role="alert">{falha}</p>}
      <CorpoDoVerso {...props} executar={executar} aoVoltar={() => aoMudarModo('verso')} aposMudar={aposMudar} />
    </>
  )
}

type CorpoProps = ProcessoAbertoProps & { executar: Executar; aoVoltar: () => void; aposMudar: () => void }

function CorpoDoVerso(props: CorpoProps) {
  const { modo, processos, processo, aoVoltar } = props
  if (modo === 'historico') {
    return (
      <div className="verso-pagina">
        <BotaoVoltarAoProcesso aoVoltar={aoVoltar} />
        <h3 className="verso-pagina-titulo">Histórico</h3>
        <HistoricoDoProcesso processos={processos} id={processo.id} />
      </div>
    )
  }
  if (modo === 'editar') return <EdicaoDoProcesso {...props} />
  return <ColunasDoVerso {...props} />
}

function BotaoVoltarAoProcesso({ aoVoltar }: { aoVoltar: () => void }) {
  return <button type="button" className="botao botao-secundario verso-voltar" onClick={aoVoltar}>← Voltar ao processo</button>
}

// Salvar volta ao verso, já atualizado, e o Quadro recarrega; o processo excluído por outra pessoa vira o aviso.
function EdicaoDoProcesso({ processo, processos, cadastros, aoVoltar, aposMudar, aoSumir }: CorpoProps) {
  async function salvar(dados: DadosDoProcesso) {
    try {
      await processos.editarProcesso(processo.id, dados)
    } catch (erro) {
      if (erro instanceof CadastroInexistente) return aoSumir()
      throw erro
    }
    aoVoltar()
    aposMudar()
  }
  return (
    <div className="verso-pagina verso-pagina-estreita">
      <FormularioDoProcesso cadastros={cadastros} processos={processos} titulo="Editar processo" inicial={processo}
        aoSalvar={salvar} aoCancelar={aoVoltar} />
    </div>
  )
}

/** Trabalho à esquerda (etapas e arquivos), contexto à direita (Data da modelagem piloto, dados e estrutura). */
function ColunasDoVerso(props: CorpoProps) {
  const { processo, processos, versoes, revisoes, podeAlterar, usuarioId, executar, aposMudar, aoSumir, enderecoDoProcesso } = props
  // O arquivado não aceita alteração além das do Agora (Desarquivar, Registrar publicação), que recebe o perfil inteiro.
  const alteravel = podeAlterar && !processo.arquivadoEm
  const registros = useRegistrosDoProcesso(revisoes, processo.id, processo.etapaAtual?.id)
  // A versão aprovada ganha o selo "Aprovada": registrar ou trocar a aprovação refaz a leitura das versões.
  const versaoAprovada = registros.aprovacao.tipo === 'pronto' ? registros.aprovacao.valor?.versao ?? 0 : 0
  return (
    <div className="verso-colunas">
      <div className="verso-trabalho">
        <CaminhoDoProcesso processo={processo} processos={processos} versoes={versoes} revisoes={revisoes} registros={registros} podeAlterar={podeAlterar} usuarioId={usuarioId}
          executar={executar} aoSumir={aoSumir} aoMudar={aposMudar} />
        <SecaoDeVersoes key={versaoAprovada} versoes={versoes} processo={processo} podeAlterar={alteravel} aoAlterarVersoes={aposMudar} />
      </div>
      <div className="verso-contexto">
        <BlocoDasAnotacoes key={processo.id} processo={processo} processos={processos} podeEscrever={alteravel}
          guardaRef={props.saida.guarda} aoSumir={aoSumir} />
        <DataDaModelagemPiloto processo={processo} processos={processos} podeAlterar={alteravel} aoMudar={aposMudar}
          aoSumir={aoSumir} />
        <SobreDoProcesso processo={processo} />
        <EstruturaDoProcesso processo={processo} enderecoDoProcesso={enderecoDoProcesso}
          aoAbrir={(endereco) => props.saida.sair(() => { window.location.hash = endereco })} />
      </div>
    </div>
  )
}
