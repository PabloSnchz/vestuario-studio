// ============================================================
// views/alumnas.js - Listado, filtros, importar, editar medidas
// ============================================================

import {
  getState, getParticipantesEvento, calcularEstadoPago,
  findAlumna, findDiseno, saveAlumnas, saveEventoActivo,
} from '../store.js';
import { setFab, openModal, closeModal, showToast } from '../ui.js';
import { descargarPlantilla, abrirImportador } from '../importar.js';

const filtros = { grupo: '', subgrupo: '', estado: '', q: '' };

export function renderAlumnas(container) {
  setFab('Nueva alumna', () => nuevaAlumna(container));

  const participantes = getParticipantesEvento();
  const grupos = uniq(participantes.map(p => p.grupo));
  const subgrupos = uniq(participantes.map(p => p.subgrupo));

  const filtrados = aplicarFiltros(participantes);

  container.innerHTML =
    '<h1 class="text-headline4">Alumnas</h1>' +
    '<div class="toolbar">' +
      '<div class="toolbar__filters">' +
        sel('Grupo',    'grupo',    grupos,                     filtros.grupo) +
        sel('Subgrupo', 'subgrupo', subgrupos,                  filtros.subgrupo) +
        sel('Estado',   'estado',   ['pagado','parcial','sin_pago'], filtros.estado) +
        '<input class="input" style="width:220px" type="search" data-f="q" placeholder="Buscar nombre..." value="' + escAttr(filtros.q) + '">' +
      '</div>' +
      '<div class="toolbar__actions">' +
        '<button class="btn btn--ghost btn--small" type="button" data-plantilla>Descargar plantilla</button>' +
        '<button class="btn btn--secondary btn--small" type="button" data-importar>Importar Excel</button>' +
        '<button class="btn btn--ghost btn--small" type="button" data-limpiar>Limpiar filtros</button>' +
      '</div>' +
    '</div>' +
    tablaHtml(filtrados);

  wire(container);
}

function aplicarFiltros(participantes) {
  return participantes.filter(p => {
    if (filtros.grupo && p.grupo !== filtros.grupo) return false;
    if (filtros.subgrupo && p.subgrupo !== filtros.subgrupo) return false;
    if (filtros.estado) {
      const r = calcularEstadoPago(p);
      if (r.estado !== filtros.estado) return false;
    }
    if (filtros.q) {
      const al = findAlumna(p.alumna_id);
      const nom = (al ? al.nombre : '').toLowerCase();
      if (!nom.includes(filtros.q.toLowerCase())) return false;
    }
    return true;
  });
}

function tablaHtml(filtrados) {
  return '<div class="table-wrapper"><table class="table">' +
    '<thead><tr>' +
      '<th>Nombre</th><th>Grupo</th><th>Subgrupo</th><th>Diseno</th><th>Estado</th><th>Debe</th><th></th>' +
    '</tr></thead>' +
    '<tbody>' +
      (filtrados.length === 0
        ? '<tr><td colspan="7"><div class="empty-state">Sin resultados</div></td></tr>'
        : filtrados.map(rowHtml).join('')) +
    '</tbody>' +
  '</table></div>';
}

function rowHtml(p) {
  const al = findAlumna(p.alumna_id);
  const dis = findDiseno(p.diseno_id);
  const r = calcularEstadoPago(p);
  const labels = { pagado: 'Pagado', parcial: 'Parcial', sin_pago: 'Sin pago', bonificado: 'Bonificado' };
  const clases = { pagado: 'success', parcial: 'caution', sin_pago: 'error', bonificado: 'info' };
  return '<tr data-id="' + escAttr(p.alumna_id) + '">' +
    '<td>' + esc(al ? al.nombre : '(sin nombre)') + '</td>' +
    '<td>' + esc(p.grupo || '-') + '</td>' +
    '<td>' + esc(p.subgrupo || '-') + '</td>' +
    '<td>' + esc(dis ? dis.nombre : '-') + '</td>' +
    '<td><span class="badge badge--' + (clases[r.estado] || 'neutral') + '">' + (labels[r.estado] || r.estado) + '</span></td>' +
    '<td>$' + r.debe.toLocaleString('es-AR') + '</td>' +
    '<td><div class="table__actions">' +
      '<button class="kebab" data-editar-medidas aria-label="Editar medidas">M</button>' +
      '<button class="kebab" data-inactivar aria-label="Inactivar">X</button>' +
    '</div></td>' +
  '</tr>';
}

