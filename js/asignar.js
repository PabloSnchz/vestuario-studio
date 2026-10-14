// ============================================================
// asignar.js - Asignacion masiva de disenos por grupo
// Acepta un diseno preseleccionado (opcional).
// ============================================================

import {
  getState, findDiseno, saveEventoActivo,
} from './store.js';
import { openModal, closeModal, showToast } from './ui.js';

let _preseleccion = null;
let _onDone = null;

export function abrirAsignador(onDone, disenoId) {
  _onDone = onDone || null;
  _preseleccion = disenoId || null;
  renderModal();
}

function renderModal() {
  const state = getState();
  const participantes = state.eventoActivo.participantes || [];
  const disenos = state.disenos || [];
  const grupos = ['Babys', 'Kids', 'Pre Teens', 'Adolescentes'];

  // Si hay preseleccion, mostramos alert
  const disPre = _preseleccion ? disenos.find(d => d.id === _preseleccion) : null;
  const alertPre = disPre
    ? '<div class="alert alert--info">' +
        'Asignando el diseno <strong>' + esc(disPre.nombre) + '</strong> ($' +
        Number(disPre.precio_base || 0).toLocaleString('es-AR') + ') ' +
        'a las alumnas del grupo <strong>' + esc(disPre.grupo) + '</strong>.' +
      '</div>'
    : '';

  const gruposHtml = grupos.map(g => {
    const total = participantes.filter(p => p.grupo === g).length;
    if (total === 0) return '';
    const sinDiseno = participantes.filter(p => p.grupo === g && !p.diseno_id).length;
    const conDiseno = total - sinDiseno;
    const disenosGrupo = disenos.filter(d => d.grupo === g);

    if (disenosGrupo.length === 0) {
      return '<div class="card" style="padding:var(--c-spacing-4);margin-bottom:var(--c-spacing-3);opacity:0.6">' +
        '<strong>' + esc(g) + '</strong>' +
        '<div class="text-caption" style="margin-top:var(--c-spacing-2)">No hay disenos cargados para este grupo</div>' +
      '</div>';
    }

    const esAdolescentes = g === 'Adolescentes';
    const tieneVestidos = participantes.some(p => p.grupo === g && (p.tipologia || '').toLowerCase() !== 'pantalon');
    const tienePantalones = participantes.some(p => p.grupo === g && (p.tipologia || '').toLowerCase() === 'pantalon');
    const mostrarFiltroTipo = esAdolescentes && tieneVestidos && tienePantalones;

    // Determinar diseno por defecto
    let disenoDefault = disenosGrupo[0].id;
    if (_preseleccion && disPre && disPre.grupo === g && disenosGrupo.some(d => d.id === _preseleccion)) {
      disenoDefault = _preseleccion;
    }

    const filtroTipoHtml = mostrarFiltroTipo
      ? '<label class="field" style="margin-top:var(--c-spacing-2)"><span class="field__label">Filtrar por tipologia</span>' +
          '<select class="input input--select" data-grupo="' + escAttr(g) + '" data-rol="tipo">' +
            '<option value="">Todos (Vestidos y Pantalones)</option>' +
            '<option value="vestido">Solo Vestidos</option>' +
            '<option value="pantalon">Solo Pantalones</option>' +
          '</select></label>'
      : '';

    // Preseleccionar "Solo sin diseno" siempre
    const targetDefault = 'sin_diseno';

    return '<div class="card" style="padding:var(--c-spacing-4);margin-bottom:var(--c-spacing-3)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--c-spacing-3);flex-wrap:wrap;gap:var(--c-spacing-2)">' +
        '<strong style="font-size:var(--c-typography-headline6-size)">' + esc(g) + '</strong>' +
        '<span class="text-caption">' + total + ' alumnas &middot; ' +
          '<span style="color:var(--c-color-text-success)">' + conDiseno + ' con diseno</span> &middot; ' +
          '<span style="color:var(--c-color-text-caution)">' + sinDiseno + ' sin diseno</span>' +
        '</span>' +
      '</div>' +
      '<div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:var(--c-spacing-3)">' +
        '<label class="field"><span class="field__label">Diseno a asignar</span>' +
          '<select class="input input--select" data-grupo="' + escAttr(g) + '" data-rol="diseno">' +
            disenosGrupo.map(d =>
              '<option value="' + escAttr(d.id) + '"' + (d.id === disenoDefault ? ' selected' : '') + '>' +
                esc(d.nombre) +
                ' ($' + Number(d.precio_base || 0).toLocaleString('es-AR') + ')' +
              '</option>'
            ).join('') +
          '</select></label>' +
        '<label class="field"><span class="field__label">Aplicar a</span>' +
          '<select class="input input--select" data-grupo="' + escAttr(g) + '" data-rol="target">' +
            '<option value="sin_diseno"' + (targetDefault === 'sin_diseno' ? ' selected' : '') + '>Solo sin diseno (' + sinDiseno + ')</option>' +
            '<option value="todos">Todos (' + total + ')</option>' +
          '</select></label>' +
      '</div>' +
      filtroTipoHtml +
      '<div style="margin-top:var(--c-spacing-3)">' +
        '<button class="btn btn--primary btn--small" data-aplicar="' + escAttr(g) + '" type="button">Aplicar asignacion</button>' +
      '</div>' +
    '</div>';
  }).join('');

  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">Asignar disenos por grupo</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">X</button>' +
    '</div>' +
    '<div class="modal__body">' +
      alertPre +
      '<div class="alert alert--info">' +
        'Asigna un diseno a todas las alumnas de un grupo. ' +
        'Podes reasignar solo a quienes no tienen diseno, o sobreescribir a todas. ' +
        'Las excepciones individuales se editan desde el boton <strong>Editar</strong> de cada alumna.' +
      '</div>' +
      gruposHtml +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cerrar</button>' +
    '</div>'
  );

  document.querySelectorAll('[data-aplicar]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const grupo = btn.dataset.aplicar;
      const disenoSel = document.querySelector('[data-grupo="' + grupo + '"][data-rol="diseno"]');
      const targetSel = document.querySelector('[data-grupo="' + grupo + '"][data-rol="target"]');
      const tipoSel = document.querySelector('[data-grupo="' + grupo + '"][data-rol="tipo"]');

      const disenoId = disenoSel.value;
      const target = targetSel.value;
      const tipo = tipoSel ? tipoSel.value : '';

      let count = 0;
      for (const p of participantes) {
        if (p.grupo !== grupo) continue;
        if (target === 'sin_diseno' && p.diseno_id) continue;
        if (tipo === 'vestido' && (p.tipologia || '').toLowerCase() === 'pantalon') continue;
        if (tipo === 'pantalon' && (p.tipologia || '').toLowerCase() !== 'pantalon') continue;
        p.diseno_id = disenoId;
        count++;
      }

      if (count === 0) {
        showToast('No hay alumnas que coincidan con el filtro', 'warning');
        return;
      }

      try {
        await saveEventoActivo('Asignacion masiva ' + grupo + ' -> ' + disenoId);
        showToast(count + ' alumnas actualizadas en ' + grupo, 'success');
        renderModal();
        if (_onDone) _onDone();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });
  });
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escAttr(s) { return esc(s); }