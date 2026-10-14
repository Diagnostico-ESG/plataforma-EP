import { type ReactNode, useCallback, useState } from 'react'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { type EstadoDoCarregamento, useCarregamento } from '../../hooks/useCarregamento'
import type { DadosDoProcesso, ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { ItemInexistente } from '../cadastros/ItemInexistente'
import { AcoesDoProcesso } from './AcoesDoProcesso'
import { BotaoFechar, CabecalhoDoPainel } from './CabecalhoDoPainel'
import { CaminhoDoProcesso } from './CaminhoDoProcesso'
import { DadosDoProcesso as DadosLidos } from './DadosDoProcesso'
import { EstruturaDoProcesso } from './EstruturaDoProcesso'
import { fecharComEsc } from './fecharComEsc'
import { FormularioDoProcesso } from './FormularioDoProcesso'
import { HistoricoDoProcesso } from './HistoricoDoProcesso'
import './Painel.css'

type PainelDoProcessoProps = {
  processos: ModuloDeProcessos
  cadastros: ModuloDeCadastros
  id: string
  podeAlterar: boolean
  aoFechar: () => void
  /** O processo mudou ou foi excluído: o Quadro atrás do painel precisa recarregar. */
  aoMudar: () => void
  /** O endereço do painel de outro processo (pai ou subprocesso), por cima da mesma visão. */
  enderecoDoProcesso: (id: string) => string
}

const TEXTO_DE_PROCESSO_INEXISTENTE = 'Este processo não existe mais. Ele pode ter sido excluído; veja o Histórico.'

/** O painel abre à direita, por cima do Quadro; Esc fecha. */
export function PainelDoProcesso(props: PainelDoProcessoProps) {
  const { processos, id, aoFechar, aoMudar } = props
  const ler = useCallback(() => processos.lerProcesso(id), [processos, id])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const [sumiu, setSumiu] = useState(false)
  const aoSumir = () => {
    setSumiu(true)
    aoMudar()
  }
  return (
    <aside className="painel" aria-label="Painel do processo" onKeyDown={fecharComEsc(aoFechar)}>
      <ConteudoDoPainel {...props} estado={sumiu ? { tipo: 'pronto', valor: null } : estado}
        aoTentarDeNovo={tentarDeNovo} aoAtualizar={recarregar} aoSumir={aoSumir} />
    </aside>
  )
}

type ConteudoProps = PainelDoProcessoProps & {
  estado: EstadoDoCarregamento<ProcessoLido | null>
  aoTentarDeNovo: () => void
  aoAtualizar: () => void
  aoSumir: () => void
}

function ConteudoDoPainel({ estado, aoTentarDeNovo, aoAtualizar, aoSumir, ...painel }: ConteudoProps) {
  const { aoFechar } = painel
  if (estado.tipo === 'carregando') return <SemProcesso aoFechar={aoFechar}><p role="status">Carregando processo…</p></SemProcesso>
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
  return <ProcessoAberto processo={estado.valor} aoAtualizar={aoAtualizar} aoSumir={aoSumir} {...painel} />
}

function SemProcesso({ aoFechar, children }: { aoFechar: () => void; children: ReactNode }) {
  return (
    <>
      <div className="painel-barra"><BotaoFechar aoFechar={aoFechar} /></div>
      <div className="painel-corpo">{children}</div>
    </>
  )
}

type Aba = 'detalhes' | 'historico'
type ProcessoAbertoProps = Omit<PainelDoProcessoProps, 'aoFechar'> & {
  processo: ProcessoLido
  aoFechar: () => void
  aoAtualizar: () => void
  aoSumir: () => void
}

function ProcessoAberto(props: ProcessoAbertoProps) {
  const { processo, processos, id, aoFechar } = props
  const [aba, setAba] = useState<Aba>('detalhes')
  return (
    <>
      <CabecalhoDoPainel processo={processo} aoFechar={aoFechar} />
      <div className="painel-abas" role="tablist" aria-label="Seções do processo">
        <BotaoDeAba rotulo="Detalhes" ativa={aba === 'detalhes'} aoEscolher={() => setAba('detalhes')} />
        <BotaoDeAba rotulo="Histórico" ativa={aba === 'historico'} aoEscolher={() => setAba('historico')} />
      </div>
      <div className="painel-corpo" role="tabpanel">
        {aba === 'detalhes' && <DetalhesDoProcesso {...props} />}
        {aba === 'historico' && <HistoricoDoProcesso processos={processos} id={id} />}
      </div>
    </>
  )
}

// Os dados viram o formulário na edição; salvar volta aos dados, já atualizados, e o Quadro recarrega.
function DetalhesDoProcesso(props: ProcessoAbertoProps) {
  const { processo, processos, cadastros, podeAlterar, aoFechar, aoMudar, aoAtualizar, aoSumir, enderecoDoProcesso } = props
  const [editando, setEditando] = useState(false)

  async function salvar(dados: DadosDoProcesso) {
    try {
      await processos.editarProcesso(processo.id, dados)
    } catch (erro) {
      if (erro instanceof CadastroInexistente) return aoSumir()
      throw erro
    }
    setEditando(false)
    aoAtualizar()
    aoMudar()
  }

  function aposExcluir() {
    aoMudar()
    aoFechar()
  }

  const aposMudar = () => {
    aoAtualizar()
    aoMudar()
  }

  return (
    <>
      <CaminhoDoProcesso processo={processo} processos={processos} podeAlterar={podeAlterar} aoSumir={aoSumir}
        aoMudar={aposMudar} />
      {editando
        ? <FormularioDoProcesso cadastros={cadastros} processos={processos} titulo="Editar processo" inicial={processo} aoSalvar={salvar}
            aoCancelar={() => setEditando(false)} />
        : <DadosLidos processo={processo} />}
      <EstruturaDoProcesso processo={processo} enderecoDoProcesso={enderecoDoProcesso} />
      {podeAlterar && !editando && (
        <AcoesDoProcesso processo={processo} processos={processos} aoEditar={() => setEditando(true)}
          aoExcluir={aposExcluir} aoMudar={aposMudar} aoSumir={aoSumir} />
      )}
    </>
  )
}

function BotaoDeAba({ rotulo, ativa, aoEscolher }: { rotulo: string; ativa: boolean; aoEscolher: () => void }) {
  return (
    <button type="button" role="tab" className="painel-aba" aria-selected={ativa} onClick={aoEscolher}>{rotulo}</button>
  )
}
