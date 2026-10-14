// ============================================================
// inactivar.js - Inactivacion masiva de alumnas por grupo
// ============================================================

import {
  getState, calcularEstadoPago, saveEventoActivo,
} from './store.js';
import { openModal, closeModal, showToast, confirmDialog } from './ui.js';

let _onDone = null;

export function abrirInactivador(onDone) {
  _onDone = onDone || null;
  renderModal();
}

function renderModal() {
  const state = getState();
  const participantes = state.eventoActivo.participantes || [];
  const grupos = ['Babys', 'Kids', 'Pre Teens', 'Adolescentes'];

  const gruposHtml = grupos.map(g => {
    const activas = participantes.filter(p => p.grupo === g && p.activa_en_evento !== false);
    const inactivas = participantes.filter(p => p.grupo === g && p.activa_en_evento === false);
    const total = activas.length + inactivas.length;
    if (total === 0) return '';

    const subgruposDisponibles = [...new Set(activas.map(p => p.subgrupo).filter(Boolean))].sort();

    return '<div class="card" style="padding:var(--c-spacing-4);margin-bottom:var(--c-spacing-3)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--c-spacing-3);flex-wrap:wrap;gap:var(--c-spacing-2)">' +
        '<strong style="font-size:var(--c-typography-headline6-size)">' + esc(g) + '</strong>' +
        '<span class="text-caption">' +
          '<span style="color:var(--c-color-text-success)">' + activas.length + ' activas</span> &middot; ' +
          '<span style="color:var(--c-color-text-subtle)">' + inactivas.length + ' inactivas</span>' +
        '</span>' +
      '</div>' +
      '<div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:var(--c-spacing-3)">' +
        '<label class="field"><span class="field__label">Subgrupo</span>' +
          '<select class="input input--select" data-grupo="' + escAttr(g) + '" data-rol="subgrupo">' +
            '<option value="">Todos los subgrupos</option>' +
            subgruposDisponibles.map(s => '<option value="' + escAttr(s) + '">' + esc(s) + '</option>').join('') +
          '</select></label>' +
        '<label class="field"><span class="field__label">Estado de pago</span>' +
          '<select class="input input--select" data-grupo="' + escAttr(g) + '" data-rol="estado">' +
            '<option value="">Todos los estados</option>' +
            '<option value="sin_pago">Sin pago</option>' +
            '<option value="parcial">Parcial</option>' +
            '<option value="pagado">Pagado</option>' +
            '<option value="bonificado">Bonificado</option>' +
          '</select></label>' +
      '</div>' +
      '<div style="margin-top:var(--c-spacing-3)">' +
        '<button class="btn btn--secondary btn--small" data-inactivar-grupo="' + escAttr(g) + '" type="button">Inactivar seleccionadas</button>' +
      '</div>' +
    '</div>';
  }).join('');

  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">Inactivar alumnas del evento</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">X</button>' +
    '</div>' +
    '<div class="modal__body">' +
      '<div class="alert alert--info">' +
        'Las alumnas inactivadas no se borran del sistema. Solo dejan de aparecer en la lista del evento activo. ' +
        'Se pueden reactivar editando cada alumna (checkbox <strong>Activa en este evento</strong>).' +
      '</div>' +
      gruposHtml +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cerrar</button>' +
    '</div>'
  );

  document.querySelectorAll('[data-inactivar-grupo]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const grupo = btn.dataset.inactivarGrupo;
      const subSel = document.querySelector('[data-grupo="' + grupo + '"][data-rol="subgrupo"]');
      const estSel = document.querySelector('[data-grupo="' + grupo + '"][data-rol="estado"]');
      const sub = subSel ? subSel.value : '';
      const est = estSel ? estSel.value : '';

      const aInactivar = participantes.filter(p => {
        if (p.grupo !== grupo) return false;
        if (p.activa_en_evento === false) return false;
        if (sub && p.subgrupo !== sub) return false;
        if (est && calcularEstadoPago(p).estado !== est) return false;
        return true;
      });

      if (aInactivar.length === 0) {
        showToast('No hay alumnas activas que coincidan con los filtros', 'warning');
        return;
      }

      const ok = await confirmDialog(
        'Inactivar alumnas',
        'Estas por inactivar <strong>' + aInactivar.length + ' alumnas</strong> del grupo <strong>' + esc(grupo) + '</strong>. ' +
        'No se borran del sistema, solo dejan de aparecer en este evento.'
      );
      if (!ok) return;

      for (const p of aInactivar) {
        p.activa_en_evento = false;
      }

      try {
        await saveEventoActivo('Inactivacion masiva ' + grupo + ' (' + aInactivar.length + ')');
        showToast(aInactivar.length + ' alumnas inactivadas en ' + grupo, 'success');
        renderModal();
        if (_onDone) _onDone();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });
  });
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escAttr(s) { return esc(s); }