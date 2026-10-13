// ============================================================
// views/dashboard.js — Primera vista con cards de entidades
// ============================================================

import { getState, getParticipantesEvento, calcularEstadoPago } from '../store.js';

export function renderDashboard(container) {
  const state = getState();
  const participantes = getParticipantesEvento();

  const alumnasActivas = state.alumnas.filter((a) => a.activa_global !== false).length;
  const disenosTotal = state.disenos.length;

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
    '<p class="text-bodysmall" style="color: var(--c-color-text-subtle);">' +
      'Evento activo: <strong>' + (state.eventoActivo ? state.eventoActivo.nombre : '—') + '</strong>' +
    '</p>' +
    '<div class="cards-grid">' +
      '<a href="#/alumnas" class="card card--interactive">' +
        '<div class="card__header">' +
          '<span class="card__title">Alumnas</span>' +
          '<span class="badge badge--info">' + participantes.length + '</span>' +
        '</div>' +
        '<div class="card__value">' + alumnasActivas + '</div>' +
        '<div class="card__meta">activas en el sistema</div>' +
      '</a>' +
      '<a href="#/disenos" class="card card--interactive">' +
        '<div class="card__header">' +
          '<span class="card__title">Diseños</span>' +
          '<span class="badge badge--info">' + disenosTotal + '</span>' +
        '</div>' +
        '<div class="card__value">' + disenosTotal + '</div>' +
        '<div class="card__meta">cargados en el catálogo</div>' +
      '</a>' +
      '<a href="#/eventos" class="card card--interactive">' +
        '<div class="card__header">' +
          '<span class="card__title">Eventos</span>' +
        '</div>' +
        '<div class="card__value">' + (state.config && state.config.evento_activo ? 1 : 0) + '</div>' +
        '<div class="card__meta">activo: ' + (state.eventoActivo ? state.eventoActivo.id : '—') + '</div>' +
      '</a>' +
      '<a href="#/pagos" class="card card--interactive">' +
        '<div class="card__header">' +
          '<span class="card__title">Pagos</span>' +
        '</div>' +
        '<div class="card__value">' + fmt(porCobrar) + '</div>' +
        '<div class="card__meta">por cobrar · ' + fmt(pagado) + ' cobrado</div>' +
      '</a>' +
      '<a href="#/reportes" class="card card--interactive">' +
        '<div class="card__header">' +
          '<span class="card__title">Reportes</span>' +
        '</div>' +
        '<div class="card__value">5</div>' +
        '<div class="card__meta">tipos de reportes disponibles</div>' +
      '</a>' +
    '</div>';
}