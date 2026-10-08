// O jsdom não implementa showModal/close de <dialog>; este é o mínimo para os testes de interface.
// O teste do hook em .claude/hooks roda em Node puro, sem DOM: nele não há nada a preparar.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close() {
    if (!this.open) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
