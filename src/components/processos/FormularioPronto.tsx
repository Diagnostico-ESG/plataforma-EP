import { type FormEvent, useState } from 'react'
import { textoDaFalhaNoFormulario } from '../../acesso/falhasDeGravacao'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import type { DadosDoProcesso, ProcessoLido } from '../../processos/tipos'
import { type CamposDoProcesso, dadosDoProcesso, problemaNoProcesso } from '../../processos/validacaoDoProcesso'
import { AvisoDeSetorIncluido } from './AvisoDeSetorIncluido'
import { CamposDoFormulario, type OpcoesDoProcesso } from './CamposDoProcesso'

type FormularioProntoProps = {
  cadastros: ModuloDeCadastros
  opcoes: OpcoesDoProcesso
  titulo: string
  inicial?: ProcessoLido
  aoSalvar: (dados: DadosDoProcesso) => Promise<void>
  aoCancelar: () => void
}

const CAMPOS_EM_BRANCO: CamposDoProcesso = {
  nome: '', setorId: '', macroprocessoId: '', tipo: 'a_classificar', origem: 'novo', contexto: '', observacoes: '',
}

function camposIniciais(inicial?: ProcessoLido): CamposDoProcesso {
  if (!inicial) return CAMPOS_EM_BRANCO
  return {
    nome: inicial.nome, setorId: inicial.setorId, macroprocessoId: inicial.macroprocessoId,
    tipo: inicial.tipo === 'processo' ? 'processo' : 'a_classificar', origem: inicial.origem,
    contexto: inicial.contexto ?? '', observacoes: inicial.observacoes ?? '',
  }
}

// noValidate: as mensagens são as nossas, não as do navegador.
export function FormularioPronto({ cadastros, opcoes, titulo, inicial, aoSalvar, aoCancelar }: FormularioProntoProps) {
  const [campos, setCampos] = useState(() => camposIniciais(inicial))
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const problema = problemaNoProcesso(campos)
    setAviso(problema)
    if (problema) return
    setEnviando(true)
    try {
      await aoSalvar(dadosDoProcesso(campos))
    } catch (erro) {
      setAviso(textoDaFalhaNoFormulario(erro))
    }
    setEnviando(false)
  }

  const setor = opcoes.setores.find((outro) => outro.id === campos.setorId)
  const macroprocesso = opcoes.macroprocessos.find((outro) => outro.id === campos.macroprocessoId)
  return (
    <form className="formulario-do-processo" aria-label={titulo} noValidate onSubmit={enviar}>
      <h3 className="painel-subtitulo">{titulo}</h3>
      <CamposDoFormulario campos={campos} opcoes={opcoes} mostrarTipo={!inicial}
        aoMudar={(mudanca) => setCampos((atuais) => ({ ...atuais, ...mudanca }))} />
      {setor && macroprocesso && (
        <AvisoDeSetorIncluido key={macroprocesso.id} cadastros={cadastros} setorId={setor.id} setorSigla={setor.sigla}
          macroprocessoId={macroprocesso.id} macroprocessoNome={macroprocesso.nome} />
      )}
      <div className="formulario-do-processo-botoes">
        <button type="submit" className="botao botao-principal" disabled={enviando}>Salvar</button>
        <button type="button" className="botao botao-secundario" onClick={aoCancelar}>Cancelar</button>
      </div>
      {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}