function wire(container) {
  container.querySelectorAll('select[data-f]').forEach(el => {
    el.addEventListener('change', () => {
      filtros[el.dataset.f] = el.value;
      renderAlumnas(container);
    });
  });

  const q = container.querySelector('input[data-f="q"]');
  if (q) {
    let t;
    q.addEventListener('input', () => {
      filtros.q = q.value;
      clearTimeout(t);
      t = setTimeout(() => {
        const tbody = container.querySelector('tbody');
        const filtrados = aplicarFiltros(getParticipantesEvento());
        tbody.innerHTML = filtrados.length === 0
          ? '<tr><td colspan="7"><div class="empty-state">Sin resultados</div></td></tr>'
          : filtrados.map(rowHtml).join('');
        wireRows(container);
      }, 180);
    });
  }

  const limpiar = container.querySelector('[data-limpiar]');
  if (limpiar) limpiar.addEventListener('click', () => {
    filtros.grupo = ''; filtros.subgrupo = ''; filtros.estado = ''; filtros.q = '';
    renderAlumnas(container);
  });

  const btnPlantilla = container.querySelector('[data-plantilla]');
  if (btnPlantilla) btnPlantilla.addEventListener('click', descargarPlantilla);

  const btnImportar = container.querySelector('[data-importar]');
  if (btnImportar) btnImportar.addEventListener('click', () => abrirImportador(() => renderAlumnas(container)));

  wireRows(container);
}

function wireRows(container) {
  container.querySelectorAll('[data-editar-medidas]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      editarMedidas(id, container);
    });
  });
  container.querySelectorAll('[data-inactivar]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      const state = getState();
      const p = state.eventoActivo.participantes.find(x => x.alumna_id === id);
      if (!p) return;
      p.activa_en_evento = false;
      try {
        await saveEventoActivo('Inactivar ' + id + ' en evento');
        showToast('Alumna inactivada en este evento', 'success');
        renderAlumnas(container);
      } catch (e) {
        showToast('Error: ' + e.message, 'error');
      }
    });
  });
}

function editarMedidas(alumnaId, container) {
  const al = findAlumna(alumnaId);
  if (!al) return;
  const m = al.medidas || {};

  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">Medidas - ' + esc(al.nombre) + '</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">X</button>' +
    '</div>' +
    '<div class="modal__body">' +
      '<div class="cards-grid" style="grid-template-columns:repeat(3,1fr);gap:var(--c-spacing-3)">' +
        '<label class="field"><span class="field__label">Busto</span>' +
          '<input class="input" type="number" id="m-busto" value="' + (m.busto || '') + '"></label>' +
        '<label class="field"><span class="field__label">Cintura</span>' +
          '<input class="input" type="number" id="m-cintura" value="' + (m.cintura || '') + '"></label>' +
        '<label class="field"><span class="field__label">Cadera</span>' +
          '<input class="input" type="number" id="m-cadera" value="' + (m.cadera || '') + '"></label>' +
        '<label class="field"><span class="field__label">Altura (cm)</span>' +
          '<input class="input" type="number" id="m-altura" value="' + (m.altura || '') + '"></label>' +
        '<label class="field"><span class="field__label">Talle</span>' +
          '<input class="input" id="m-talle" value="' + escAttr(m.talle || '') + '"></label>' +
      '</div>' +
      '<label class="field"><span class="field__label">Observaciones</span>' +
        '<textarea class="input input--textarea" id="m-obs">' + esc(m.obs || '') + '</textarea></label>' +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cancelar</button>' +
      '<button class="btn btn--primary" type="button" id="m-guardar">Guardar</button>' +
    '</div>'
  );

  document.getElementById('m-guardar').addEventListener('click', async () => {
    al.medidas = {
      busto: Number(document.getElementById('m-busto').value) || null,
      cintura: Number(document.getElementById('m-cintura').value) || null,
      cadera: Number(document.getElementById('m-cadera').value) || null,
      altura: Number(document.getElementById('m-altura').value) || null,
      talle: document.getElementById('m-talle').value.trim(),
      obs: document.getElementById('m-obs').value.trim(),
    };
    try {
      await saveAlumnas('Actualizar medidas ' + alumnaId);
      closeModal();
      showToast('Medidas guardadas', 'success');
      renderAlumnas(container);
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  });
}

