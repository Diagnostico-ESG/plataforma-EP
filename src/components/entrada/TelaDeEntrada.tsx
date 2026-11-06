import { mensagemDaRecusa } from '../../acesso/motivos'
import type { EstadoDaEntrada } from '../../acesso/tipos'
import { CapaIlustracao } from './CapaIlustracao'
import './TelaDeEntrada.css'

type EstadoForaDaPlataforma = Exclude<EstadoDaEntrada, { tipo: 'dentro' }>

type TelaDeEntradaProps = {
  estado: EstadoForaDaPlataforma
  aoEntrar: () => void
  aoTentarDeNovo: () => void
}

// Capa dividida (.scratch/capa-de-entrada/spec.md): o login à esquerda e a ilustração do Quadro à direita.
export function TelaDeEntrada({ estado, aoEntrar, aoTentarDeNovo }: TelaDeEntradaProps) {
  return (
    <main className="entrada">
      <section className="entrada-login" aria-labelledby="entrada-titulo">
        <span className="entrada-marca" aria-hidden="true">
          EP
        </span>
        <div>
          <p className="entrada-orgao">Centro Estadual de Desburocratização (CED)</p>
          <h1 id="entrada-titulo" className="entrada-titulo">
            Escritório de Processos
          </h1>
          <p className="entrada-frase">Gestão das tarefas e dos documentos do mapeamento de processos da Casa Civil do Paraná.</p>
        </div>
        <button type="button" className="botao botao-principal entrada-botao" onClick={aoEntrar} disabled={estado.tipo === 'verificando'}>
          Entrar com a conta institucional
        </button>
        <MensagemDaEntrada estado={estado} aoTentarDeNovo={aoTentarDeNovo} />
      </section>
      <CapaIlustracao />
    </main>
  )
}

function MensagemDaEntrada({ estado, aoTentarDeNovo }: Omit<TelaDeEntradaProps, 'aoEntrar'>) {
  if (estado.tipo === 'verificando') {
    return (
      <p className="entrada-mensagem" role="status">
        Verificando seu acesso…
      </p>
    )
  }
  if (estado.tipo === 'falha') {
    return (
      <div className="entrada-mensagem entrada-erro" role="alert">
        <p>Não foi possível conectar. Verifique a conexão e tente de novo.</p>
        <button type="button" className="botao botao-secundario" onClick={aoTentarDeNovo}>
          Tentar de novo
        </button>
      </div>
    )
  }
  if (!estado.recusa) return null
  return (
    <p className="entrada-mensagem entrada-erro" role="alert">
      {mensagemDaRecusa(estado.recusa)}
    </p>
  )
}
