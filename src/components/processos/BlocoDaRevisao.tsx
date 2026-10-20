import { useId } from 'react'
import type { OpcaoDaRevisao, OpcoesDaRevisao } from '../../revisoes/opcoesDaRevisao'
import type { RascunhoDaRevisao } from '../../revisoes/rascunhoDaRevisao'
import type { ResultadoDaRevisao } from '../../revisoes/tipos'
import { CampoDoComentario, CampoDoEscopo } from './CamposDaRevisao'

type BlocoDaRevisaoProps = {
  opcoes: OpcoesDaRevisao
  valor: RascunhoDaRevisao
  aoMudar: (valor: RascunhoDaRevisao) => void
}

/**
 * O que a janela de concluir a Revisão interna pede acima da escolha do responsável: o Resultado (com a prévia das
 * versões em cada opção; a que não cabe fica desabilitada com o motivo), o Escopo (só em "Corrigida") e o Comentário.
 */
export function BlocoDaRevisao({ opcoes, valor, aoMudar }: BlocoDaRevisaoProps) {
  const nomeDoResultado = useId()
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
      {valor.resultado === 'corrigida' && <CampoDoEscopo valor={valor.escopo} aoMudar={(escopo) => aoMudar({ ...valor, escopo })} />}
      <CampoDoComentario valor={valor.comentario} aoMudar={(comentario) => aoMudar({ ...valor, comentario })} />
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
