import { type FormEvent, useCallback, useState } from 'react'
import { textoDaFalhaNoFormulario } from '../../acesso/falhasDeGravacao'
import { useCarregamento } from '../../hooks/useCarregamento'
import { setoresDaEscolha } from '../../reunioes/setoresDaEscolha'
import type { DadosDaReuniao, ModuloDeReunioes, Reuniao, SetorParaReuniao } from '../../reunioes/tipos'
import {
  CAMPOS_DA_REUNIAO_EM_BRANCO, type CamposDaReuniao, camposDaReuniao, comMudanca, dadosDaReuniao, faltaPreencher,
} from '../../reunioes/validacaoDaReuniao'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { CamposDoFormulario } from './CamposDaReuniao'

type FormularioDaReuniaoProps = {
  reunioes: ModuloDeReunioes
  titulo: string
  /** Na edição, a reunião que já existe: o formulário parte dos dados dela. */
  reuniao?: Reuniao
  /** A falha segue para o formulário, que a mostra e mantém os dados. */
  aoSalvar: (dados: DadosDaReuniao) => Promise<void>
  aoCancelar: () => void
}

/** Carrega os setores ativos e, com eles, mostra o formulário. */
export function FormularioDaReuniao({ reunioes, ...formulario }: FormularioDaReuniaoProps) {
  const carregar = useCallback(() => reunioes.listarSetoresAtivos(), [reunioes])
  const { estado, tentarDeNovo } = useCarregamento(carregar)
  if (estado.tipo === 'carregando') return <p className="cadastros-vazio" role="status">Carregando setores…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os setores" aoTentarDeNovo={tentarDeNovo} />
  return <FormularioPronto reunioes={reunioes} setores={estado.valor} {...formulario} />
}

type FormularioProntoProps = FormularioDaReuniaoProps & { setores: SetorParaReuniao[] }

// noValidate: as mensagens são as nossas, não as do navegador. Salvar só se habilita com o obrigatório preenchido.
function FormularioPronto({ reunioes, setores, titulo, reuniao, aoSalvar, aoCancelar }: FormularioProntoProps) {
  const [campos, setCampos] = useState<CamposDaReuniao>(reuniao ? camposDaReuniao(reuniao) : CAMPOS_DA_REUNIAO_EM_BRANCO)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setAviso(null)
    setEnviando(true)
    try {
      await aoSalvar(dadosDaReuniao(campos))
    } catch (erro) {
      setAviso(textoDaFalhaNoFormulario(erro))
    }
    setEnviando(false)
  }

  return (
    <form className="formulario-do-processo" aria-label={titulo} noValidate onSubmit={enviar}>
      <h3 className="painel-subtitulo">{titulo}</h3>
      <CamposDoFormulario campos={campos} setores={setoresDaEscolha(setores, reuniao)} reunioes={reunioes}
        aoMudar={(mudanca) => setCampos((atuais) => comMudanca(atuais, mudanca))} />
      <div className="formulario-do-processo-botoes">
        <button type="submit" className="botao botao-principal" disabled={enviando || faltaPreencher(campos)}>Salvar</button>
        <button type="button" className="botao botao-secundario" onClick={aoCancelar}>Cancelar</button>
      </div>
      {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}
