// ============================================================
// views/disenos.js - Galeria + ABM + subida de imagenes
// ============================================================

import { getState, saveDisenos, generarId } from '../store.js';
import { uploadFile, fileToBase64 } from '../github.js';
import { setFab, openModal, closeModal, showToast, confirmDialog } from '../ui.js';
import { abrirAsignador } from '../asignar.js';
import { icons } from '../icons.js';

const filtros = { tematica: '', grupo: '' };

export function renderDisenos(container) {
  setFab('Nuevo diseno', () => abrirFormDiseno(null, container), icons.plus);

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
        '<span class="text-caption">' + filtrados.length + ' de ' + disenos.length + ' disenos</span>' +
      '</div>' +
    '</div>' +
    '<div class="cards-grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">' +
      (filtrados.length === 0
        ? '<div class="empty-state">Sin disenos cargados. Hace click en el boton <strong>+</strong> para crear uno.</div>'
        : filtrados.map(cardHtml).join('')) +
    '</div>';

  container.querySelectorAll('select[data-f]').forEach(el => {
    el.addEventListener('change', () => {
      filtros[el.dataset.f] = el.value;
      renderDisenos(container);
    });
  });

  container.querySelectorAll('[data-diseno-id]').forEach(btn => {
    btn.addEventListener('click', () => verDetalle(btn.dataset.disenoId, container));
  });
}

