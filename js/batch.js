// ============================================================
// batch.js - Modo edicion por lote (overlay full-screen)
// ============================================================

import {
  getState, saveAlumnas, saveEventoActivo,
} from './store.js';
import { showToast, confirmDialog } from './ui.js';
import { icons } from './icons.js';

let borrador = null;
let dirty = false;
let overlayEl = null;
let _onClose = null;
let filtroGrupo = '';

export function abrirModoEdicion(onClose) {
  const state = getState();
  if (!state.eventoActivo) {
    showToast('No hay evento activo', 'warning');
    return;
  }

  borrador = {
    participantes: JSON.parse(JSON.stringify(state.eventoActivo.participantes || [])),
    alumnas: JSON.parse(JSON.stringify(state.alumnas || [])),
    altas: [],
  };
  dirty = false;
  _onClose = onClose || null;

  overlayEl = document.createElement('div');
  overlayEl.id = 'batch-overlay';
  overlayEl.style.cssText = 'position:fixed;inset:0;background:var(--c-color-bg);z-index:90;display:flex;flex-direction:column;overflow:hidden;';
  document.body.appendChild(overlayEl);

  window.addEventListener('beforeunload', warnBeforeUnload);
  renderOverlay();
}

function warnBeforeUnload(e) {
  if (dirty) {
    e.preventDefault();
    e.returnValue = '';
  }
}

function cerrarOverlay() {
  if (overlayEl) { overlayEl.remove(); overlayEl = null; }
  window.removeEventListener('beforeunload', warnBeforeUnload);
  borrador = null;
  dirty = false;
  if (_onClose) { const f = _onClose; _onClose = null; f(); }
}

function marcarDirty() {
  dirty = true;
  const counter = document.getElementById('batch-counter');
  if (counter) {
    counter.textContent = '1 o mas cambios sin guardar';
    counter.style.color = 'var(--c-color-text-caution)';
  }
  const btnGuardar = document.getElementById('batch-guardar');
  if (btnGuardar) btnGuardar.disabled = false;
}

function renderOverlay() {
  const state = getState();

  const activas = borrador.participantes.filter(p => p.activa_en_evento !== false).length;
  const inactivas = borrador.participantes.filter(p => p.activa_en_evento === false).length;

  overlayEl.innerHTML =
    '<div style="background:var(--c-color-surface);border-bottom:1px solid var(--c-color-border-subtle);padding:var(--c-spacing-4) var(--c-spacing-6);display:flex;align-items:center;justify-content:space-between;gap:var(--c-spacing-4);box-shadow:var(--c-shadow-bottom-subtle);flex-wrap:wrap">' +
      '<div>' +
        '<h1 style="margin:0;font-family:var(--c-font-family-headline);font-size:20px;font-weight:700;color:var(--c-color-text-strong)">Modo edicion por lote</h1>' +
        '<p style="margin:0;font-size:12px;color:var(--c-color-text-subtle)">' +
          'Edita lo que necesites y guarda todo junto en un solo commit. ' +
          '<span id="batch-counter" style="color:var(--c-color-text-subtle)">Sin cambios</span>' +
        '</p>' +
      '</div>' +
      '<div style="display:flex;gap:8px;align-items:center">' +
        '<span class="text-caption">' + activas + ' activas | ' + inactivas + ' inactivas</span>' +
        '<button class="btn btn--ghost btn--small" type="button" id="batch-descartar">Descartar</button>' +
        '<button class="btn btn--primary btn--small" type="button" id="batch-guardar" disabled>Guardar cambios</button>' +
      '</div>' +
    '</div>' +

    '<div style="flex:1;overflow-y:auto;padding:24px 32px">' +
      '<div class="alert alert--info" style="margin-bottom:16px">' +
        'Cambia lo que necesites. Los cambios se acumulan en memoria y se guardan todos juntos al final. ' +
        'Podes agregar alumnas nuevas con el boton <strong>+ Agregar alumna</strong> al pie de la lista.' +
      '</div>' +

      '<div id="batch-chips" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px"></div>' +

      '<div class="table-wrapper" style="background:var(--c-color-surface);border-radius:8px">' +
        '<table class="table" style="width:100%">' +
          '<thead>' +
            '<tr>' +
              '<th style="width:60px;text-align:center">Activa</th>' +
              '<th>Alumna</th>' +
              '<th style="width:160px">Grupo</th>' +
              '<th style="width:160px">Subgrupo</th>' +
              '<th style="width:140px">Precio</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody id="batch-tbody"></tbody>' +
        '</table>' +
      '</div>' +

      '<div style="margin-top:16px;text-align:center">' +
        '<button class="btn btn--secondary btn--small" type="button" id="batch-agregar">+ Agregar alumna nueva</button>' +
      '</div>' +
    '</div>';

  renderTbody();

  document.getElementById('batch-descartar').addEventListener('click', descartar);
  document.getElementById('batch-guardar').addEventListener('click', guardar);
  document.getElementById('batch-agregar').addEventListener('click', agregarAlta);
}

