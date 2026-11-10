import type { ResumoDaImportacao as Resumo } from '../../importacao/executarImportacao'
import { contar } from '../../importacao/frasesDaImportacao'
import { AvisosDaImportacao } from './AvisosDaImportacao'

type ResumoDaImportacaoProps = { resumo: Resumo; aoImportarOutro: () => void }

function FalhaDaImportacao({ resumo }: { resumo: Resumo }) {
  if (resumo.falha === null) return null
  return (
    <p className="administracao-falha" role="alert">
      A importação parou em {resumo.falha}. Entraram {contar(resumo.criados, 'processo', 'processos')} antes da falha
      {resumo.naoTentados > 0 && `; ${contar(resumo.naoTentados, 'ficou', 'ficaram')} sem tentar`}. Escolha o arquivo de novo para
      continuar: o que já entrou é pulado.
    </p>
  )
}

export function ResumoDaImportacao({ resumo, aoImportarOutro }: ResumoDaImportacaoProps) {
  return (
    <div role="status">
      <h4 className="importacao-subtitulo">{resumo.falha === null ? 'Importação concluída' : 'Importação interrompida'}</h4>
      <p className="importacao-contagens">
        {contar(resumo.criados, 'processo criado', 'processos criados')}, {contar(resumo.pulados, 'pulado', 'pulados')}.
      </p>
      <FalhaDaImportacao resumo={resumo} />
      <AvisosDaImportacao lida={resumo.lida} />
      <div className="importacao-acoes">
        <button type="button" className="botao botao-secundario" onClick={aoImportarOutro}>Importar outro arquivo</button>
      </div>
    </div>
  )
}
