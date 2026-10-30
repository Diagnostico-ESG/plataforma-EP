import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeProcessos, ModuloDoCatalogo } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { CatalogoEditavel } from './CatalogoEditavel'

type CatalogoDeEtapasProps = {
  catalogo: ModuloDoCatalogo
  /** De onde vem a lista de quem pode ser responsável inicial; o módulo inteiro, de identidade estável. */
  responsaveis: Pick<ModuloDeProcessos, 'listarResponsaveisPossiveis'>
}

/** Aba "Catálogo de etapas". Quem protege a gravação é a RLS; a aba só aparece ao administrador. */
export function CatalogoDeEtapas({ catalogo, responsaveis }: CatalogoDeEtapasProps) {
  const ler = useCallback(() => catalogo.listarCatalogo(), [catalogo])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const lerUsuarios = useCallback(() => responsaveis.listarResponsaveisPossiveis(), [responsaveis])
  const usuarios = useCarregamento(lerUsuarios)
  return (
    <section className="administracao" aria-labelledby="titulo-catalogo">
      <h2 id="titulo-catalogo" className="administracao-titulo">Catálogo de etapas</h2>
      {estado.tipo === 'carregando' && <p className="cadastros-vazio" role="status">Carregando catálogo…</p>}
      {estado.tipo === 'erro' && <ErroAoCarregar alvo="o catálogo" aoTentarDeNovo={tentarDeNovo} />}
      {usuarios.estado.tipo === 'erro' && (
        <p className="cadastros-falha" role="alert">
          Não foi possível carregar os usuários.{' '}
          <button type="button" className="botao botao-secundario" onClick={usuarios.tentarDeNovo}>Tentar de novo</button>
        </p>
      )}
      {estado.tipo === 'pronto' && (
        <CatalogoEditavel catalogo={catalogo} etapas={estado.valor} aoMudar={recarregar}
          usuarios={usuarios.estado.tipo === 'pronto' ? usuarios.estado.valor : []} />
      )}
    </section>
  )
}
