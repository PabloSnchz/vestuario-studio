// ============================================================
// views/disenos.js - Galeria de disenos
// ============================================================

import { getState } from '../store.js';
import { setFab } from '../ui.js';

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
      '<div class="toolbar__actions"></div>' +
    '</div>' +
    '<div class="cards-grid">' +
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
}

function cardHtml(d) {
  const img = d.imagen
    ? '<img src="' + escAttr(d.imagen) + '" alt="" loading="lazy" ' +
      'style="width:100%;height:200px;object-fit:cover;border-radius:var(--c-border-radius-xsmall);background:var(--c-color-surface-neutral-subtle)">'
    : '';
  return '<div class="card">' +
    img +
    '<div class="card__title">' + esc(d.nombre) + '</div>' +
    '<div class="card__meta">' + esc(d.tematica || '-') + ' - ' + esc(d.grupo || '-') + '</div>' +
    '<div class="card__value" style="font-size:var(--c-typography-headline5-size)">$' +
      (Number(d.precio_base || 0)).toLocaleString('es-AR') + '</div>' +
    '<div class="text-caption">' + esc(d.tipologia || '') + '</div>' +
  '</div>';
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