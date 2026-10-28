import type { CSSProperties } from 'react'
import { estiloDaCor } from '../cadastros/corDoSetor'
import type { PessoaDaOpcao } from '../processos/tipos'
import { Avatar } from './Avatar'

type OpcaoDaCaixaProps = {
  valor: string
  rotulo: string
  desabilitada?: boolean
  /** A marca de cor do macroprocesso (a mesma do cartão). */
  cor?: string
  /** O Avatar de quem a opção nomeia. */
  pessoa?: PessoaDaOpcao
  /** Número da cor do setor: quadradinho em degradê, o mesmo do selo. */
  corDoSetor?: number
}

/**
 * Uma <option> com a marca na frente (cor ou Avatar), para a caixa de seleção personalizável do navegador
 * (src/styles/caixas.css). A marca é enfeite e fica escondida da leitura de tela: o nome da opção é só o rótulo.
 * Nos navegadores sem a caixa personalizável, o <select> ignora a marca e mostra o texto.
 */
export function OpcaoDaCaixa({ valor, rotulo, desabilitada, cor, pessoa, corDoSetor }: OpcaoDaCaixaProps) {
  return (
    <option value={valor} disabled={desabilitada}>
      {pessoa && (
        <span className="opcao-marca" aria-hidden="true">
          <Avatar nome={pessoa.nome} fotoUrl={pessoa.fotoUrl ?? undefined} tamanho={20} decorativo />
        </span>
      )}
      {cor && <span className="opcao-marca opcao-cor" aria-hidden="true" style={{ background: cor }} />}
      {corDoSetor !== undefined && (
        <span className="opcao-marca opcao-cor opcao-cor-do-setor" aria-hidden="true"
          style={estiloDaCor(corDoSetor) as CSSProperties} />
      )}
      {rotulo}
    </option>
  )
}

/**
 * Primeiro filho do <select> que tem opções com marca ou selo: sem ele, o navegador mostra na caixa fechada só o texto
 * da opção escolhida; com ele, o <selectedcontent> repete o visual inteiro da opção. Fora do Chrome e do Edge, o
 * <select> comum ignora o botão e segue mostrando o texto.
 */
export function BotaoDaCaixa() {
  return (
    <button type="button">
      <selectedcontent />
    </button>
  )
}
