import './Anotacoes.css'
import { type MutableRefObject, type ReactNode, useCallback, useEffect, useId, useLayoutEffect, useRef } from 'react'
import { useAnotacoesDoProcesso } from '../../hooks/useAnotacoesDoProcesso'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { GuardaDasAnotacoes } from '../../hooks/useSaidaComAnotacoes'
import { LIMITE_DAS_ANOTACOES, contagemDasAnotacoes, linhaDaUltimaAlteracao } from '../../processos/anotacoes'
import type { EstadoDaGravacao, GravadorDeAnotacoes } from '../../processos/GravadorDeAnotacoes'
import type { AnotacoesLidas, ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'

type BlocoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  /** Perfil que altera e processo não arquivado; senão, o bloco só mostra o texto. */
  podeEscrever: boolean
  guardaRef: MutableRefObject<GuardaDasAnotacoes | null>
  aoSumir: () => void
}

const SEM_ANOTACOES: AnotacoesLidas = { texto: null, alteradoPor: null, alteradoEm: null }

/** "Anotações" na coluna direita do verso: texto livre do processo, sem histórico (ADR 0021; spec, "Verso do cartão"). */
export function BlocoDasAnotacoes({ processo, processos, podeEscrever, guardaRef, aoSumir }: BlocoProps) {
  const idDoTitulo = useId()
  const ler = useCallback(() => processos.lerAnotacoes(processo.id), [processos, processo.id])
  const { estado, tentarDeNovo } = useCarregamento(ler)
  return (
    <section className="contexto-secao" aria-labelledby={idDoTitulo}>
      {estado.tipo === 'pronto'
        ? (
            podeEscrever
              ? <EditorDasAnotacoes idDoTitulo={idDoTitulo} inicial={estado.valor ?? SEM_ANOTACOES} processos={processos}
                  id={processo.id} guardaRef={guardaRef} aoSumir={aoSumir} />
              : <LeituraDasAnotacoes idDoTitulo={idDoTitulo} lidas={estado.valor ?? SEM_ANOTACOES} />
          )
        : (
            <>
              <CabecalhoDasAnotacoes idDoTitulo={idDoTitulo} />
              {estado.tipo === 'erro'
                ? <ErroAoCarregar alvo="as anotações" aoTentarDeNovo={tentarDeNovo} />
                : <p className="anotacoes-vazio" role="status">Carregando as anotações…</p>}
            </>
          )}
    </section>
  )
}

function CabecalhoDasAnotacoes({ idDoTitulo, children }: { idDoTitulo: string; children?: ReactNode }) {
  return (
    <div className="anotacoes-cabecalho">
      <h3 id={idDoTitulo} className="contexto-titulo">Anotações</h3>
      {children}
    </div>
  )
}

function LeituraDasAnotacoes({ idDoTitulo, lidas }: { idDoTitulo: string; lidas: AnotacoesLidas }) {
  return (
    <>
      <CabecalhoDasAnotacoes idDoTitulo={idDoTitulo} />
      {lidas.texto ? <p className="anotacoes-texto">{lidas.texto}</p> : <p className="anotacoes-vazio">Sem anotações.</p>}
      <QuemAlterouAsAnotacoes lidas={lidas} />
    </>
  )
}

function QuemAlterouAsAnotacoes({ lidas }: { lidas: AnotacoesLidas }) {
  const linha = linhaDaUltimaAlteracao(lidas.alteradoPor, lidas.alteradoEm)
  return linha && <p className="anotacoes-autor">{linha}</p>
}

type EditorProps = {
  idDoTitulo: string; inicial: AnotacoesLidas; processos: ModuloDeProcessos; id: string
  guardaRef: MutableRefObject<GuardaDasAnotacoes | null>; aoSumir: () => void
}

function EditorDasAnotacoes({ idDoTitulo, inicial, processos, id, guardaRef, aoSumir }: EditorProps) {
  const gravador = useAnotacoesDoProcesso(processos, id, inicial, aoSumir)
  useEffect(() => {
    guardaRef.current = gravador
    return () => {
      guardaRef.current = null
    }
  }, [gravador, guardaRef])
  const campo = useCampoQueCresce(gravador.digitado)
  const contagem = contagemDasAnotacoes(gravador.digitado)
  // O botão some quando o conflito se resolve: o foco volta ao campo, para o teclado não cair no fim da página.
  const verTextoAtual = () => void gravador.verTextoAtual().then(() => campo.current?.focus())
  return (
    <>
      <CabecalhoDasAnotacoes idDoTitulo={idDoTitulo}><EstadoDasAnotacoes estado={gravador.estado} /></CabecalhoDasAnotacoes>
      <textarea ref={campo} className="anotacoes-campo" aria-labelledby={idDoTitulo} maxLength={LIMITE_DAS_ANOTACOES}
        placeholder="Escreva aqui as anotações do processo" value={gravador.digitado}
        onChange={(mudanca) => gravador.digitar(mudanca.target.value)} onBlur={() => void gravador.sairDoCampo()} />
      {contagem && <p className="anotacoes-contagem">{contagem}</p>}
      <AvisoDeConflito gravador={gravador} aoVerTextoAtual={verTextoAtual} />
      <QuemAlterouAsAnotacoes lidas={gravador.lidas} />
    </>
  )
}

const TEXTO_DO_ESTADO: Record<EstadoDaGravacao, string> = { ocioso: '', salvando: 'Salvando…', salvo: 'Salvo', falha: '', conflito: '' }

// "Salvando…" e "Salvo" ficam numa região de status que nunca sai da tela (uma região que nasce já com texto não é
// anunciada por vários leitores); o leitor a anuncia sem tirar o foco. A falha é um alerta à parte, anunciado ao aparecer.
function EstadoDasAnotacoes({ estado }: { estado: EstadoDaGravacao }) {
  return (
    <>
      <span role="status" className="anotacoes-estado">{TEXTO_DO_ESTADO[estado]}</span>
      {estado === 'falha' && <span role="alert" className="anotacoes-falha">Não foi possível salvar. Seu texto continua aqui</span>}
    </>
  )
}

type AvisoDeConflitoProps = { gravador: GravadorDeAnotacoes; aoVerTextoAtual: () => void }

function AvisoDeConflito({ gravador, aoVerTextoAtual }: AvisoDeConflitoProps) {
  if (gravador.estado !== 'conflito') return null
  return (
    <div className="anotacoes-conflito" role="alert">
      <p>Outra pessoa alterou as anotações enquanto você escrevia</p>
      <button type="button" className="botao botao-secundario" onClick={aoVerTextoAtual}>Ver o texto atual</button>
    </div>
  )
}

// O campo cresce com o texto; a altura máxima e a rolagem por dentro são do CSS.
function useCampoQueCresce(texto: string) {
  const campo = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const elemento = campo.current
    if (!elemento) return
    elemento.style.height = 'auto'
    elemento.style.height = `${elemento.scrollHeight}px`
  }, [texto])
  return campo
}