function nuevaAlumna(container) {
  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">Nueva alumna</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">X</button>' +
    '</div>' +
    '<div class="modal__body">' +
      '<div class="alert alert--info">Para asociarla al evento, importala desde Excel con la plantilla o usá el boton <strong>Importar</strong>.</div>' +
      '<label class="field"><span class="field__label">Nombre completo</span>' +
        '<input class="input" id="na-nombre"></label>' +
      '<div class="cards-grid" style="grid-template-columns:repeat(3,1fr);gap:var(--c-spacing-3)">' +
        '<label class="field"><span class="field__label">Busto</span><input class="input" type="number" id="na-busto"></label>' +
        '<label class="field"><span class="field__label">Cintura</span><input class="input" type="number" id="na-cintura"></label>' +
        '<label class="field"><span class="field__label">Cadera</span><input class="input" type="number" id="na-cadera"></label>' +
        '<label class="field"><span class="field__label">Altura</span><input class="input" type="number" id="na-altura"></label>' +
        '<label class="field"><span class="field__label">Talle</span><input class="input" id="na-talle"></label>' +
      '</div>' +
      '<label class="field"><span class="field__label">Observaciones</span>' +
        '<textarea class="input input--textarea" id="na-obs"></textarea></label>' +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cancelar</button>' +
      '<button class="btn btn--primary" type="button" id="na-guardar">Crear alumna</button>' +
    '</div>'
  );

  document.getElementById('na-guardar').addEventListener('click', async () => {
    const nombre = document.getElementById('na-nombre').value.trim();
    if (!nombre) return showToast('El nombre es obligatorio', 'warning');
    const state = getState();
    const alumna = {
      id: 'alu_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      nombre,
      contacto: '',
      tutor: '',
      medidas: {
        busto: Number(document.getElementById('na-busto').value) || null,
        cintura: Number(document.getElementById('na-cintura').value) || null,
        cadera: Number(document.getElementById('na-cadera').value) || null,
        altura: Number(document.getElementById('na-altura').value) || null,
        talle: document.getElementById('na-talle').value.trim(),
        obs: document.getElementById('na-obs').value.trim(),
      },
      activa_global: true,
      notas: '',
    };
    state.alumnas.push(alumna);
    try {
      await saveAlumnas('Nueva alumna ' + nombre);
      closeModal();
      showToast('Alumna creada', 'success');
      renderAlumnas(container);
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  });
}

function sel(label, id, options, current) {
  return '<select class="input input--select" data-f="' + id + '" aria-label="' + label + '">' +
    '<option value="">' + label + ': todos</option>' +
    options.map(o =>
      '<option value="' + escAttr(o) + '"' + (o === current ? ' selected' : '') + '>' +
        esc(labelOpt(o)) +
      '</option>'
    ).join('') +
  '</select>';
}

function labelOpt(v) {
  return ({ pagado: 'Pagado', parcial: 'Parcial', sin_pago: 'Sin pago' })[v] || v;
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escAttr(s) { return esc(s); }