// ============================================================
// views/catalogos.js - ABM de grupos, subgrupos, tematicas y tipologias
// ============================================================

import {
  getState, saveConfig, saveDisenos, saveEventoActivo,
} from '../store.js';
import { setFab, openModal, closeModal, showToast, confirmDialog } from '../ui.js';
import { icons } from '../icons.js';

const SECCIONES = [
  { key: 'grupos',    singular: 'grupo',    titulo: 'Grupos',     ayuda: 'Categorias de alumnas (Babys, Kids, Pre Teens, Adolescentes).' },
  { key: 'subgrupos', singular: 'subgrupo', titulo: 'Subgrupos',  ayuda: 'Tipos de participacion (Vestuario, Comedia, Competencia).' },
  { key: 'tematicas', singular: 'tematica', titulo: 'Tematicas',  ayuda: 'Tematica del vestuario (Dia/Sol Dorado, Noche/Luna).' },
  { key: 'tipologias',singular: 'tipologia',titulo: 'Tipologias', ayuda: 'Tipo de prenda (Vestido, Pantalon, Falda).' },
];

export function renderCatalogos(container) {
  setFab(null);
  const state = getState();

  const html = SECCIONES.map(sec => {
    const lista = state.config[sec.key] || [];
    const itemsHtml = lista.length === 0
      ? '<div class="empty-state" style="padding:var(--c-spacing-5)">Sin elementos</div>'
      : lista.map((nombre, idx) => {
          const esPrimero = idx === 0;
          const esUltimo = idx === lista.length - 1;
          const btnArriba = '<button class="kebab" type="button" data-mover="' + escAttr(sec.key) + '" data-idx="' + idx + '" data-dir="up" title="Subir" ' + (esPrimero ? 'disabled style="opacity:0.3;cursor:default" ' : '') + '>&#9650;</button>';
          const btnAbajo = '<button class="kebab" type="button" data-mover="' + escAttr(sec.key) + '" data-idx="' + idx + '" data-dir="down" title="Bajar" ' + (esUltimo ? 'disabled style="opacity:0.3;cursor:default" ' : '') + '>&#9660;</button>';
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:var(--c-spacing-3) var(--c-spacing-4);border-bottom:1px solid var(--c-color-border-subtle)">' +
            '<div style="display:flex;align-items:center;gap:var(--c-spacing-3)">' +
              '<div style="display:flex;flex-direction:column;gap:2px">' + btnArriba + btnAbajo + '</div>' +
              '<span style="display:inline-flex;width:24px;height:24px;border-radius:50%;background:var(--c-color-fill-primary-subtle);color:var(--c-color-text-primary);font-size:11px;font-weight:700;align-items:center;justify-content:center">' + (idx + 1) + '</span>' +
              '<strong style="color:var(--c-color-text-strong)">' + esc(nombre) + '</strong>' +
            '</div>' +
            '<div class="table__actions">' +
              '<button class="btn btn--ghost btn--small" data-editar="' + escAttr(sec.key) + '" data-nombre="' + escAttr(nombre) + '" title="Renombrar">' + icons.edit + ' Editar</button>' +
              '<button class="btn btn--ghost btn--small" data-eliminar="' + escAttr(sec.key) + '" data-nombre="' + escAttr(nombre) + '" title="Eliminar" style="color:var(--c-color-text-error)">' + icons.trash + ' Eliminar</button>' +
            '</div>' +
          '</div>';
        }).join('');

    return '<div class="card" style="padding:0;overflow:hidden;margin-bottom:var(--c-spacing-4)">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:var(--c-spacing-4);border-bottom:1px solid var(--c-color-border-subtle);background:var(--c-color-surface-neutral-subtle);flex-wrap:wrap;gap:var(--c-spacing-3)">' +
        '<div>' +
          '<div class="card__title">' + sec.titulo + '</div>' +
          '<div class="text-caption">' + esc(sec.ayuda) + '</div>' +
        '</div>' +
        '<button class="btn btn--primary btn--small" data-agregar="' + escAttr(sec.key) + '" title="Agregar nuevo">' + icons.plus + ' Agregar</button>' +
      '</div>' +
      '<div>' + itemsHtml + '</div>' +
    '</div>';
  }).join('');

  container.innerHTML =
    '<h1 class="text-headline4">Catalogos</h1>' +
    '<p class="text-bodysmall" style="color:var(--c-color-text-subtle)">' +
      'Administra los grupos, subgrupos, tematicas y tipologias que se usan en toda la aplicacion. ' +
      'Los cambios afectan a todas las pantallas y a las alumnas y disenos existentes.' +
    '</p>' +
    html;

  // Wire: agregar
  container.querySelectorAll('[data-agregar]').forEach(btn => {
    btn.addEventListener('click', () => abrirFormItem(btn.dataset.agregar, null, container));
  });

  // Wire: editar
  container.querySelectorAll('[data-editar]').forEach(btn => {
    btn.addEventListener('click', () => abrirFormItem(btn.dataset.editar, btn.dataset.nombre, container));
  });

  // Wire: eliminar
  container.querySelectorAll('[data-eliminar]').forEach(btn => {
    btn.addEventListener('click', () => eliminarItem(btn.dataset.eliminar, btn.dataset.nombre, container));
  });

  // Wire: mover arriba/abajo
  container.querySelectorAll('[data-mover]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      moverItem(btn.dataset.mover, Number(btn.dataset.idx), btn.dataset.dir, container);
    });
  });
}

