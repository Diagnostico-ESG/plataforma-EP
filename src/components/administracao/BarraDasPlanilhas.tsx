import type { LinksDasPlanilhas } from '../../planilhas/tipos'

type BarraDasPlanilhasProps = {
  /** null: as planilhas ainda não foram configuradas neste ambiente. */
  links: LinksDasPlanilhas | null
  emAndamento: boolean
  pedindo: boolean
  falha: string | null
  aoPedir: () => void
}

function LinkEmAbaNova({ endereco, texto }: { endereco: string; texto: string }) {
  return (
    <a href={endereco} target="_blank" rel="noopener noreferrer">
      {texto}<span className="etapa-so-leitor"> (abre em nova aba)</span>
    </a>
  )
}

// Por que o botão está desligado; sem motivo, ele está ligado.
function explicacaoDoBotao(links: LinksDasPlanilhas | null, emAndamento: boolean): string | null {
  if (!links) return 'O botão fica desligado: as planilhas ainda não foram configuradas neste ambiente.'
  if (emAndamento) return 'Aguarde: há uma atualização em andamento.'
  return null
}

export function BarraDasPlanilhas({ links, emAndamento, pedindo, falha, aoPedir }: BarraDasPlanilhasProps) {
  const explicacao = explicacaoDoBotao(links, emAndamento)
  return (
    <div className="planilhas-barra">
      {links
        ? (
            <ul className="planilhas-links">
              <li><LinkEmAbaNova endereco={links.interna} texto="Planilha interna" /></li>
              <li><LinkEmAbaNova endereco={links.publica} texto="Planilha pública" /></li>
            </ul>
          )
        : <p className="planilhas-aviso">As planilhas ainda não foram configuradas neste ambiente.</p>}
      <button type="button" className="botao botao-principal" disabled={explicacao !== null || pedindo}
        aria-describedby={explicacao ? 'explicacao-do-botao-das-planilhas' : undefined} onClick={aoPedir}>
        Atualizar planilhas agora
      </button>
      {explicacao && <p id="explicacao-do-botao-das-planilhas" className="planilhas-explicacao">{explicacao}</p>}
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
    </div>
  )
}
