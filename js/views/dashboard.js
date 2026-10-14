// ============================================================
// views/dashboard.js - Resumen con iconos
// ============================================================

import { getState, getParticipantesEvento, calcularEstadoPago } from '../store.js';
import { setFab } from '../ui.js';
import { icons } from '../icons.js';

export function renderDashboard(container) {
  setFab(null);
  const state = getState();
  const participantes = getParticipantesEvento();

  const alumnasActivas = state.alumnas.filter((a) => a.activa_global !== false).length;
  const disenosTotal = state.disenos.length;
  const eventosTotal = (state.config && state.config.eventos) ? state.config.eventos.length : 0;

  let pagado = 0;
  let porCobrar = 0;
  for (const p of participantes) {
    const r = calcularEstadoPago(p);
    pagado += r.pagado;
    porCobrar += r.debe;
  }

  const fmt = (n) => '$' + n.toLocaleString('es-AR');

  container.innerHTML =
    '<h1 class="text-headline4">Dashboard</h1>' +
    '<p class="text-bodysmall" style="color:var(--c-color-text-subtle)">' +
      'Evento activo: <strong>' + (state.eventoActivo ? state.eventoActivo.nombre : '-') + '</strong>' +
    '</p>' +
    '<div class="cards-grid" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))">' +

      cardIcono({
        href: '#/alumnas',
        icono: 'usersLg',
        titulo: 'Alumnas',
        valor: alumnasActivas,
        meta: 'activas en el sistema',
        badge: participantes.length + ' en evento',
        color: 'var(--c-color-fill-info)',
      }) +

      cardIcono({
        href: '#/disenos',
        icono: 'shirtLg',
        titulo: 'Disenos',
        valor: disenosTotal,
        meta: 'cargados en el catalogo',
        color: 'var(--c-color-fill-primary)',
      }) +

      cardIcono({
        href: '#/eventos',
        icono: 'calendarLg',
        titulo: 'Eventos',
        valor: eventosTotal,
        meta: 'activo: ' + (state.eventoActivo ? state.eventoActivo.id : '-'),
        color: 'var(--c-color-fill-success)',
      }) +

      cardIcono({
        href: '#/pagos',
        icono: 'moneyLg',
        titulo: 'Pagos',
        valor: fmt(porCobrar),
        meta: 'por cobrar',
        badge: fmt(pagado) + ' cobrado',
        color: 'var(--c-color-fill-caution)',
      }) +

      cardIcono({
        href: '#/reportes',
        icono: 'chartLg',
        titulo: 'Reportes',
        valor: 5,
        meta: 'indicadores disponibles',
        color: 'var(--c-color-fill-warning)',
      }) +

    '</div>';
}

function cardIcono(opts) {
  return '<a href="' + opts.href + '" class="card card--interactive" style="text-decoration:none;position:relative;overflow:hidden;">' +
    '<div style="position:absolute;top:-8px;right:-8px;color:' + opts.color + ';opacity:0.12;pointer-events:none">' +
      '<div style="width:96px;height:96px;display:flex;align-items:center;justify-content:center">' +
        (icons[opts.icono] || '') +
      '</div>' +
    '</div>' +
    '<div style="position:relative">' +
      '<div style="display:flex;align-items:center;gap:var(--c-spacing-2);color:' + opts.color + ';margin-bottom:var(--c-spacing-3)">' +
        '<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center">' +
          (icons[opts.icono] || '') +
        '</div>' +
        '<span class="card__title" style="color:var(--c-color-text-strong)">' + opts.titulo + '</span>' +
      '</div>' +
      '<div class="card__value">' + opts.valor + '</div>' +
      '<div class="card__meta">' + opts.meta + '</div>' +
      (opts.badge ? '<div class="text-caption" style="margin-top:var(--c-spacing-2);color:' + opts.color + '">' + opts.badge + '</div>' : '') +
    '</div>' +
  '</a>';
}