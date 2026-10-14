import { useState } from 'react'
import { textoDaFalhaNoFormulario } from '../../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import type { DatasDaEtapa, EtapaDoSetor } from '../../processos/tipos'

type FormularioDeDatasProps = {
  etapa: EtapaDoSetor
  /** Grava e recusa com a frase pronta; quem chama fecha o formulário quando a gravação dá certo. */
  aoSalvar: (datas: DatasDaEtapa) => Promise<void>
  aoCancelar: () => void
  aoSumir: () => void
}

const COM_CONCLUSAO = ['concluida', 'dispensada', 'realizada_anteriormente']

/** Corrige o início e a conclusão da etapa, só os campos que o status dela tem; a recusa fica no formulário. */
export function FormularioDeDatas({ etapa, aoSalvar, aoCancelar, aoSumir }: FormularioDeDatasProps) {
  const temInicio = etapa.status === 'em_andamento' || etapa.status === 'concluida'
  const temConclusao = COM_CONCLUSAO.includes(etapa.status)
  const [iniciadaEm, setIniciadaEm] = useState(etapa.iniciadaEm ?? '')
  const [resolvidaEm, setResolvidaEm] = useState(etapa.resolvidaEm ?? '')
  const [falha, setFalha] = useState<string | null>(null)
  const incompleto = (temInicio && iniciadaEm === '') || (temConclusao && resolvidaEm === '')

  async function salvar() {
    setFalha(null)
    try {
      await aoSalvar({
        iniciadaEm: temInicio ? iniciadaEm : etapa.iniciadaEm, resolvidaEm: temConclusao ? resolvidaEm : etapa.resolvidaEm,
      })
    } catch (erro) {
      if (erro instanceof CadastroInexistente) return aoSumir()
      setFalha(textoDaFalhaNoFormulario(erro))
    }
  }

  return (
    <div className="etapa-datas-form">
      {temInicio && <CampoDeData rotulo="Início" valor={iniciadaEm} aoMudar={setIniciadaEm} nomeDaEtapa={etapa.nome} />}
      {temConclusao && <CampoDeData rotulo="Conclusão" valor={resolvidaEm} aoMudar={setResolvidaEm} nomeDaEtapa={etapa.nome} />}
      <button type="button" className="botao botao-principal" disabled={incompleto} onClick={salvar}>Salvar datas</button>
      <button type="button" className="botao botao-secundario" onClick={aoCancelar}>Cancelar</button>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
    </div>
  )
}

type CampoDeDataProps = { rotulo: string; valor: string; aoMudar: (valor: string) => void; nomeDaEtapa: string }

function CampoDeData({ rotulo, valor, aoMudar, nomeDaEtapa }: CampoDeDataProps) {
  return (
    <label className="etapa-campo-de-data">
      {rotulo}
      <input type="date" aria-label={`${rotulo} da etapa ${nomeDaEtapa}`} value={valor}
        onChange={(mudanca) => aoMudar(mudanca.target.value)} />
    </label>
  )
}
