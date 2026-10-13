// ============================================================
// ui.js - Helpers de UI: toast, modal, confirm, FAB
// ============================================================

export function showToast(msg, type) {
  type = type || 'info';
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast toast--' + type;
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

let _onClose = null;

export function openModal(html, onClose) {
  const root = document.getElementById('modal-root');
  root.hidden = false;
  root.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
  _onClose = onClose || null;
  root.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
  root.addEventListener('click', e => { if (e.target === root) closeModal(); });
  const first = root.querySelector('input, select, textarea, button');
  if (first) first.focus();
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  root.hidden = true;
  root.innerHTML = '';
  if (_onClose) { const f = _onClose; _onClose = null; f(); }
}

export function confirmDialog(title, msg) {
  return new Promise(resolve => {
    let done = false;
    const finish = v => { if (!done) { done = true; resolve(v); } };
    openModal(
      '<div class="modal__header">' +
        '<h2 class="modal__title">' + title + '</h2>' +
        '<button class="kebab" type="button" data-close aria-label="Cerrar">X</button>' +
      '</div>' +
      '<div class="modal__body"><p>' + msg + '</p></div>' +
      '<div class="modal__footer">' +
        '<button class="btn btn--ghost" type="button" data-close>Cancelar</button>' +
        '<button class="btn btn--primary" type="button" id="confirm-ok">Confirmar</button>' +
      '</div>',
      () => finish(false)
    );
    document.getElementById('confirm-ok').addEventListener('click', () => {
      _onClose = null;
      finish(true);
      closeModal();
    });
  });
}

export function setFab(label, onClick) {
  const fab = document.getElementById('fab');
  if (!label) { fab.hidden = true; fab.onclick = null; return; }
  fab.hidden = false;
  fab.setAttribute('aria-label', label);
  fab.onclick = onClick;
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });