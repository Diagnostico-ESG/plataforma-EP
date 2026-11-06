import { useState } from 'react'
import { rotuloDoPerfil } from '../../acesso/perfis'
import type { ModuloDeAcesso, UsuarioAtual } from '../../acesso/tipos'
import type { ModuloDeImportacao } from '../../importacao/tipos'
import type { ModuloDePlanilhas } from '../../planilhas/tipos'
import type { ModuloDeProcessos } from '../../processos/tipos'
import { AreaDaImportacao } from './AreaDaImportacao'
import { AreaDasPlanilhas } from './AreaDasPlanilhas'
import { AreaDeUsuarios } from './AreaDeUsuarios'
import { CatalogoDeEtapas } from './CatalogoDeEtapas'
import './Administracao.css'

type AreaDeAdministracaoProps = {
  usuario: UsuarioAtual
  acesso: ModuloDeAcesso
  processos: ModuloDeProcessos
  planilhas: ModuloDePlanilhas
  /** Sem o módulo, a aba Importação não existe (os testes das outras abas não precisam dele). */
  importacao?: ModuloDeImportacao
}

type Aba = 'usuarios' | 'catalogo' | 'planilhas' | 'importacao'
const ABAS: { aba: Aba; rotulo: string }[] = [
  { aba: 'usuarios', rotulo: 'Usuários' },
  { aba: 'catalogo', rotulo: 'Catálogo de etapas' },
  { aba: 'planilhas', rotulo: 'Planilhas' },
  { aba: 'importacao', rotulo: 'Importação' },
]

// Esconder o item da faixa é conveniência; quem protege os dados é a RLS de autorizacoes e de etapas.
export function AreaDeAdministracao({ usuario, acesso, processos, planilhas, importacao }: AreaDeAdministracaoProps) {
  const [aba, setAba] = useState<Aba>('usuarios')
  if (usuario.perfil !== 'administrador') {
    return (
      <p className="administracao-sem-permissao">
        Seu perfil ({rotuloDoPerfil(usuario.perfil)}) não permite administrar usuários. Peça a um administrador para
        mudar seu perfil.
      </p>
    )
  }
  return (
    <>
      <div className="administracao-abas" role="tablist" aria-label="Seções da Administração">
        {ABAS.filter(({ aba: esta }) => esta !== 'importacao' || importacao).map(({ aba: esta, rotulo }) => (
          <button key={esta} type="button" role="tab" className="administracao-aba" aria-selected={aba === esta}
            onClick={() => setAba(esta)}>{rotulo}</button>
        ))}
      </div>
      {aba === 'usuarios' && <AreaDeUsuarios acesso={acesso} />}
      {aba === 'catalogo' && <CatalogoDeEtapas catalogo={processos.catalogo} responsaveis={processos} />}
      {aba === 'planilhas' && <AreaDasPlanilhas planilhas={planilhas} />}
      {aba === 'importacao' && importacao && <AreaDaImportacao importacao={importacao} />}
    </>
  )
}
