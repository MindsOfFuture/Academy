import '@testing-library/jest-dom'

// jsdom não implementa <dialog>.showModal/close. Os testes de integração rodam em
// ambiente node, sem DOM: lá HTMLDialogElement nem existe.
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement, v?: string) {
    if (v !== undefined) this.returnValue = v;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
