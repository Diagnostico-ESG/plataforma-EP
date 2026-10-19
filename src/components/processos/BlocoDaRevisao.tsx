import { useId } from 'react'
import type { OpcaoDaRevisao, OpcoesDaRevisao } from '../../revisoes/opcoesDaRevisao'
import type { RascunhoDaRevisao } from '../../revisoes/rascunhoDaRevisao'
import { ROTULO_DO_ESCOPO } from '../../revisoes/frasesDeRevisao'
import type { EscopoDaCorrecao, ResultadoDaRevisao } from '../../revisoes/tipos'

type BlocoDaRevisaoProps = {
  opcoes: OpcoesDaRevisao
  valor: RascunhoDaRevisao
  aoMudar: (valor: RascunhoDaRevisao) => void
}

const ESCOPOS: EscopoDaCorrecao[] = ['fluxograma', 'relatorio', 'ambos']

/**
 * O que a janela de concluir a Revisão interna pede acima da escolha do responsável: o Resultado (com a prévia das
 * versões em cada opção; a que não cabe fica desabilitada com o motivo), o Escopo (só em "Corrigida") e o Comentário.
 */
export function BlocoDaRevisao({ opcoes, valor, aoMudar }: BlocoDaRevisaoProps) {
  const nomeDoResultado = useId()
  const nomeDoEscopo = useId()
  const idDoComentario = useId()
  const escolher = (resultado: ResultadoDaRevisao) => aoMudar({ ...valor, resultado })
  return (
    <>
      <fieldset className="janela-revisao">
        <legend className="janela-escolha-pergunta">Resultado da revisão</legend>
        <OpcaoDoResultado nome={nomeDoResultado} rotulo="Sem alteração" opcao={opcoes.semAlteracao}
          marcada={valor.resultado === 'sem_alteracao'} aoEscolher={() => escolher('sem_alteracao')} />
        <OpcaoDoResultado nome={nomeDoResultado} rotulo="Corrigida" opcao={opcoes.corrigida}
          marcada={valor.resultado === 'corrigida'} aoEscolher={() => escolher('corrigida')} />
      </fieldset>
      {valor.resultado === 'corrigida' && (
        <fieldset className="janela-revisao">
          <legend className="janela-escolha-pergunta">Escopo da correção</legend>
          {ESCOPOS.map((escopo) => (
            <label key={escopo} className="janela-escolha-opcao">
              <input type="radio" name={nomeDoEscopo} checked={valor.escopo === escopo} onChange={() => aoMudar({ ...valor, escopo })} />
              {ROTULO_DO_ESCOPO[escopo]}
            </label>
          ))}
        </fieldset>
      )}
      <label htmlFor={idDoComentario} className="janela-escolha-pergunta janela-revisao-rotulo">Comentário (opcional)</label>
      <textarea id={idDoComentario} className="janela-campo" rows={2} maxLength={2000} value={valor.comentario}
        onChange={(mudanca) => aoMudar({ ...valor, comentario: mudanca.target.value })} />
      <p className="janela-ajuda">Não anote dado pessoal de pessoas do setor.</p>
    </>
  )
}

type OpcaoDoResultadoProps = { nome: string; rotulo: string; opcao: OpcaoDaRevisao; marcada: boolean; aoEscolher: () => void }

// O rótulo leva a prévia ("Sem alteração: segue a V7") só quando a opção cabe; o motivo de a opção não caber fica ao lado,
// fora do rótulo, e descreve o botão.
function OpcaoDoResultado({ nome, rotulo, opcao, marcada, aoEscolher }: OpcaoDoResultadoProps) {
  const idDoMotivo = useId()
  return (
    <div className="janela-revisao-opcao">
      <label className="janela-escolha-opcao">
        <input type="radio" name={nome} checked={marcada} disabled={!opcao.disponivel} onChange={aoEscolher}
          aria-describedby={opcao.motivo ? idDoMotivo : undefined} />
        {opcao.disponivel ? `${rotulo}: ${opcao.previa}` : rotulo}
      </label>
      {opcao.motivo && <span id={idDoMotivo} className="janela-revisao-motivo">{opcao.motivo}</span>}
    </div>
  )
}
