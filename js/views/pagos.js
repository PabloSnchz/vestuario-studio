// ============================================================
// views/pagos.js - Registro y edicion de pagos
// ============================================================

import {
  getState, getParticipantesEvento, calcularEstadoPago,
  findAlumna, findDiseno, saveEventoActivo,
} from '../store.js';
import { setFab, openModal, closeModal, showToast } from '../ui.js';

const filtros = { grupo: '', estado: '', q: '' };

export function renderPagos(container) {
  setFab(null);
  const participantes = getParticipantesEvento();
  const grupos = uniq(participantes.map(p => p.grupo));
  const filtrados = aplicarFiltros(participantes);

  let totalPagar = 0, totalPagado = 0;
  for (const p of filtrados) {
    const r = calcularEstadoPago(p);
    totalPagar += r.aPagar;
    totalPagado += r.pagado;
  }

  container.innerHTML =
    '<h1 class="text-headline4">Pagos</h1>' +
    '<div class="cards-grid" style="grid-template-columns:repeat(3,1fr)">' +
      card('Total a pagar', totalPagar) +
      card('Cobrado', totalPagado, 'success') +
      card('Por cobrar', totalPagar - totalPagado, 'caution') +
    '</div>' +
    '<div class="toolbar">' +
      '<div class="toolbar__filters">' +
        sel('Grupo',  'grupo',  grupos, ['pagado','parcial','sin_pago','bonificado'], filtros.grupo) +
        sel('Estado', 'estado', null,  ['pagado','parcial','sin_pago','bonificado'], filtros.estado) +
        '<input class="input" style="width:220px" type="search" data-f="q" placeholder="Buscar..." value="' + escAttr(filtros.q) + '">' +
      '</div>' +
    '</div>' +
    tablaHtml(filtrados);

  wire(container);
}

function card(label, value, variante) {
  const color = variante === 'success' ? 'var(--c-color-text-success)' :
                variante === 'caution' ? 'var(--c-color-text-caution)' : 'var(--c-color-text-strong)';
  return '<div class="card">' +
    '<div class="card__meta">' + label + '</div>' +
    '<div class="card__value" style="color:' + color + '">$' + value.toLocaleString('es-AR') + '</div>' +
  '</div>';
}

function aplicarFiltros(participantes) {
  return participantes.filter(p => {
    if (filtros.grupo && p.grupo !== filtros.grupo) return false;
    if (filtros.estado) {
      const r = calcularEstadoPago(p);
      if (r.estado !== filtros.estado) return false;
    }
    if (filtros.q) {
      const al = findAlumna(p.alumna_id);
      if (!(al ? al.nombre : '').toLowerCase().includes(filtros.q.toLowerCase())) return false;
    }
    return true;
  });
}

function tablaHtml(filtrados) {
  return '<div class="table-wrapper"><table class="table">' +
    '<thead><tr>' +
      '<th>Alumna</th><th>Grupo</th><th>Precio</th><th>Bonif.</th>' +
      '<th>C1</th><th>C2</th><th>Debe</th><th>Estado</th><th></th>' +
    '</tr></thead>' +
    '<tbody>' +
      (filtrados.length === 0
        ? '<tr><td colspan="9"><div class="empty-state">Sin resultados</div></td></tr>'
        : filtrados.map(rowHtml).join('')) +
    '</tbody>' +
  '</table></div>';
}

function rowHtml(p) {
  const al = findAlumna(p.alumna_id);
  const r = calcularEstadoPago(p);
  const c1 = p.cuotas && p.cuotas[0];
  const c2 = p.cuotas && p.cuotas[1];
  const labels = { pagado: 'Pagado', parcial: 'Parcial', sin_pago: 'Sin pago', bonificado: 'Bonificado' };
  const clases = { pagado: 'success', parcial: 'caution', sin_pago: 'error', bonificado: 'info' };
  return '<tr data-id="' + escAttr(p.alumna_id) + '">' +
    '<td>' + esc(al ? al.nombre : '-') + '</td>' +
    '<td>' + esc(p.grupo || '-') + '</td>' +
    '<td>$' + Number(p.precio_final || 0).toLocaleString('es-AR') + '</td>' +
    '<td>' + (p.bonificacion ? '$' + Number(p.bonificacion).toLocaleString('es-AR') : '-') + '</td>' +
    '<td>' + cuotaBadge(c1) + '</td>' +
    '<td>' + cuotaBadge(c2) + '</td>' +
    '<td>$' + r.debe.toLocaleString('es-AR') + '</td>' +
    '<td><span class="badge badge--' + (clases[r.estado] || 'neutral') + '">' + (labels[r.estado] || r.estado) + '</span></td>' +
    '<td><div class="table__actions"><button class="kebab" data-editar aria-label="Editar pago">...</button></div></td>' +
  '</tr>';
}

