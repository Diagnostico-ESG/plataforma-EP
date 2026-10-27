import { useState } from 'react'
import { useGravacaoNaJanela } from '../../hooks/useGravacaoNaJanela'
import { gravarNumeroDaVersao, numeroNovoValido, previaDoNumero } from '../../versoes/numeroDaVersao'
import { rotuloDaVersao } from '../../versoes/rotulos'
import type { ModuloDeVersoes, Versao } from '../../versoes/tipos'
import { JanelaDeEdicao } from '../processos/JanelaDeEdicao'
import { CampoDoNumeroDaVersao } from './CampoDoNumeroDaVersao'

type JanelaDoNumeroDaVersaoProps = {
  modulo: Pick<ModuloDeVersoes, 'editarNumero'>
  versao: Versao
  /** Chamado quando gravou, antes de a janela fechar: quem mostra as versões lê de novo. */
  aoGravar: () => void
  aoFechar: () => void
}

/**
 * "Editar número da V7" (ADR 0028): o campo do número (preenchido com o atual), a prévia do rótulo e dos nomes novos dos
 * arquivos, e [Gravar]. Só o número muda, nunca o tipo. Enquanto os arquivos são renomeados no Drive os campos ficam
 * travados; na recusa a janela fica aberta com o número digitado.
 */
export function JanelaDoNumeroDaVersao({ modulo, versao, aoGravar, aoFechar }: JanelaDoNumeroDaVersaoProps) {
  const [texto, setTexto] = useState(String(versao.numero))
  const { salvando, falha, gravar } = useGravacaoNaJanela(aoFechar)
  const numeroNovo = numeroNovoValido(texto, versao)

  const salvar = () => {
    if (numeroNovo === null) return
    void gravar(async () => {
      const falhou = await gravarNumeroDaVersao(modulo, versao, numeroNovo)
      if (!falhou) aoGravar()
      return falhou
    })
  }

  return (
    <JanelaDeEdicao titulo={`Editar número da ${rotuloDaVersao(versao)}`} salvando={salvando} falha={falha} aoSalvar={salvar}
      aoFechar={aoFechar} rotuloDoSalvar="Gravar" podeSalvar={numeroNovo !== null}>
      <fieldset className="formulario-de-versao-campos" disabled={salvando}>
        <CampoDoNumeroDaVersao texto={texto} aoMudar={setTexto} />
      </fieldset>
      {numeroNovo !== null && <PreviaDoNumero versao={versao} numeroNovo={numeroNovo} />}
      {salvando && <p className="formulario-de-versao-progresso" role="status">Renomeando os arquivos no Drive…</p>}
    </JanelaDeEdicao>
  )
}

function PreviaDoNumero({ versao, numeroNovo }: { versao: Versao; numeroNovo: number }) {
  const { rotulo, nomes } = previaDoNumero(versao, numeroNovo)
  return (
    <div className="formulario-de-versao-previa">
      <p>Fica <strong>{rotulo}</strong>.</p>
      {nomes.length > 0 && (
        <ul aria-label="Nomes novos dos arquivos">
          {nomes.map((nome) => <li key={nome}>{nome}</li>)}
        </ul>
      )}
    </div>
  )
}
