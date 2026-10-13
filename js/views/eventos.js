// ============================================================
// views/eventos.js - Listar, crear, activar eventos
// ============================================================

import { getState, loadAll, saveEventoActivo, generarId } from '../store.js';
import { readJSON, writeJSON } from '../github.js';
import { setFab, openModal, closeModal, showToast, confirmDialog } from '../ui.js';

export function renderEventos(container) {
  setFab('Nuevo evento', () => nuevoEvento(container));
  const state = getState();
  const eventos = (state.config && state.config.eventos) || [];

  container.innerHTML =
    '<h1 class="text-headline4">Eventos</h1>' +
    '<div class="table-wrapper"><table class="table">' +
      '<thead><tr><th>Nombre</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>' +
      '<tbody>' +
        (eventos.length === 0
          ? '<tr><td colspan="4"><div class="empty-state">Sin eventos</div></td></tr>'
          : eventos.map(ev => rowHtml(ev, state)).join('')) +
      '</tbody>' +
    '</table></div>';

  container.querySelectorAll('[data-accion]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const accion = btn.dataset.accion;
      if (accion === 'activar') activarEvento(id, container);
      if (accion === 'clonar')  clonarEvento(id, container);
    });
  });
}

function rowHtml(ev, state) {
  const activo = state.config.evento_activo === ev.id;
  return '<tr>' +
    '<td>' + esc(ev.nombre) + '</td>' +
    '<td>' + esc(ev.fecha || '-') + '</td>' +
    '<td>' + (activo
      ? '<span class="badge badge--success">Activo</span>'
      : '<span class="badge badge--neutral">Inactivo</span>') + '</td>' +
    '<td><div class="table__actions">' +
      (activo ? '' : '<button class="btn btn--ghost btn--small" data-accion="activar" data-id="' + escAttr(ev.id) + '">Activar</button>') +
      '<button class="btn btn--ghost btn--small" data-accion="clonar" data-id="' + escAttr(ev.id) + '">Clonar</button>' +
    '</div></td>' +
  '</tr>';
}

async function activarEvento(id, container) {
  const state = getState();
  const cfg = { ...state.config, evento_activo: id };
  try {
    await writeJSON(state.repo, 'data/config.json', cfg, 'Activar evento ' + id);
    await loadAll();
    showToast('Evento activado', 'success');
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
}

function nuevoEvento(container) {
  const state = getState();
  const eventos = (state.config && state.config.eventos) || [];
  const ids = eventos.map(e => e.id);
  const sugerido = 'evento-' + new Date().getFullYear() + '-' + (new Date().getMonth() + 1);

  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">Nuevo evento</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">X</button>' +
    '</div>' +
    '<div class="modal__body">' +
      '<label class="field"><span class="field__label">Nombre</span>' +
        '<input class="input" id="ev-nombre" placeholder="Exhibicion Diciembre 2027"></label>' +
      '<label class="field"><span class="field__label">ID (sin espacios)</span>' +
        '<input class="input" id="ev-id" value="' + sugerido + '"></label>' +
      '<label class="field"><span class="field__label">Fecha</span>' +
        '<input class="input" type="date" id="ev-fecha"></label>' +
      '<label class="field"><span class="field__label">Copiar participantes de</span>' +
        '<select class="input input--select" id="ev-copiar">' +
          '<option value="">(no copiar)</option>' +
          eventos.map(e => '<option value="' + escAttr(e.id) + '">' + esc(e.nombre) + '</option>').join('') +
        '</select></label>' +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cancelar</button>' +
      '<button class="btn btn--primary" type="button" id="ev-crear">Crear evento</button>' +
    '</div>'
  );

  document.getElementById('ev-crear').addEventListener('click', async () => {
    const nombre = document.getElementById('ev-nombre').value.trim();
    const id = document.getElementById('ev-id').value.trim();
    const fecha = document.getElementById('ev-fecha').value;
    const copiar = document.getElementById('ev-copiar').value;

    if (!nombre || !id) return showToast('Nombre e ID obligatorios', 'warning');
    if (ids.includes(id)) return showToast('Ya existe un evento con ese ID', 'error');

    let participantes = [];
    if (copiar) {
      const origen = await readJSON(state.repo, 'data/eventos/' + copiar + '.json');
      if (origen && origen.participantes) {
        participantes = origen.participantes.map(p => ({
          ...p,
          cuotas: (p.cuotas || []).map(c => ({ ...c, pagado: false, fecha: null })),
        }));
      }
    }

    const nuevo = {
      id, nombre, fecha: fecha || null, activo: false,
      cuotas: state.config.cuotas || {},
      participantes,
    };

    const cfg = {
      ...state.config,
      eventos: eventos.concat([{ id, nombre, fecha: nuevo.fecha, activo: false }]),
    };

    try {
      await writeJSON(state.repo, 'data/eventos/' + id + '.json', nuevo, 'Crear evento ' + id);
      await writeJSON(state.repo, 'data/config.json', cfg, 'Registrar evento ' + id);
      closeModal();
      await loadAll();
      showToast('Evento creado', 'success');
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  });
}

function clonarEvento(idOrigen, container) {
  const state = getState();
  const eventos = (state.config && state.config.eventos) || [];
  const origen = eventos.find(e => e.id === idOrigen);
  if (!origen) return;

  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">Clonar evento</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">X</button>' +
    '</div>' +
    '<div class="modal__body">' +
      '<div class="alert alert--info">Se copiaran los participantes de <strong>' + esc(origen.nombre) + '</strong>. Las cuotas quedaran marcadas como no pagadas.</div>' +
      '<label class="field"><span class="field__label">Nombre nuevo</span>' +
        '<input class="input" id="ev-nombre" value="' + escAttr(origen.nombre) + ' (copia)"></label>' +
      '<label class="field"><span class="field__label">ID nuevo</span>' +
        '<input class="input" id="ev-id" value="' + escAttr(idOrigen) + '-copia"></label>' +
      '<label class="field"><span class="field__label">Fecha</span>' +
        '<input class="input" type="date" id="ev-fecha"></label>' +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cancelar</button>' +
      '<button class="btn btn--primary" type="button" id="ev-crear">Crear clon</button>' +
    '</div>'
  );

  document.getElementById('ev-crear').addEventListener('click', async () => {
    const nombre = document.getElementById('ev-nombre').value.trim();
    const nuevoId = document.getElementById('ev-id').value.trim();
    const fecha = document.getElementById('ev-fecha').value;
    if (!nombre || !nuevoId) return showToast('Nombre e ID obligatorios', 'warning');
    if (eventos.some(e => e.id === nuevoId)) return showToast('Ya existe ese ID', 'error');

    const origenData = await readJSON(state.repo, 'data/eventos/' + idOrigen + '.json');
    const participantes = (origenData.participantes || []).map(p => ({
      ...p,
      cuotas: (p.cuotas || []).map(c => ({ ...c, pagado: false, fecha: null })),
    }));

    const nuevo = { id: nuevoId, nombre, fecha: fecha || null, activo: false, cuotas: origenData.cuotas || {}, participantes };
    const cfg = { ...state.config, eventos: eventos.concat([{ id: nuevoId, nombre, fecha: nuevo.fecha, activo: false }]) };

    try {
      await writeJSON(state.repo, 'data/eventos/' + nuevoId + '.json', nuevo, 'Clonar evento ' + nuevoId);
      await writeJSON(state.repo, 'data/config.json', cfg, 'Registrar evento ' + nuevoId);
      closeModal();
      await loadAll();
      showToast('Evento clonado', 'success');
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  });
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escAttr(s) { return esc(s); }