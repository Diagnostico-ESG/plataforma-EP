import type { EstadoDaEntrada, ModuloDeAcesso } from './tipos'

// A RLS já não entrega dados ao inativo; aqui a interface encerra a sessão e explica o motivo.
export async function conferirAcesso(acesso: ModuloDeAcesso): Promise<EstadoDaEntrada> {
  const recusa = acesso.recusaNaChegada()
  const sessao = await acesso.sessaoAtual()
  if (!sessao) return { tipo: 'fora', recusa }
  const usuario = await acesso.lerProprioUsuario(sessao.usuarioId)
  if (usuario?.ativo) return { tipo: 'dentro', usuario }
  await acesso.sair()
  const motivo = usuario ? 'inativo' : 'sem_autorizacao'
  return { tipo: 'fora', recusa: { motivo, email: sessao.email } }
}
