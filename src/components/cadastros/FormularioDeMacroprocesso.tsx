import { type FormEvent, useId, useState } from 'react'
import { textoDaFalhaNoFormulario } from '../../acesso/falhasDeGravacao'
import { CATEGORIAS, ROTULO_SEM_CATEGORIA, ROTULOS_DAS_CATEGORIAS } from '../../cadastros/categorias'
import type { CategoriaDoMacroprocesso, DadosDoMacroprocesso } from '../../cadastros/tipos'
import { normalizarCodigo, problemaNoMacroprocesso } from '../../cadastros/validacaoDoMacroprocesso'

type FormularioDeMacroprocessoProps = {
  aoSalvar: (dados: DadosDoMacroprocesso) => Promise<void>
  aoCancelar: () => void
  titulo?: string
  inicial?: DadosDoMacroprocesso
  rotuloDoCancelar?: string
}

// noValidate: as mensagens são as nossas, não as do navegador.
export function FormularioDeMacroprocesso({
  aoSalvar, aoCancelar, titulo = 'Novo macroprocesso', inicial, rotuloDoCancelar = 'Cancelar',
}: FormularioDeMacroprocessoProps) {
  const comeco = camposIniciais(inicial)
  const [codigo, setCodigo] = useState(comeco.codigo)
  const [nome, setNome] = useState(comeco.nome)
  const [descricao, setDescricao] = useState(comeco.descricao)
  const [categoria, setCategoria] = useState(comeco.categoria)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const id = useId()

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const problema = problemaNoMacroprocesso(nome)
    setAviso(problema)
    if (problema) return
    setEnviando(true)
    try {
      await aoSalvar(dadosDoFormulario({ codigo, nome, descricao, categoria }))
    } catch (erro) {
      setAviso(textoDaFalhaNoFormulario(erro))
    }
    setEnviando(false)
  }

  return (
    <form className="form-setor" aria-label={titulo} noValidate onSubmit={enviar}>
      <h3 className="form-setor-titulo">{titulo}</h3>
      <label htmlFor={`${id}-codigo`}>Código</label>
      <input id={`${id}-codigo`} value={codigo} maxLength={20} autoComplete="off"
        onChange={(evento) => setCodigo(evento.target.value)} />
      <label htmlFor={`${id}-nome`}>Nome</label>
      <input id={`${id}-nome`} value={nome} maxLength={200} autoComplete="off"
        onChange={(evento) => setNome(evento.target.value)} />
      <label htmlFor={`${id}-descricao`}>Descrição</label>
      <textarea id={`${id}-descricao`} value={descricao} maxLength={2000} rows={3}
        onChange={(evento) => setDescricao(evento.target.value)} />
      <label htmlFor={`${id}-categoria`}>Categoria</label>
      <select id={`${id}-categoria`} value={categoria} onChange={(evento) => setCategoria(evento.target.value)}>
        <option value="">{ROTULO_SEM_CATEGORIA}</option>
        {CATEGORIAS.map((valor) => <option key={valor} value={valor}>{ROTULOS_DAS_CATEGORIAS[valor]}</option>)}
      </select>
      <div className="form-setor-botoes">
        <button type="submit" className="botao botao-principal" disabled={enviando}>Salvar</button>
        <button type="button" className="botao botao-secundario" onClick={aoCancelar}>{rotuloDoCancelar}</button>
      </div>
      {aviso && <p className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}

type Campos = { codigo: string; nome: string; descricao: string; categoria: string }

function camposIniciais(inicial?: DadosDoMacroprocesso): Campos {
  return {
    codigo: inicial?.codigo ?? '', nome: inicial?.nome ?? '', descricao: inicial?.descricao ?? '',
    categoria: inicial?.categoria ?? '',
  }
}

function dadosDoFormulario(campos: Campos): DadosDoMacroprocesso {
  return {
    codigo: normalizarCodigo(campos.codigo), nome: campos.nome.trim(), descricao: campos.descricao.trim() || null,
    categoria: campos.categoria === '' ? null : (campos.categoria as CategoriaDoMacroprocesso),
  }
}