function cardHtml(d) {
  const img = d.imagen
    ? '<div style="width:100%;height:280px;background:var(--c-color-surface-neutral-subtle);border-radius:var(--c-border-radius-xsmall);display:flex;align-items:center;justify-content:center;overflow:hidden;padding:var(--c-spacing-2)">' +
        '<img src="' + escAttr(d.imagen) + '" alt="' + escAttr(d.nombre) + '" loading="lazy" ' +
          'style="max-width:100%;max-height:100%;object-fit:contain;">' +
      '</div>'
    : '<div style="width:100%;height:280px;background:var(--c-color-surface-neutral-subtle);border-radius:var(--c-border-radius-xsmall);display:flex;align-items:center;justify-content:center;color:var(--c-color-icon-disabled)">' +
        icons.image +
      '</div>';

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

function verDetalle(disenoId, container) {
  const state = getState();
  const d = (state.disenos || []).find(x => x.id === disenoId);
  if (!d) return;

  const img = d.imagen
    ? '<div style="width:100%;background:var(--c-color-surface-neutral-subtle);border-radius:var(--c-border-radius-small);padding:var(--c-spacing-4);display:flex;justify-content:center;">' +
        '<img src="' + escAttr(d.imagen) + '" alt="' + escAttr(d.nombre) + '" style="max-width:100%;max-height:60vh;object-fit:contain;">' +
      '</div>'
    : '<div class="alert alert--info">Sin imagen cargada</div>';

  const participantes = (state.eventoActivo && state.eventoActivo.participantes) || [];
  const asignadas = participantes.filter(p => p.diseno_id === disenoId).length;

  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">' + esc(d.nombre) + '</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">' + icons.close + '</button>' +
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
      '<div><div class="text-caption">Asignadas en este evento</div>' +
        '<p>' + asignadas + ' alumnas ya tienen este diseno</p>' +
      '</div>' +
      (d.materiales
        ? '<div><div class="text-caption">Descripcion / Materiales</div>' +
            '<p style="white-space:pre-wrap;line-height:1.5">' + esc(d.materiales) + '</p></div>'
        : '') +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" id="d-eliminar" title="Eliminar este diseno">' + icons.trash + ' Eliminar</button>' +
      '<button class="btn btn--secondary" type="button" id="d-asignar" title="Asignar este diseno a alumnas del grupo">' + icons.users + ' Asignar</button>' +
      '<button class="btn btn--primary" type="button" id="d-editar" title="Editar este diseno">' + icons.edit + ' Editar</button>' +
    '</div>'
  );

  document.getElementById('d-editar').addEventListener('click', () => {
    closeModal();
    setTimeout(() => abrirFormDiseno(disenoId, container), 100);
  });

  document.getElementById('d-asignar').addEventListener('click', () => {
    closeModal();
    setTimeout(() => abrirAsignador(() => renderDisenos(container), disenoId), 100);
  });

  document.getElementById('d-eliminar').addEventListener('click', async () => {
    closeModal();
    setTimeout(async () => {
      const ok = await confirmDialog(
        'Eliminar diseno',
        'Estas por eliminar <strong>' + esc(d.nombre) + '</strong>. ' +
        (asignadas > 0 ? 'Esta asignado a <strong>' + asignadas + ' alumnas</strong>. ' : '') +
        'Esta accion no se puede deshacer.'
      );
      if (!ok) return;
      try {
        const state2 = getState();
        state2.disenos = state2.disenos.filter(x => x.id !== disenoId);
        const participantes2 = state2.eventoActivo.participantes || [];
        for (const p of participantes2) {
          if (p.diseno_id === disenoId) p.diseno_id = '';
        }
        await saveDisenos('Eliminar diseno ' + d.nombre);
        if (asignadas > 0) {
          const { saveEventoActivo } = await import('../store.js');
          await saveEventoActivo('Quitar asignaciones de ' + d.nombre);
        }
        showToast('Diseno eliminado', 'success');
        renderDisenos(container);
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }, 100);
  });
}

/* ============================================================
   FORM CREAR / EDITAR
   ============================================================ */
function abrirFormDiseno(disenoId, container) {
  const state = getState();
  const esNuevo = !disenoId;
  const d = esNuevo
    ? { nombre: '', tematica: '', grupo: '', subgrupo: 'Vestuario', tipologia: 'Vestido', precio_base: 0, imagen: '', materiales: '' }
    : (state.disenos || []).find(x => x.id === disenoId);
  if (!d) return;

  const grupos = state.config.grupos || [];
  const subgrupos = state.config.subgrupos || [];
  const tipologias = state.config.tipologias || [];
  const tematicasSugeridas = state.config.tematicas || [];

  const imgPreview = d.imagen
    ? '<img id="f-imagen-preview" src="' + escAttr(d.imagen) + '" alt="" style="max-width:100%;max-height:180px;object-fit:contain;">'
    : '<span id="f-imagen-preview-empty" class="text-caption" style="color:var(--c-color-text-subtle)">Sin imagen</span>';

  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">' + (esNuevo ? 'Nuevo diseno' : 'Editar diseno') + '</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">' + icons.close + '</button>' +
    '</div>' +
    '<div class="modal__body">' +

      '<label class="field"><span class="field__label">Nombre</span>' +
        '<input class="input" id="f-nombre" value="' + escAttr(d.nombre) + '" placeholder="Ej: Kids - Sol Dorado"></label>' +

      '<div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:var(--c-spacing-3)">' +
        '<label class="field"><span class="field__label">Tematica</span>' +
          '<input class="input" id="f-tematica" list="f-tematicas" value="' + escAttr(d.tematica || '') + '">' +
          '<datalist id="f-tematicas">' +
            tematicasSugeridas.map(t => '<option value="' + escAttr(t) + '">').join('') +
          '</datalist>' +
        '</label>' +
        '<label class="field"><span class="field__label">Grupo</span>' +
          '<select class="input input--select" id="f-grupo">' +
            '<option value="">(sin grupo)</option>' +
            grupos.map(g => '<option' + (g === d.grupo ? ' selected' : '') + '>' + g + '</option>').join('') +
          '</select></label>' +
        '<label class="field"><span class="field__label">Subgrupo</span>' +
          '<select class="input input--select" id="f-subgrupo">' +
            subgrupos.map(s => '<option' + (s === d.subgrupo ? ' selected' : '') + '>' + s + '</option>').join('') +
          '</select></label>' +
        '<label class="field"><span class="field__label">Tipologia</span>' +
          '<select class="input input--select" id="f-tipologia">' +
            tipologias.map(t => '<option' + (t === d.tipologia ? ' selected' : '') + '>' + t + '</option>').join('') +
          '</select></label>' +
      '</div>' +

      '<label class="field"><span class="field__label">Precio base</span>' +
        '<input class="input" type="number" id="f-precio" value="' + (d.precio_base || 0) + '"></label>' +

      '<div class="text-caption" style="margin-top:8px">Imagen del diseno</div>' +
      '<div style="display:flex;gap:var(--c-spacing-3);align-items:flex-start">' +
        '<div style="width:180px;height:180px;background:var(--c-color-surface-neutral-subtle);border-radius:var(--c-border-radius-small);display:flex;align-items:center;justify-content:center;overflow:hidden;padding:var(--c-spacing-2);flex-shrink:0">' +
          imgPreview +
        '</div>' +
        '<div style="flex:1;display:flex;flex-direction:column;gap:var(--c-spacing-2)">' +
          '<label class="field"><span class="field__label">Ruta en el repo</span>' +
            '<input class="input" id="f-imagen" value="' + escAttr(d.imagen || '') + '" placeholder="assets/disenos/xxx.png"></label>' +
          '<div style="display:flex;gap:var(--c-spacing-2);align-items:center;flex-wrap:wrap">' +
            '<input type="file" id="f-imagen-file" accept="image/png,image/jpeg,image/webp" style="display:none">' +
            '<button class="btn btn--secondary btn--small" type="button" id="f-imagen-btn">' + icons.upload + ' Subir imagen</button>' +
            '<button class="btn btn--ghost btn--small" type="button" id="f-imagen-quitar">' + icons.trash + ' Quitar</button>' +
            '<span class="text-caption" id="f-imagen-status"></span>' +
          '</div>' +
          '<div class="text-caption">PNG, JPG o WEBP. Recomendado menos de 2 MB. La imagen se sube a <code>assets/disenos/</code>.</div>' +
        '</div>' +
      '</div>' +

      '<label class="field"><span class="field__label">Descripcion / Materiales</span>' +
        '<textarea class="input input--textarea" id="f-materiales" style="min-height:100px">' + esc(d.materiales || '') + '</textarea></label>' +

    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cancelar</button>' +
      '<button class="btn btn--primary" type="button" id="f-guardar">' +
        (esNuevo ? icons.plus + ' Crear' : icons.save + ' Guardar') +
      '</button>' +
    '</div>'
  );

  // Wire: subir imagen
  const fileInput = document.getElementById('f-imagen-file');
  const btnSubir = document.getElementById('f-imagen-btn');
  const btnQuitar = document.getElementById('f-imagen-quitar');
  const inputRuta = document.getElementById('f-imagen');
  const status = document.getElementById('f-imagen-status');
  const previewWrap = document.querySelector('#modal-root .modal__body > div > div:first-child');

  btnSubir.addEventListener('click', () => fileInput.click());

  btnQuitar.addEventListener('click', () => {
    inputRuta.value = '';
    previewWrap.innerHTML = '<span class="text-caption" style="color:var(--c-color-text-subtle)">Sin imagen</span>';
    status.textContent = '';
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen supera los 5 MB. Reducila antes de subirla.', 'warning');
      fileInput.value = '';
      return;
    }

    // Preview local
    const localUrl = URL.createObjectURL(file);
    previewWrap.innerHTML = '<img src="' + localUrl + '" alt="" style="max-width:100%;max-height:180px;object-fit:contain;">';

    status.textContent = 'Subiendo...';
    status.style.color = 'var(--c-color-text-info)';
    btnSubir.disabled = true;

    try {
      const base64 = await fileToBase64(file);
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const slug = slugify(document.getElementById('f-nombre').value || file.name.split('.')[0]);
      const timestamp = Date.now().toString(36);
      const path = 'assets/disenos/' + slug + '-' + timestamp + '.' + ext;

      const state2 = getState();
      await uploadFile(state2.repo, path, base64, 'Subir imagen ' + path);

      inputRuta.value = path;
      status.textContent = 'Imagen subida';
      status.style.color = 'var(--c-color-text-success)';
      showToast('Imagen subida a ' + path, 'success');
    } catch (err) {
      status.textContent = 'Error';
      status.style.color = 'var(--c-color-text-error)';
      showToast('Error: ' + err.message, 'error');
    } finally {
      btnSubir.disabled = false;
    }
  });

  // Wire: guardar
  document.getElementById('f-guardar').addEventListener('click', async () => {
    const nombre = document.getElementById('f-nombre').value.trim();
    if (!nombre) return showToast('El nombre es obligatorio', 'warning');

    const datos = {
      nombre,
      tematica: document.getElementById('f-tematica').value.trim(),
      grupo: document.getElementById('f-grupo').value,
      subgrupo: document.getElementById('f-subgrupo').value,
      tipologia: document.getElementById('f-tipologia').value,
      precio_base: Number(document.getElementById('f-precio').value) || 0,
      imagen: document.getElementById('f-imagen').value.trim(),
      materiales: document.getElementById('f-materiales').value.trim(),
    };

    try {
      if (esNuevo) {
        const id = generarIdDiseno(nombre);
        state.disenos.push(Object.assign({ id }, datos));
        await saveDisenos('Nuevo diseno ' + nombre);
        showToast('Diseno creado', 'success');
      } else {
        Object.assign(d, datos);
        await saveDisenos('Editar diseno ' + nombre);
        showToast('Diseno actualizado', 'success');
      }
      closeModal();
      renderDisenos(container);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
}

function slugify(str) {
  return String(str || 'imagen')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40) || 'imagen';
}

function generarIdDiseno(nombre) {
  const slug = String(nombre || 'diseno')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 30) || 'diseno';
  const r = Math.random().toString(36).slice(2, 6);
  return 'dis_' + slug + '_' + r;
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