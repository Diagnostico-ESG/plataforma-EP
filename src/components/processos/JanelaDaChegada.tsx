import { useId, useState } from 'react'
import type { PedidoDeChegada } from '../../hooks/useMovimentoDoProcesso'
import { useGravacaoNaJanela } from '../../hooks/useGravacaoNaJanela'
import { gravarChegada } from '../../processos/gravarAcoes'
import { type OpcaoDaChegada, type RascunhoDaChegada, chegadaCompleta, dadosDaChegada, rascunhoDaChegadaVazio } from '../../processos/rascunhoDaChegada'
import type { ModuloDeProcessos } from '../../processos/tipos'
import { CamposDaPublicacao } from './CamposDaPublicacao'
import { JanelaDeEdicao } from './JanelaDeEdicao'

type JanelaDaChegadaProps = {
  chegada: PedidoDeChegada
  processos: Pick<ModuloDeProcessos, 'moverProcesso'>
  /** Chamado quando gravou, antes de a janela fechar: o Quadro e o verso leem de novo. */
  aoGravar: () => void
  aoFechar: () => void
}

const OPCOES: { opcao: OpcaoDaChegada; rotulo: string }[] = [
  { opcao: 'publicado', rotulo: 'Publicado' }, { opcao: 'sem_publicacao', rotulo: 'Concluir sem publicação' },
]

type CamposProps = { rascunho: RascunhoDaChegada; aoMudar: (rascunho: RascunhoDaChegada) => void }

function CampoDaExplicacao({ rascunho, aoMudar }: CamposProps) {
  const id = useId()
  return (
    <>
      <label htmlFor={id} className="janela-escolha-pergunta janela-revisao-rotulo">Explicação</label>
      <textarea id={id} className="janela-campo" rows={3} maxLength={2000} placeholder="Por que este processo não será publicado?"
        value={rascunho.explicacao} onChange={(mudanca) => aoMudar({ ...rascunho, explicacao: mudanca.target.value })} />
      <p className="janela-ajuda">Não anote dado pessoal de pessoas do setor.</p>
    </>
  )
}

/**
 * Levar o processo a Concluídos sem a data da publicação já registrada (ADR 0024): ou "Publicado", com a data e o link, ou
 * "Concluir sem publicação", com a explicação obrigatória. Nenhuma opção vem marcada, e o botão só se habilita com a escolhida
 * completa. A recusa ou falha fica em vermelho, sem perder o preenchido.
 */
export function JanelaDaChegada({ chegada, processos, aoGravar, aoFechar }: JanelaDaChegadaProps) {
  const [rascunho, setRascunho] = useState(rascunhoDaChegadaVazio)
  const { salvando, falha, gravar } = useGravacaoNaJanela(aoFechar)
  const nome = useId()

  const levar = () => gravar(async () => {
    const falhou = await gravarChegada(processos, chegada.processo.id, chegada.etapa.id, dadosDaChegada(rascunho))
    if (!falhou) aoGravar()
    return falhou
  })

  return (
    <JanelaDeEdicao titulo={`Levar ${chegada.processo.nome} a Concluídos`} rotuloDoSalvar="Levar a Concluídos" salvando={salvando}
      falha={falha} podeSalvar={chegadaCompleta(rascunho)} aoSalvar={levar} aoFechar={aoFechar}>
      <fieldset className="janela-revisao">
        <legend className="janela-escolha-pergunta">Como o processo chega a Concluídos?</legend>
        {OPCOES.map(({ opcao, rotulo }) => (
          <label key={opcao} className="janela-escolha-opcao">
            <input type="radio" name={nome} checked={rascunho.opcao === opcao} onChange={() => setRascunho({ ...rascunho, opcao })} />
            {rotulo}
          </label>
        ))}
      </fieldset>
      {rascunho.opcao === 'publicado' && <CamposDaPublicacao valor={rascunho} aoMudar={setRascunho} />}
      {rascunho.opcao === 'sem_publicacao' && <CampoDaExplicacao rascunho={rascunho} aoMudar={setRascunho} />}
    </JanelaDeEdicao>
  )
}
