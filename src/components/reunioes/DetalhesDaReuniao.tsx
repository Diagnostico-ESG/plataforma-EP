import { useState } from 'react'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import type { DadosDaReuniao, ModuloDeReunioes, Reuniao } from '../../reunioes/tipos'
import { AcoesDaReuniao } from './AcoesDaReuniao'
import { DadosDaReuniao as DadosLidos } from './DadosDaReuniao'
import { FormularioDaReuniao } from './FormularioDaReuniao'

type DetalhesDaReuniaoProps = {
  reunioes: ModuloDeReunioes
  reuniao: Reuniao
  podeAlterar: boolean
  /** A reunião mudou: o painel a lê de novo e a lista de trás recarrega. */
  aoMudar: () => void
  aoExcluir: () => void
  aoSumir: () => void
}

// Os dados viram o formulário na edição; salvar volta aos dados, já atualizados.
export function DetalhesDaReuniao({ reunioes, reuniao, podeAlterar, aoMudar, aoExcluir, aoSumir }: DetalhesDaReuniaoProps) {
  const [editando, setEditando] = useState(false)

  // A falha segue para o formulário, que a mostra e mantém os dados; reunião que sumiu troca o painel pelo aviso.
  async function salvar(dados: DadosDaReuniao) {
    try {
      await reunioes.salvarReuniao(reuniao.id, dados)
    } catch (erro) {
      if (erro instanceof CadastroInexistente) return aoSumir()
      throw erro
    }
    setEditando(false)
    aoMudar()
  }

  if (editando) {
    return (
      <FormularioDaReuniao reunioes={reunioes} titulo="Editar reunião" reuniao={reuniao} aoSalvar={salvar}
        aoCancelar={() => setEditando(false)} />
    )
  }
  return (
    <>
      <DadosLidos reuniao={reuniao} />
      {podeAlterar && (
        <AcoesDaReuniao reuniao={reuniao} reunioes={reunioes} aoEditar={() => setEditando(true)} aoExcluir={aoExcluir}
          aoSumir={aoSumir} />
      )}
    </>
  )
}
