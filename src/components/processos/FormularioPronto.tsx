import { type FormEvent, useState } from 'react'
import { textoDaFalhaNoFormulario } from '../../acesso/falhasDeGravacao'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { hojeEmBrasilia } from '../../lib/datas'
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

// O processo nasce, no caso mais comum, da reunião com o setor: a Data da modelagem piloto já vem com o dia de hoje.
const camposEmBranco = (): CamposDoProcesso => ({
  nome: '', setorId: '', macroprocessoId: '', tipo: 'a_classificar', processoPaiId: '', origem: 'novo', contexto: '',
  observacoes: '', dataDaModelagemPiloto: hojeEmBrasilia(),
})

function camposIniciais(inicial?: ProcessoLido): CamposDoProcesso {
  if (!inicial) return camposEmBranco()
  return {
    nome: inicial.nome, setorId: inicial.setorId, macroprocessoId: inicial.macroprocessoId,
    tipo: inicial.tipo, processoPaiId: inicial.processoPaiId ?? '', origem: inicial.origem,
    contexto: inicial.contexto ?? '', observacoes: inicial.observacoes ?? '', dataDaModelagemPiloto: '',
  }
}

// O subprocesso segue o macroprocesso do pai: escolher o pai já mostra o macroprocesso que o banco vai gravar.
function comMacroprocessoDoPai(campos: CamposDoProcesso, pais: OpcoesDoProcesso['pais']): CamposDoProcesso {
  const pai = campos.tipo === 'subprocesso' ? pais.find((outro) => outro.id === campos.processoPaiId) : undefined
  return pai ? { ...campos, macroprocessoId: pai.macroprocessoId } : campos
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
      <CamposDoFormulario campos={campos} opcoes={opcoes} cadastrando={!inicial}
        aoMudar={(mudanca) => setCampos((atuais) => comMacroprocessoDoPai({ ...atuais, ...mudanca }, opcoes.pais))} />
      {setor && macroprocesso && (
        <AvisoDeSetorIncluido key={macroprocesso.id} cadastros={cadastros} setorId={setor.id} setorSigla={setor.sigla}
          macroprocessoId={macroprocesso.id} macroprocessoNome={macroprocesso.nome} />
      )}
      <div className="formulario-do-processo-rodape">
        <button type="submit" className="botao botao-principal" disabled={enviando}>{inicial ? 'Salvar' : 'Cadastrar'}</button>
        <button type="button" className="botao botao-secundario" onClick={aoCancelar}>Cancelar</button>
        {/* Dentro do rodapé fixo: a recusa aparece onde a pessoa clicou, mesmo com o formulário rolado para cima. */}
        {aviso && <p className="cadastros-falha formulario-do-processo-aviso" role="alert">{aviso}</p>}
      </div>
    </form>
  )
}
