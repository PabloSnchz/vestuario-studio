// ============================================================
// reincorporar.js - Reincorporar alumnas al evento activo
// ============================================================

import {
  getState, getAlumnasFueraDelEvento, saveEventoActivo,
} from './store.js';
import { openModal, closeModal, showToast } from './ui.js';
import { icons } from './icons.js';

let _onDone = null;

export function abrirReincorporador(onDone) {
  _onDone = onDone || null;
  renderModal('');
}

function renderModal(filtro) {
  const state = getState();
  const alumnasFuera = getAlumnasFueraDelEvento();
  const grupos = state.config.grupos || [];
  const subgrupos = state.config.subgrupos || [];

  const filtradas = filtro
    ? alumnasFuera.filter(a => a.nombre.toLowerCase().includes(filtro.toLowerCase()))
    : alumnasFuera;

  const listaHtml = filtradas.length === 0
    ? '<div class="empty-state" style="padding:var(--c-spacing-5)">' +
        (alumnasFuera.length === 0
          ? 'Todas las alumnas del maestro ya estan en el evento'
          : 'Sin resultados') +
      '</div>'
    : filtradas.map(a =>
        '<button class="btn btn--ghost" type="button" data-reinc-id="' + escAttr(a.id) + '" style="width:100%;text-align:left;justify-content:flex-start;padding:var(--c-spacing-3);border-radius:var(--c-border-radius-small);border:1px solid var(--c-color-border-subtle);margin-bottom:6px;height:auto">' +
          '<div style="display:flex;flex-direction:column;gap:2px">' +
            '<strong style="color:var(--c-color-text-strong)">' + esc(a.nombre) + '</strong>' +
            '<span class="text-caption">' + esc(a.id) + '</span>' +
          '</div>' +
        '</button>'
      ).join('');

  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">Reincorporar alumna al evento</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">' + icons.close + '</button>' +
    '</div>' +
    '<div class="modal__body">' +
      '<div class="alert alert--info">' +
        'Lista de alumnas del maestro que NO estan en el evento activo. ' +
        'Al reincorporar, se te van a pedir grupo, subgrupo y precio.' +
      '</div>' +
      '<label class="field"><span class="field__label">Buscar por nombre</span>' +
        '<input class="input" id="reinc-buscar" placeholder="Nombre..." value="' + escAttr(filtro) + '"></label>' +
      '<div style="max-height:400px;overflow-y:auto">' + listaHtml + '</div>' +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cerrar</button>' +
    '</div>'
  );

  const inp = document.getElementById('reinc-buscar');
  if (inp) {
    inp.addEventListener('input', (e) => {
      const val = e.target.value;
      clearTimeout(window.__reincT);
      window.__reincT = setTimeout(() => {
        renderModal(val);
        const inp2 = document.getElementById('reinc-buscar');
        if (inp2) { inp2.focus(); inp2.setSelectionRange(inp2.value.length, inp2.value.length); }
      }, 200);
    });
  }

  document.querySelectorAll('[data-reinc-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.reincId;
      const al = alumnasFuera.find(x => x.id === id);
      if (al) abrirFormReincorporar(al, grupos, subgrupos);
    });
  });
}

function abrirFormReincorporar(al, grupos, subgrupos) {
  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">Reincorporar: ' + esc(al.nombre) + '</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">' + icons.close + '</button>' +
    '</div>' +
    '<div class="modal__body">' +
      '<div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:var(--c-spacing-3)">' +
        '<label class="field"><span class="field__label">Grupo</span>' +
          '<select class="input input--select" id="r-grupo">' +
            grupos.map(g => '<option>' + esc(g) + '</option>').join('') +
          '</select></label>' +
        '<label class="field"><span class="field__label">Subgrupo</span>' +
          '<select class="input input--select" id="r-subgrupo">' +
            subgrupos.map(s => '<option>' + esc(s) + '</option>').join('') +
          '</select></label>' +
        '<label class="field"><span class="field__label">Precio final</span>' +
          '<input class="input" type="number" id="r-precio" value="0"></label>' +
      '</div>' +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cancelar</button>' +
      '<button class="btn btn--primary" type="button" id="r-guardar">Reincorporar</button>' +
    '</div>'
  );

  document.getElementById('r-guardar').addEventListener('click', async () => {
    const grupo = document.getElementById('r-grupo').value;
    const subgrupo = document.getElementById('r-subgrupo').value;
    const precio = Number(document.getElementById('r-precio').value) || 0;
    const mitad = Math.round(precio / 2);

    const state2 = getState();
    state2.eventoActivo.participantes.push({
      alumna_id: al.id,
      grupo,
      subgrupo,
      diseno_id: '',
      tipologia: '',
      precio_final: precio,
      bonificacion: 0,
      cuotas: [
        { nro: 1, monto: mitad, pagado: false, fecha: null },
        { nro: 2, monto: precio - mitad, pagado: false, fecha: null },
      ],
      notas: '',
    });

    try {
      await saveEventoActivo('Reincorporar ' + al.nombre);
      closeModal();
      showToast(al.nombre + ' reincorporada al evento', 'success');
      if (_onDone) _onDone();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escAttr(s) { return esc(s); }