function renderTbody() {
  const tbody = document.getElementById('batch-tbody');
  if (!tbody) return;
  renderChips();

  const state = getState();
  const grupos = state.config.grupos || [];
  const subgrupos = state.config.subgrupos || [];

  const participantesFiltrados = filtroGrupo
    ? borrador.participantes.filter(p => p.grupo === filtroGrupo)
    : borrador.participantes;

  const filas = participantesFiltrados.map((p) => {
    const al = borrador.alumnas.find(a => a.id === p.alumna_id);
    const nombre = al ? al.nombre : '(sin nombre)';
    const activa = p.activa_en_evento !== false;

    const grupoOpts = grupos.map(g => '<option' + (g === p.grupo ? ' selected' : '') + '>' + esc(g) + '</option>').join('');
    const subOpts = subgrupos.map(s => '<option' + (s === p.subgrupo ? ' selected' : '') + '>' + esc(s) + '</option>').join('');

    const realIdx = borrador.participantes.indexOf(p);
    return '<tr style="' + (activa ? '' : 'opacity:0.5;') + '" data-idx="' + realIdx + '">' +
      '<td style="text-align:center">' +
        '<input type="checkbox" data-batch-activa="' + realIdx + '" ' + (activa ? 'checked' : '') + ' style="width:18px;height:18px;cursor:pointer">' +
      '</td>' +
      '<td>' + esc(nombre) + '</td>' +
      '<td><select class="input input--select" data-batch-grupo="' + realIdx + '" style="height:32px;font-size:14px">' + grupoOpts + '</select></td>' +
      '<td><select class="input input--select" data-batch-subgrupo="' + realIdx + '" style="height:32px;font-size:14px">' + subOpts + '</select></td>' +
      '<td><input type="number" class="input" data-batch-precio="' + realIdx + '" value="' + (p.precio_final || 0) + '" style="height:32px;font-size:14px"></td>' +
    '</tr>';
  }).join('');

  const altasFilas = borrador.altas.map((a, idx) => {
    const grupoOpts = grupos.map(g => '<option' + (g === a.grupo ? ' selected' : '') + '>' + esc(g) + '</option>').join('');
    const subOpts = subgrupos.map(s => '<option' + (s === a.subgrupo ? ' selected' : '') + '>' + esc(s) + '</option>').join('');
    return '<tr style="background:var(--c-color-fill-caution-subtle)" data-alta-idx="' + idx + '">' +
      '<td style="text-align:center"><span class="badge badge--caution">Nueva</span></td>' +
      '<td><input type="text" class="input" data-alta-nombre="' + idx + '" value="' + escAttr(a.nombre) + '" placeholder="Nombre completo" style="height:32px;font-size:14px"></td>' +
      '<td><select class="input input--select" data-alta-grupo="' + idx + '" style="height:32px;font-size:14px">' + grupoOpts + '</select></td>' +
      '<td><select class="input input--select" data-alta-subgrupo="' + idx + '" style="height:32px;font-size:14px">' + subOpts + '</select></td>' +
      '<td><div style="display:flex;gap:4px">' +
        '<input type="number" class="input" data-alta-precio="' + idx + '" value="' + (a.precio_final || 0) + '" style="height:32px;font-size:14px;flex:1">' +
        '<button class="kebab" type="button" data-alta-quitar="' + idx + '" title="Quitar" style="color:var(--c-color-text-error)">X</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');

  tbody.innerHTML = filas + altasFilas;

  tbody.querySelectorAll('[data-batch-activa]').forEach(el => {
    el.addEventListener('change', () => {
      const p = borrador.participantes[Number(el.dataset.batchActiva)];
      if (!p) return;
      p.activa_en_evento = el.checked;
      marcarDirty();
      renderTbody();
    });
  });
  tbody.querySelectorAll('[data-batch-grupo]').forEach(el => {
    el.addEventListener('change', () => {
      const p = borrador.participantes[Number(el.dataset.batchGrupo)];
      if (!p) return;
      p.grupo = el.value;
      marcarDirty();
    });
  });
  tbody.querySelectorAll('[data-batch-subgrupo]').forEach(el => {
    el.addEventListener('change', () => {
      const p = borrador.participantes[Number(el.dataset.batchSubgrupo)];
      if (!p) return;
      p.subgrupo = el.value;
      marcarDirty();
    });
  });
  tbody.querySelectorAll('[data-batch-precio]').forEach(el => {
    el.addEventListener('input', () => {
      const p = borrador.participantes[Number(el.dataset.batchPrecio)];
      if (!p) return;
      p.precio_final = Number(el.value) || 0;
      const total = p.precio_final - (p.bonificacion || 0);
      const mitad = Math.round(total / 2);
      if (p.cuotas && p.cuotas.length >= 2) {
        p.cuotas[0].monto = mitad;
        p.cuotas[1].monto = total - mitad;
      }
      marcarDirty();
    });
  });

  tbody.querySelectorAll('[data-alta-nombre]').forEach(el => {
    el.addEventListener('input', () => {
      const idx = Number(el.dataset.altaNombre);
      borrador.altas[idx].nombre = el.value;
      marcarDirty();
    });
  });
  tbody.querySelectorAll('[data-alta-grupo]').forEach(el => {
    el.addEventListener('change', () => {
      const idx = Number(el.dataset.altaGrupo);
      borrador.altas[idx].grupo = el.value;
      marcarDirty();
    });
  });
  tbody.querySelectorAll('[data-alta-subgrupo]').forEach(el => {
    el.addEventListener('change', () => {
      const idx = Number(el.dataset.altaSubgrupo);
      borrador.altas[idx].subgrupo = el.value;
      marcarDirty();
    });
  });
  tbody.querySelectorAll('[data-alta-precio]').forEach(el => {
    el.addEventListener('input', () => {
      const idx = Number(el.dataset.altaPrecio);
      borrador.altas[idx].precio_final = Number(el.value) || 0;
      marcarDirty();
    });
  });
  tbody.querySelectorAll('[data-alta-quitar]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = Number(el.dataset.altaQuitar);
      borrador.altas.splice(idx, 1);
      marcarDirty();
      renderTbody();
    });
  });
}

