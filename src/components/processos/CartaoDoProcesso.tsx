import { ROTULO_DO_TIPO } from '../../processos/rotulos'
import type { ProcessoDaLista } from '../../processos/tipos'
import { Avatar } from '../Avatar'
import { Pilula } from '../Pilula'

type CartaoDoProcessoProps = { processo: ProcessoDaLista; escolhido: boolean; href: string }

/** O cartão do Quadro é um link: focável, e Enter abre o painel do processo. */
export function CartaoDoProcesso({ processo, escolhido, href }: CartaoDoProcessoProps) {
  const { id, nome, tipo, setorSigla, macroprocessoNome, situacao, responsavel } = processo
  return (
    <a id={`cartao-${id}`} className="cartao" href={href} aria-current={escolhido ? 'true' : undefined}>
      <span className="cartao-topo">
        <span className="cartao-sigla">{setorSigla}</span>
        <span className="cartao-macroprocesso">{macroprocessoNome}</span>
      </span>
      <span className="cartao-nome">{nome}</span>
      <span className="cartao-rodape">
        <span className="cartao-pilulas">
          {tipo !== 'processo' && <Pilula situacao="neutra">{ROTULO_DO_TIPO[tipo]}</Pilula>}
          {situacao === 'suspenso' && <Pilula situacao="vencendo">Suspenso</Pilula>}
        </span>
        {responsavel && <Avatar nome={responsavel.nome} fotoUrl={responsavel.fotoUrl ?? undefined} tamanho={20} />}
      </span>
    </a>
  )
}
