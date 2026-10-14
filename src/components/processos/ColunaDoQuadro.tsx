import type { ColunaDoQuadro as Coluna } from '../../processos/colunasDoQuadro'
import { CartaoDoProcesso } from './CartaoDoProcesso'

type ColunaDoQuadroProps = { coluna: Coluna; idEscolhido: string | null; enderecoDoProcesso: (id: string) => string }

export function ColunaDoQuadro({ coluna, idEscolhido, enderecoDoProcesso }: ColunaDoQuadroProps) {
  return (
    <section className="coluna" aria-label={coluna.titulo}>
      <h3 className="coluna-titulo">
        {coluna.titulo} <span className="coluna-contagem">{coluna.processos.length}</span>
      </h3>
      <div className="coluna-cartoes">
        {coluna.processos.map((processo) => (
          <CartaoDoProcesso key={processo.id} processo={processo} escolhido={processo.id === idEscolhido}
            href={enderecoDoProcesso(processo.id)} />
        ))}
      </div>
    </section>
  )
}
