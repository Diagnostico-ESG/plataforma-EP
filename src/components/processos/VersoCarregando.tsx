import { BotaoFecharJanela } from './CabecalhoDoVerso'

/**
 * O verso enquanto o processo carrega: a janela já no tamanho final, com blocos cinza no formato do cabeçalho e das
 * duas colunas, para nada pular de lugar quando os dados chegam. O leitor de tela ouve "Carregando processo…".
 */
export function VersoCarregando({ aoFechar }: { aoFechar: () => void }) {
  return (
    <>
      <p className="visualmente-oculto" role="status">Carregando processo…</p>
      <div className="verso-cabecalho">
        <div className="verso-identificacao" aria-hidden="true">
          <span className="verso-fantasma verso-fantasma-titulo" />
          <span className="verso-fantasma verso-fantasma-linha" />
        </div>
        <div className="verso-ferramentas"><BotaoFecharJanela aoFechar={aoFechar} /></div>
      </div>
      <div className="verso-colunas" aria-hidden="true">
        <div className="verso-trabalho">
          <span className="verso-fantasma verso-fantasma-bloco" />
          <span className="verso-fantasma verso-fantasma-bloco" />
          <span className="verso-fantasma verso-fantasma-bloco-baixo" />
        </div>
        <div className="verso-contexto">
          <span className="verso-fantasma verso-fantasma-bloco-baixo" />
          <span className="verso-fantasma verso-fantasma-bloco" />
        </div>
      </div>
    </>
  )
}
