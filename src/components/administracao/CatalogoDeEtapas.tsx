import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDoCatalogo } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { CatalogoEditavel } from './CatalogoEditavel'

type CatalogoDeEtapasProps = { catalogo: ModuloDoCatalogo }

/** Aba "Catálogo de etapas". Quem protege a gravação é a RLS; a aba só aparece ao administrador. */
export function CatalogoDeEtapas({ catalogo }: CatalogoDeEtapasProps) {
  const ler = useCallback(() => catalogo.listarCatalogo(), [catalogo])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  return (
    <section className="administracao" aria-labelledby="titulo-catalogo">
      <h2 id="titulo-catalogo" className="administracao-titulo">Catálogo de etapas</h2>
      {estado.tipo === 'carregando' && <p className="cadastros-vazio" role="status">Carregando catálogo…</p>}
      {estado.tipo === 'erro' && <ErroAoCarregar alvo="o catálogo" aoTentarDeNovo={tentarDeNovo} />}
      {estado.tipo === 'pronto' && <CatalogoEditavel catalogo={catalogo} etapas={estado.valor} aoMudar={recarregar} />}
    </section>
  )
}
