import '../JanelaDeConfirmacao.css'
import './Painel.css'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import { paisPossiveis } from '../../processos/paisPossiveis'
import { ROTULO_DO_TIPO } from '../../processos/rotulos'
import type { ModuloDeProcessos, ProcessoDaLista, ProcessoLido, Reclassificacao, TipoDeProcesso } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'

type TipoNovo = Reclassificacao['tipo']
type Escolha = { tipo: TipoNovo; paiId: string; motivo: string }

// As mudanças de tipo da spec (Regras de estado, Reclassificação); o banco recusa as outras.
const DESTINOS: Record<TipoDeProcesso, TipoNovo[]> = {
  a_classificar: ['processo', 'subprocesso'], processo: ['subprocesso'], subprocesso: ['processo'],
}

type JanelaDeReclassificacaoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  /** O motivo chega sem espaços nas pontas. */
  aoConfirmar: (reclassificacao: Reclassificacao, motivo: string) => void
  aoFechar: () => void
}

// A mesma janela nativa da JanelaComCampo (ADR 0003), com o novo tipo e o pai: abre ao montar, o foco vai ao primeiro
// campo, o botão só se habilita com motivo (e pai, no subprocesso) e Esc fecha sem gravar. Quem a monta a desmonta ao
// fechar, e a escolha recomeça na próxima vez.
export function JanelaDeReclassificacao({ processo, processos, aoConfirmar, aoFechar }: JanelaDeReclassificacaoProps) {
  const janela = useRef<HTMLDialogElement>(null)
  const idDoTitulo = useId()
  const [escolha, setEscolha] = useState<Escolha>({ tipo: DESTINOS[processo.tipo][0], paiId: '', motivo: '' })
  useEffect(() => janela.current?.showModal(), [])
  const mudar = (mudanca: Partial<Escolha>) => setEscolha((atual) => ({ ...atual, ...mudanca }))
  const confirmar = (pai: ProcessoDaLista | undefined) => {
    aoFechar()
    aoConfirmar({ tipo: escolha.tipo, processoPaiId: pai?.id ?? null }, escolha.motivo.trim())
  }
  return (
    <dialog ref={janela} className="janela-confirmacao janela-reclassificacao" aria-labelledby={idDoTitulo} onClose={aoFechar}>
      <h3 id={idDoTitulo} className="janela-confirmacao-titulo">{`Reclassificar o processo ${processo.nome}?`}</h3>
      <CamposDaReclassificacao processo={processo} processos={processos} escolha={escolha} aoMudar={mudar}
        aoConfirmar={confirmar} aoFechar={aoFechar} />
    </dialog>
  )
}

type CamposProps = Omit<JanelaDeReclassificacaoProps, 'aoConfirmar'> & {
  escolha: Escolha
  aoMudar: (mudanca: Partial<Escolha>) => void
  aoConfirmar: (pai: ProcessoDaLista | undefined) => void
}

function CamposDaReclassificacao({ processo, processos, escolha, aoMudar, aoConfirmar, aoFechar }: CamposProps) {
  const id = useId()
  const { pais, erro, tentarDeNovo } = usePaisPossiveis(processos, processo.id)
  const pai = escolha.tipo === 'subprocesso' ? pais.find((outro) => outro.id === escolha.paiId) : undefined
  const pronta = escolha.motivo.trim() !== '' && (escolha.tipo === 'processo' || pai !== undefined)
  return (
    <>
      <label htmlFor={`${id}-tipo`}>Novo tipo</label>
      <select id={`${id}-tipo`} className="janela-campo" value={escolha.tipo}
        onChange={(evento) => aoMudar({ tipo: evento.target.value as TipoNovo })}>
        {DESTINOS[processo.tipo].map((tipo) => <option key={tipo} value={tipo}>{ROTULO_DO_TIPO[tipo]}</option>)}
      </select>
      {escolha.tipo === 'subprocesso' && <CampoDoPai id={id} valor={escolha.paiId} pais={pais} aoMudar={aoMudar} />}
      {escolha.tipo === 'subprocesso' && erro && <ErroAoCarregar alvo="os processos" aoTentarDeNovo={tentarDeNovo} />}
      {pai && pai.macroprocessoId !== processo.macroprocessoId && (
        <p className="processo-aviso" role="status">
          O item passa do macroprocesso {processo.macroprocessoNome} para {pai.macroprocessoNome}, o do processo pai.
        </p>
      )}
      <label htmlFor={`${id}-motivo`}>Motivo</label>
      <textarea id={`${id}-motivo`} className="janela-campo" rows={3} maxLength={2000} value={escolha.motivo}
        onChange={(evento) => aoMudar({ motivo: evento.target.value })} />
      <div className="janela-confirmacao-botoes">
        <button type="button" className="botao botao-principal" disabled={!pronta} onClick={() => aoConfirmar(pai)}>
          Reclassificar
        </button>
        <button type="button" className="botao botao-secundario" onClick={aoFechar}>Cancelar</button>
      </div>
    </>
  )
}

type CampoDoPaiProps = { id: string; valor: string; pais: ProcessoDaLista[]; aoMudar: CamposProps['aoMudar'] }

function CampoDoPai({ id, valor, pais, aoMudar }: CampoDoPaiProps) {
  return (
    <>
      <label htmlFor={`${id}-pai`}>Processo pai</label>
      <select id={`${id}-pai`} className="janela-campo" value={valor} onChange={(evento) => aoMudar({ paiId: evento.target.value })}>
        <option value="">Escolha o processo pai</option>
        {pais.map((outro) => <option key={outro.id} value={outro.id}>{outro.setorSigla} — {outro.nome}</option>)}
      </select>
    </>
  )
}

// Os pais possíveis, lidos ao abrir a janela: a lista pode ter mudado desde que o painel abriu.
function usePaisPossiveis(processos: ModuloDeProcessos, idDoProprio: string) {
  const listar = useCallback(
    async () => paisPossiveis((await processos.listarProcessos()).processos, idDoProprio), [processos, idDoProprio])
  const { estado, tentarDeNovo } = useCarregamento(listar)
  return { pais: estado.tipo === 'pronto' ? estado.valor : [], erro: estado.tipo === 'erro', tentarDeNovo }
}
