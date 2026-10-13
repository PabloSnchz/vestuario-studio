// ============================================================
// views/disenos.js - Galeria de disenos con detalle
// ============================================================

import { getState } from '../store.js';
import { setFab, openModal, closeModal } from '../ui.js';

const filtros = { tematica: '', grupo: '' };

export function renderDisenos(container) {
  setFab(null);
  const state = getState();
  const disenos = state.disenos || [];
  const tematicas = uniq(disenos.map(d => d.tematica));
  const grupos = uniq(disenos.map(d => d.grupo));

  const filtrados = disenos.filter(d => {
    if (filtros.tematica && d.tematica !== filtros.tematica) return false;
    if (filtros.grupo && d.grupo !== filtros.grupo) return false;
    return true;
  });

  container.innerHTML =
    '<h1 class="text-headline4">Disenos</h1>' +
    '<div class="toolbar">' +
      '<div class="toolbar__filters">' +
        sel('Tematica', 'tematica', tematicas, filtros.tematica) +
        sel('Grupo',    'grupo',    grupos,    filtros.grupo) +
      '</div>' +
      '<div class="toolbar__actions">' +
        '<span class="text-caption">' + filtrados.length + ' disenos</span>' +
      '</div>' +
    '</div>' +
    '<div class="cards-grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">' +
      (filtrados.length === 0
        ? '<div class="empty-state">Sin disenos cargados</div>'
        : filtrados.map(cardHtml).join('')) +
    '</div>';

  container.querySelectorAll('select[data-f]').forEach(el => {
    el.addEventListener('change', () => {
      filtros[el.dataset.f] = el.value;
      renderDisenos(container);
    });
  });

  container.querySelectorAll('[data-diseno-id]').forEach(btn => {
    btn.addEventListener('click', () => verDetalle(btn.dataset.disenoId));
  });
}

function cardHtml(d) {
  const img = d.imagen
    ? '<div style="width:100%;height:280px;background:var(--c-color-surface-neutral-subtle);border-radius:var(--c-border-radius-xsmall);display:flex;align-items:center;justify-content:center;overflow:hidden;padding:var(--c-spacing-2)">' +
        '<img src="' + escAttr(d.imagen) + '" alt="' + escAttr(d.nombre) + '" loading="lazy" ' +
          'style="max-width:100%;max-height:100%;object-fit:contain;">' +
      '</div>'
    : '<div style="width:100%;height:280px;background:var(--c-color-surface-neutral-subtle);border-radius:var(--c-border-radius-xsmall);display:flex;align-items:center;justify-content:center;color:var(--c-color-text-subtle)">Sin imagen</div>';

  return '<div class="card card--interactive" data-diseno-id="' + escAttr(d.id) + '" role="button" tabindex="0" title="Click para ver detalle">' +
    img +
    '<div class="card__title">' + esc(d.nombre) + '</div>' +
    '<div class="card__meta">' + esc(d.tematica || '-') + ' - ' + esc(d.grupo || '-') + '</div>' +
    '<div class="card__value" style="font-size:var(--c-typography-headline5-size)">$' +
      (Number(d.precio_base || 0)).toLocaleString('es-AR') + '</div>' +
    '<div class="text-caption">' + esc(d.tipologia || '') + '</div>' +
    (d.materiales
      ? '<div class="text-bodysmall" style="color:var(--c-color-text-subtle);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4;">' +
          esc(d.materiales) +
        '</div>'
      : '') +
  '</div>';
}

function verDetalle(disenoId) {
  const state = getState();
  const d = (state.disenos || []).find(x => x.id === disenoId);
  if (!d) return;

  const img = d.imagen
    ? '<div style="width:100%;background:var(--c-color-surface-neutral-subtle);border-radius:var(--c-border-radius-small);padding:var(--c-spacing-4);display:flex;justify-content:center;">' +
        '<img src="' + escAttr(d.imagen) + '" alt="' + escAttr(d.nombre) + '" style="max-width:100%;max-height:60vh;object-fit:contain;">' +
      '</div>'
    : '<div class="alert alert--info">Sin imagen cargada</div>';

  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">' + esc(d.nombre) + '</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">X</button>' +
    '</div>' +
    '<div class="modal__body">' +
      img +
      '<div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:var(--c-spacing-3)">' +
        '<div><div class="text-caption">Tematica</div><p>' + esc(d.tematica || '-') + '</p></div>' +
        '<div><div class="text-caption">Grupo</div><p>' + esc(d.grupo || '-') + '</p></div>' +
        '<div><div class="text-caption">Subgrupo</div><p>' + esc(d.subgrupo || '-') + '</p></div>' +
        '<div><div class="text-caption">Tipologia</div><p>' + esc(d.tipologia || '-') + '</p></div>' +
      '</div>' +
      '<div><div class="text-caption">Precio base</div>' +
        '<p class="text-headline5">$' + Number(d.precio_base || 0).toLocaleString('es-AR') + '</p>' +
      '</div>' +
      (d.materiales
        ? '<div><div class="text-caption">Descripcion / Materiales</div>' +
            '<p style="white-space:pre-wrap;line-height:1.5">' + esc(d.materiales) + '</p></div>'
        : '') +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cerrar</button>' +
    '</div>'
  );
}

function sel(label, id, options, current) {
  return '<select class="input input--select" data-f="' + id + '" aria-label="' + label + '">' +
    '<option value="">' + label + ': todos</option>' +
    options.map(o =>
      '<option value="' + escAttr(o) + '"' + (o === current ? ' selected' : '') + '>' + esc(o) + '</option>'
    ).join('') +
  '</select>';
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escAttr(s) { return esc(s); }