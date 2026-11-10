// The public review build never submits applications, including scripted submit().
export function stopApplications(root = document) {
  for (const form of root.querySelectorAll('form')) {
    for (const name of ['action','method','target','onsubmit']) form.removeAttribute(name);
    form.addEventListener('submit', event => { event.preventDefault(); event.stopImmediatePropagation(); }, true);
    form.setAttribute('aria-disabled', 'true');
    for (const control of form.querySelectorAll('input,select,textarea,button')) {
      control.disabled = true; control.setAttribute('aria-disabled','true');
      control.removeAttribute('formaction'); control.removeAttribute('formtarget');
      if (control.tagName === 'BUTTON') control.type = 'button';
    }
    if (!form.querySelector('.application-paused')) {
      const note = document.createElement('p'); note.className='application-paused'; note.setAttribute('role','note');
      note.textContent='現在、応募フォームからの送信は停止しています。'; form.prepend(note);
    }
  }
}

export function installApplicationGuard() {
  document.addEventListener('submit', event => { event.preventDefault(); event.stopImmediatePropagation(); }, true);
}