function renderChips() {
  const cont = document.getElementById('batch-chips');
  if (!cont) return;
  const state = getState();
  const grupos = state.config.grupos || [];
  const contadores = {};
  for (const p of borrador.participantes) {
    const g = p.grupo || 'Sin grupo';
    contadores[g] = (contadores[g] || 0) + 1;
  }
  const chipTodos = '<button class="chip' + (filtroGrupo === '' ? ' is-selected' : '') + '" data-chip-filtro="" type="button">Todos <strong>(' + borrador.participantes.length + ')</strong></button>';
  const chips = grupos.map(g => {
    const n = contadores[g] || 0;
    if (n === 0) return '';
    const activo = filtroGrupo === g;
    return '<button class="chip' + (activo ? ' is-selected' : '') + '" data-chip-filtro="' + escAttr(g) + '" type="button">' + esc(g) + ' <strong>(' + n + ')</strong></button>';
  }).join('');
  cont.innerHTML = chipTodos + chips;
  cont.querySelectorAll('[data-chip-filtro]').forEach(btn => {
    btn.addEventListener('click', () => {
      filtroGrupo = btn.dataset.chipFiltro;
      renderChips();
      renderTbody();
    });
  });
}

function agregarAlta() {
  const state = getState();
  const grupos = state.config.grupos || [];
  const subgrupos = state.config.subgrupos || [];
  borrador.altas.push({
    nombre: '',
    grupo: grupos[0] || '',
    subgrupo: subgrupos[0] || '',
    precio_final: 0,
  });
  marcarDirty();
  renderTbody();
  setTimeout(() => {
    const tbody = document.getElementById('batch-tbody');
    const lastRow = tbody.querySelector('tr:last-child input[type="text"]');
    if (lastRow) lastRow.focus();
  }, 50);
}

async function descartar() {
  if (dirty) {
    const ok = await confirmDialog(
      'Descartar cambios',
      'Vas a perder todos los cambios sin guardar. Esta accion no se puede deshacer.'
    );
    if (!ok) return;
  }
  cerrarOverlay();
}

async function guardar() {
  const altasValidas = borrador.altas.filter(a => a.nombre && a.nombre.trim());
  if (borrador.altas.length > 0 && altasValidas.length !== borrador.altas.length) {
    showToast('Hay alumnas nuevas sin nombre. Completa o quita las filas vacias.', 'warning');
    return;
  }

  const ok = await confirmDialog(
    'Guardar cambios',
    'Se van a guardar <strong>' + borrador.participantes.length + ' participaciones</strong>' +
    (altasValidas.length > 0 ? ' y <strong>' + altasValidas.length + ' alumnas nuevas</strong>' : '') +
    ' en GitHub. Se va a crear 1 o 2 commits.'
  );
  if (!ok) return;

  try {
    const state = getState();

    for (const alta of altasValidas) {
      const id = 'alu_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
      borrador.alumnas.push({
        id,
        nombre: alta.nombre.trim(),
        contacto: '',
        tutor: '',
        medidas: { busto: null, cintura: null, cadera: null, altura: null, talle: '', obs: '' },
        activa_global: true,
        notas: '',
      });

      const total = alta.precio_final || 0;
      const mitad = Math.round(total / 2);
      borrador.participantes.push({
        alumna_id: id,
        activa_en_evento: true,
        grupo: alta.grupo,
        subgrupo: alta.subgrupo,
        diseno_id: '',
        tipologia: '',
        precio_final: total,
        bonificacion: 0,
        cuotas: [
          { nro: 1, monto: mitad, pagado: false, fecha: null },
          { nro: 2, monto: total - mitad, pagado: false, fecha: null },
        ],
        notas: '',
      });
    }

    state.alumnas = borrador.alumnas;
    state.eventoActivo.participantes = borrador.participantes;

    if (altasValidas.length > 0) {
      await saveAlumnas('Batch: altas nuevas (' + altasValidas.length + ')');
    }
    await saveEventoActivo('Batch: ' + borrador.participantes.length + ' participaciones actualizadas');

    showToast('Cambios guardados en GitHub', 'success');
    cerrarOverlay();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escAttr(s) { return esc(s); }