async function moverItem(key, idx, dir, container) {
  const state = getState();
  const lista = (state.config[key] || []).slice();
  const nuevoIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (nuevoIdx < 0 || nuevoIdx >= lista.length) return;
  const tmp = lista[idx];
  lista[idx] = lista[nuevoIdx];
  lista[nuevoIdx] = tmp;
  state.config[key] = lista;
  try {
    await saveConfig('Reordenar ' + key);
    renderCatalogos(container);
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

function getSeccion(key) {
  return SECCIONES.find(s => s.key === key);
}

function abrirFormItem(key, nombreExistente, container) {
  const sec = getSeccion(key);
  if (!sec) return;
  const esNuevo = !nombreExistente;

  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">' + (esNuevo ? 'Agregar ' : 'Renombrar ') + esc(sec.singular) + '</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">' + icons.close + '</button>' +
    '</div>' +
    '<div class="modal__body">' +
      (esNuevo ? '' :
        '<div class="alert alert--warning">' +
          'Si renombras <strong>' + esc(nombreExistente) + '</strong>, se actualizaran tambien todas las ' +
          'alumnas y disenos que lo usen. Esta accion se puede deshacer desde GitHub.' +
        '</div>') +
      '<label class="field"><span class="field__label">Nombre</span>' +
        '<input class="input" id="cat-nombre" value="' + escAttr(nombreExistente || '') + '" placeholder="Ej: Juveniles"></label>' +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cancelar</button>' +
      '<button class="btn btn--primary" type="button" id="cat-guardar">' +
        (esNuevo ? icons.plus + ' Agregar' : icons.save + ' Guardar') +
      '</button>' +
    '</div>'
  );

  setTimeout(() => {
    const inp = document.getElementById('cat-nombre');
    if (inp) { inp.focus(); inp.select(); }
  }, 100);

  document.getElementById('cat-guardar').addEventListener('click', async () => {
    const nuevo = document.getElementById('cat-nombre').value.trim();
    if (!nuevo) return showToast('El nombre es obligatorio', 'warning');

    const state = getState();
    const lista = state.config[sec.key] || [];

    if (esNuevo) {
      if (lista.indexOf(nuevo) !== -1) return showToast('Ese nombre ya existe', 'warning');
      state.config[sec.key] = lista.concat([nuevo]);
      try {
        await saveConfig('Agregar ' + sec.singular + ' "' + nuevo + '"');
        showToast(sec.titulo.slice(0, -1) + ' agregado', 'success');
        closeModal();
        renderCatalogos(container);
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
      return;
    }

    // Editar: renombrar
    if (nuevo === nombreExistente) return closeModal();
    if (lista.indexOf(nuevo) !== -1) return showToast('Ese nombre ya existe', 'warning');

    // Actualizar lista
    const idx = lista.indexOf(nombreExistente);
    if (idx >= 0) lista[idx] = nuevo;
    state.config[sec.key] = lista;

    // Propagar el cambio a disenos y participantes
    let cambioDisenos = false;
    let cambioEvento = false;
    const field = sec.singular; // grupo, subgrupo, tematica, tipologia

    for (const d of (state.disenos || [])) {
      if (d[field] === nombreExistente) { d[field] = nuevo; cambioDisenos = true; }
    }
    for (const p of ((state.eventoActivo && state.eventoActivo.participantes) || [])) {
      if (p[field] === nombreExistente) { p[field] = nuevo; cambioEvento = true; }
    }

    try {
      await saveConfig('Renombrar ' + sec.singular + ' "' + nombreExistente + '" a "' + nuevo + '"');
      if (cambioDisenos) await saveDisenos('Actualizar disenos: ' + sec.singular + ' "' + nuevo + '"');
      if (cambioEvento) await saveEventoActivo('Actualizar participantes: ' + sec.singular + ' "' + nuevo + '"');
      showToast('Renombrado correctamente', 'success');
      closeModal();
      renderCatalogos(container);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
}

async function eliminarItem(key, nombre, container) {
  const sec = getSeccion(key);
  if (!sec) return;
  const state = getState();
  const field = sec.singular;

  // Detectar uso
  const enDisenos = (state.disenos || []).filter(d => d[field] === nombre).length;
  const enParticipantes = ((state.eventoActivo && state.eventoActivo.participantes) || []).filter(p => p[field] === nombre).length;

  if (enDisenos > 0 || enParticipantes > 0) {
    const partes = [];
    if (enDisenos > 0) partes.push('<strong>' + enDisenos + ' disenos</strong>');
    if (enParticipantes > 0) partes.push('<strong>' + enParticipantes + ' participaciones de alumnas</strong>');
    openModal(
      '<div class="modal__header">' +
        '<h2 class="modal__title">No se puede eliminar</h2>' +
        '<button class="kebab" type="button" data-close aria-label="Cerrar">' + icons.close + '</button>' +
      '</div>' +
      '<div class="modal__body">' +
        '<div class="alert alert--warning">' +
          'El ' + esc(sec.singular) + ' <strong>' + esc(nombre) + '</strong> esta en uso por ' +
          partes.join(' y ') + '. Reasigna esos elementos antes de eliminarlo, o simplemente renombralo.' +
        '</div>' +
      '</div>' +
      '<div class="modal__footer">' +
        '<button class="btn btn--primary" type="button" data-close>Entendido</button>' +
      '</div>'
    );
    return;
  }

  const ok = await confirmDialog(
    'Eliminar ' + sec.singular,
    'Estas por eliminar <strong>' + esc(nombre) + '</strong> de ' + esc(sec.titulo) + '. Esta accion no se puede deshacer.'
  );
  if (!ok) return;

  state.config[sec.key] = (state.config[sec.key] || []).filter(x => x !== nombre);
  try {
    await saveConfig('Eliminar ' + sec.singular + ' "' + nombre + '"');
    showToast('Eliminado', 'success');
    renderCatalogos(container);
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escAttr(s) { return esc(s); }