import { type FormEvent, useId, useState } from 'react'
import { textoDaFalhaNoFormulario } from '../../acesso/falhasDeGravacao'
import type { DadosDoSetor } from '../../cadastros/tipos'
import { normalizarSigla, problemaNoSetor } from '../../cadastros/validacaoDoSetor'
import { GradeDeCores } from './GradeDeCores'

type FormularioDeSetorProps = {
  aoSalvar: (dados: DadosDoSetor) => Promise<void>
  aoCancelar: () => void
  titulo?: string
  inicial?: DadosDoSetor
  rotuloDoCancelar?: string
  /** Só no setor aberto de quem pode alterar: a cor escolhida vai junto com o [Salvar]. */
  coresEmUso?: ReadonlyMap<number, string>
}

// noValidate: as mensagens são as nossas (com o valor digitado), não as do navegador.
export function FormularioDeSetor({
  aoSalvar, aoCancelar, titulo = 'Novo setor', inicial, rotuloDoCancelar = 'Cancelar', coresEmUso,
}: FormularioDeSetorProps) {
  const comeco = camposIniciais(inicial)
  const [cor, setCor] = useState(inicial?.cor)
  const [nome, setNome] = useState(comeco.nome)
  const [sigla, setSigla] = useState(comeco.sigla)
  const [observacoes, setObservacoes] = useState(comeco.observacoes)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const id = useId()

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const problema = problemaNoSetor(nome, sigla)
    setAviso(problema)
    if (problema) return
    setEnviando(true)
    try {
      await aoSalvar({
        nome: nome.trim(), sigla: normalizarSigla(sigla), observacoes: observacoes.trim() || null,
        // A cor só vai se mudou: salvar só o nome não deve desfazer uma troca feita por outra pessoa nesse meio-tempo.
        ...(cor !== undefined && cor !== inicial?.cor ? { cor } : {}),
      })
    } catch (erro) {
      setAviso(textoDaFalhaNoFormulario(erro))
    }
    setEnviando(false)
  }

  return (
    <form className="form-setor" aria-label={titulo} noValidate onSubmit={enviar}>
      <h3 className="form-setor-titulo">{titulo}</h3>
      <label htmlFor={`${id}-nome`}>Nome</label>
      <input id={`${id}-nome`} value={nome} maxLength={200} autoComplete="off"
        onChange={(evento) => setNome(evento.target.value)} />
      <label htmlFor={`${id}-sigla`}>Sigla</label>
      <input id={`${id}-sigla`} value={sigla} autoComplete="off"
        aria-describedby={aviso ? `${id}-aviso` : undefined} onChange={(evento) => setSigla(evento.target.value)} />
      <label htmlFor={`${id}-observacoes`}>Observações</label>
      <textarea id={`${id}-observacoes`} value={observacoes} maxLength={2000} rows={3}
        onChange={(evento) => setObservacoes(evento.target.value)} />
      {coresEmUso && cor !== undefined && <GradeDeCores escolhida={cor} emUso={coresEmUso} aoEscolher={setCor} />}
      <div className="form-setor-botoes">
        <button type="submit" className="botao botao-principal" disabled={enviando}>Salvar</button>
        <button type="button" className="botao botao-secundario" onClick={aoCancelar}>{rotuloDoCancelar}</button>
      </div>
      {aviso && <p id={`${id}-aviso`} className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}

function camposIniciais(inicial?: DadosDoSetor) {
  return { nome: inicial?.nome ?? '', sigla: inicial?.sigla ?? '', observacoes: inicial?.observacoes ?? '' }
}