function cuotaBadge(c) {
  if (!c) return '-';
  return c.pagado
    ? '<span class="badge badge--success">$' + Number(c.monto).toLocaleString('es-AR') + '</span>'
    : '<span class="badge badge--neutral">$' + Number(c.monto).toLocaleString('es-AR') + '</span>';
}

function wire(container) {
  container.querySelectorAll('select[data-f]').forEach(el => {
    el.addEventListener('change', () => { filtros[el.dataset.f] = el.value; renderPagos(container); });
  });
  const q = container.querySelector('input[data-f="q"]');
  if (q) {
    let t;
    q.addEventListener('input', () => {
      filtros.q = q.value;
      clearTimeout(t);
      t = setTimeout(() => renderPagos(container), 200);
    });
  }
  container.querySelectorAll('[data-editar]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      editarPago(row.dataset.id, container);
    });
  });
}

function editarPago(alumnaId, container) {
  const state = getState();
  const participantes = state.eventoActivo.participantes;
  const p = participantes.find(x => x.alumna_id === alumnaId);
  if (!p) return;
  const al = findAlumna(alumnaId);
  const c1 = (p.cuotas && p.cuotas[0]) || { nro: 1, monto: 0, pagado: false, fecha: null };
  const c2 = (p.cuotas && p.cuotas[1]) || { nro: 2, monto: 0, pagado: false, fecha: null };

  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">' + esc(al ? al.nombre : 'Alumna') + '</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">X</button>' +
    '</div>' +
    '<div class="modal__body">' +
      '<div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:var(--c-spacing-3)">' +
        '<label class="field"><span class="field__label">Precio final</span>' +
          '<input class="input" type="number" id="p-precio" value="' + (p.precio_final || 0) + '"></label>' +
        '<label class="field"><span class="field__label">Bonificacion</span>' +
          '<input class="input" type="number" id="p-bonif" value="' + (p.bonificacion || 0) + '"></label>' +
      '</div>' +
      '<hr style="border:none;border-top:1px solid var(--c-color-border-subtle)">' +
      '<div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:var(--c-spacing-3)">' +
        '<label class="field"><span class="field__label">Cuota 1 monto</span>' +
          '<input class="input" type="number" id="c1-monto" value="' + (c1.monto || 0) + '"></label>' +
        '<label class="field"><span class="field__label">Cuota 1 pagada</span>' +
          '<input type="checkbox" id="c1-pagado" ' + (c1.pagado ? 'checked' : '') + '></label>' +
        '<label class="field"><span class="field__label">Cuota 1 fecha</span>' +
          '<input class="input" type="date" id="c1-fecha" value="' + (c1.fecha || '') + '"></label>' +
      '</div>' +
      '<div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:var(--c-spacing-3)">' +
        '<label class="field"><span class="field__label">Cuota 2 monto</span>' +
          '<input class="input" type="number" id="c2-monto" value="' + (c2.monto || 0) + '"></label>' +
        '<label class="field"><span class="field__label">Cuota 2 pagada</span>' +
          '<input type="checkbox" id="c2-pagado" ' + (c2.pagado ? 'checked' : '') + '></label>' +
        '<label class="field"><span class="field__label">Cuota 2 fecha</span>' +
          '<input class="input" type="date" id="c2-fecha" value="' + (c2.fecha || '') + '"></label>' +
      '</div>' +
      '<label class="field"><span class="field__label">Notas</span>' +
        '<textarea class="input input--textarea" id="p-notas">' + esc(p.notas || '') + '</textarea></label>' +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cancelar</button>' +
      '<button class="btn btn--primary" type="button" id="p-guardar">Guardar</button>' +
    '</div>',
    null
  );

  document.getElementById('p-guardar').addEventListener('click', async () => {
    p.precio_final = Number(document.getElementById('p-precio').value) || 0;
    p.bonificacion = Number(document.getElementById('p-bonif').value) || 0;
    p.cuotas = [
      {
        nro: 1,
        monto: Number(document.getElementById('c1-monto').value) || 0,
        pagado: document.getElementById('c1-pagado').checked,
        fecha: document.getElementById('c1-fecha').value || null,
      },
      {
        nro: 2,
        monto: Number(document.getElementById('c2-monto').value) || 0,
        pagado: document.getElementById('c2-pagado').checked,
        fecha: document.getElementById('c2-fecha').value || null,
      },
    ];
    p.notas = document.getElementById('p-notas').value.trim();
    try {
      await saveEventoActivo('Actualizar pago ' + alumnaId);
      closeModal();
      showToast('Pago actualizado', 'success');
      renderPagos(container);
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  });
}

function sel(label, id, options, fallback, current) {
  const opts = options || fallback || [];
  return '<select class="input input--select" data-f="' + id + '" aria-label="' + label + '">' +
    '<option value="">' + label + ': todos</option>' +
    opts.map(o => '<option value="' + escAttr(o) + '"' + (o === current ? ' selected' : '') + '>' + esc(o) + '</option>').join('') +
  '</select>';
}

function uniq(arr) { return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escAttr(s) { return esc(s); }