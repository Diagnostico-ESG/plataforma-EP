import { formatarMomento } from '../../acesso/historico'
import { motivoDaFalha, rotuloDaOrigem, rotuloDoResultado } from '../../planilhas/frasesDasPlanilhas'
import type { AtualizacaoDasPlanilhas, ResultadoDaAtualizacao } from '../../planilhas/tipos'
import { Pilula, type SituacaoPilula } from '../Pilula'

// A cor acompanha o texto da situação; nunca a diz sozinha.
const PILULA_DO_RESULTADO: Record<ResultadoDaAtualizacao, SituacaoPilula> = {
  em_andamento: 'informativa', concluida: 'aprovado', falhou: 'atraso', sem_resposta: 'vencendo',
}

type ListaDeAtualizacoesProps = { atualizacoes: AtualizacaoDasPlanilhas[] }

export function ListaDeAtualizacoes({ atualizacoes }: ListaDeAtualizacoesProps) {
  if (atualizacoes.length === 0) return <p className="cadastros-vazio">Nenhuma atualização ainda.</p>
  return (
    <table className="tabela-cadastros">
      <thead>
        <tr>
          <th scope="col">Quando</th><th scope="col">Origem</th><th scope="col">Resultado</th><th scope="col">Motivo</th>
        </tr>
      </thead>
      <tbody>
        {atualizacoes.map((tentativa) => (
          <tr key={tentativa.id}>
            <td>{formatarMomento(tentativa.iniciadaEm)}</td>
            <td>{rotuloDaOrigem(tentativa.origem, tentativa.pedidaPor)}</td>
            <td><Pilula situacao={PILULA_DO_RESULTADO[tentativa.resultado]}>{rotuloDoResultado(tentativa.resultado)}</Pilula></td>
            <td>{tentativa.resultado === 'falhou' ? motivoDaFalha(tentativa.motivo) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
