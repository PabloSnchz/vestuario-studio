// ============================================================
// views/alumnas.js - Listado, filtros, edicion
// ============================================================

import {
  getState, getParticipantesEvento, calcularEstadoPago,
  findAlumna, findDiseno, saveAlumnas, saveEventoActivo,
} from '../store.js';
import { setFab, openModal, closeModal, showToast } from '../ui.js';
import { descargarPlantilla, abrirImportador } from '../importar.js';
import { abrirAsignador } from '../asignar.js';
import { abrirReincorporador } from '../reincorporar.js';

const filtros = { grupo: '', subgrupo: '', estado: '', q: '' };

export function renderAlumnas(container) {
  setFab('Nueva alumna', () => nuevaAlumna(container));

  const participantes = getParticipantesEvento();
  const grupos = uniq(participantes.map(p => p.grupo));
  const subgrupos = uniq(participantes.map(p => p.subgrupo));

  const filtrados = aplicarFiltros(participantes);

  const contadores = {};
  for (const p of participantes) {
    const g = p.grupo || 'Sin grupo';
    contadores[g] = (contadores[g] || 0) + 1;
  }
  const ordenCfg = (getState().config && getState().config.grupos) || [];
  const gruposOrdenados = ordenCfg.filter(g => contadores[g]);
  for (const g of Object.keys(contadores)) {
    if (gruposOrdenados.indexOf(g) === -1) gruposOrdenados.push(g);
  }
  const contadoresHtml = gruposOrdenados.map(g => {
    const n = contadores[g];
    const activo = filtros.grupo === g;
    return '<button class="chip' + (activo ? ' is-selected' : '') + '" data-chip-grupo="' + escAttr(g) + '" type="button" title="Filtrar por ' + escAttr(g) + '">' +
      esc(g) + ' <strong>(' + n + ')</strong></button>';
  }).join('');

  container.innerHTML =
    '<h1 class="text-headline4">Alumnas</h1>' +

    '<div class="card" style="padding:var(--c-spacing-4)">' +
      '<div class="text-caption" style="margin-bottom:var(--c-spacing-2)">Grupos</div>' +
      '<div class="chips">' + contadoresHtml + '</div>' +
    '</div>' +

    '<div class="toolbar">' +
      '<div class="toolbar__filters">' +
        sel('Subgrupo', 'subgrupo', subgrupos,                  filtros.subgrupo) +
        sel('Estado',   'estado',   ['pagado','parcial','sin_pago'], filtros.estado) +
        '<input class="input" style="width:220px" type="search" data-f="q" placeholder="Buscar nombre..." value="' + escAttr(filtros.q) + '">' +
        '<button class="btn btn--ghost btn--small" type="button" data-limpiar title="Quitar todos los filtros">Limpiar filtros</button>' +
      '</div>' +
      '<div class="toolbar__actions">' +
        '<button class="btn btn--primary btn--small" type="button" data-modo-edicion title="Editar por lote: grupo, subgrupo, precio y altas">Modo edicion</button>' +
        '<button class="btn btn--secondary btn--small" type="button" data-asignar title="Asignar disenos a alumnas por grupo">Asignar disenos</button>' +
        '<button class="btn btn--secondary btn--small" type="button" data-reincorporar title="Agregar una alumna del maestro al evento activo">+ Reincorporar alumna</button>' +
        '<span style="width:1px;height:20px;background:var(--c-color-border-subtle);margin:0 var(--c-spacing-2)"></span>' +
        '<button class="btn btn--secondary btn--small" type="button" data-importar title="Importar alumnas desde Excel">Importar Excel</button>' +
        '<button class="btn btn--ghost btn--small" type="button" data-plantilla title="Descargar planilla CSV para importar alumnas">Descargar plantilla</button>' +
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
      '<th>Nombre</th><th>Grupo</th><th>Subgrupo</th><th>Diseno</th><th>Precio</th><th>Estado</th><th>Debe</th><th></th>' +
    '</tr></thead>' +
    '<tbody>' +
      (filtrados.length === 0
        ? '<tr><td colspan="8"><div class="empty-state">Sin resultados</div></td></tr>'
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
  const bonif = p.bonificacion ? ' <span class="badge badge--info" title="Bonificacion">-' + Number(p.bonificacion).toLocaleString('es-AR') + '</span>' : '';
  const subKey = (p.subgrupo || '').replace(/"/g, '');
  return '<tr data-id="' + escAttr(p.alumna_id) + '" data-sub="' + escAttr(subKey) + '">' +
    '<td><button class="btn-link" data-ver style="background:none;border:none;padding:0;color:var(--c-color-text-info);cursor:pointer;text-align:left;font:inherit;" title="Ver detalle de la alumna">' + esc(al ? al.nombre : '(sin nombre)') + '</button></td>' +
    '<td>' + esc(p.grupo || '-') + '</td>' +
    '<td>' + esc(p.subgrupo || '-') + '</td>' +
    '<td>' + esc(dis ? dis.nombre : '-') + '</td>' +
    '<td>$' + Number(p.precio_final || 0).toLocaleString('es-AR') + bonif + '</td>' +
    '<td><span class="badge badge--' + (clases[r.estado] || 'neutral') + '">' + (labels[r.estado] || r.estado) + '</span></td>' +
    '<td>$' + r.debe.toLocaleString('es-AR') + '</td>' +
    '<td><div class="table__actions">' +
      '<button class="btn btn--secondary btn--small" data-editar title="Editar alumna, precio, cuotas, medidas">Editar</button>' +
    '</div></td>' +
  '</tr>';
}

function wire(container) {
  container.querySelectorAll('[data-chip-grupo]').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = btn.dataset.chipGrupo;
      filtros.grupo = (filtros.grupo === g) ? '' : g;
      renderAlumnas(container);
    });
  });

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
          ? '<tr><td colspan="8"><div class="empty-state">Sin resultados</div></td></tr>'
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

  const btnAsignar = container.querySelector('[data-asignar]');
  if (btnAsignar) btnAsignar.addEventListener('click', () => abrirAsignador(() => renderAlumnas(container)));

  const btnReincorporar = container.querySelector('[data-reincorporar]');
  if (btnReincorporar) btnReincorporar.addEventListener('click', () => abrirReincorporador(() => renderAlumnas(container)));

  const btnModoEdicion = container.querySelector('[data-modo-edicion]');
  if (btnModoEdicion) {
    btnModoEdicion.addEventListener('click', async () => {
      const mod = await import('../batch.js');
      mod.abrirModoEdicion(() => renderAlumnas(container));
    });
  }

  wireRows(container);
}

function wireRows(container) {
  container.querySelectorAll('[data-ver]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tr = btn.closest('tr');
      verDetalle(tr.dataset.id, tr.dataset.sub, container);
    });
  });
  container.querySelectorAll('[data-editar]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tr = btn.closest('tr');
      editarParticipante(tr.dataset.id, tr.dataset.sub, container);
    });
  });
}

function verDetalle(alumnaId, subgrupo, container) {
  const al = findAlumna(alumnaId);
  if (!al) return;
  const m = al.medidas || {};
  const state = getState();
  const participaciones = state.eventoActivo.participantes.filter(p => p.alumna_id === alumnaId);

  const partHtml = participaciones.map(p => {
    const dis = findDiseno(p.diseno_id);
    const r = calcularEstadoPago(p);
    return '<div style="padding:var(--c-spacing-3);border:1px solid var(--c-color-border-subtle);border-radius:var(--c-border-radius-small);margin-bottom:var(--c-spacing-2)">' +
      '<strong>' + esc(p.grupo) + ' / ' + esc(p.subgrupo) + '</strong><br>' +
      '<span class="text-caption">Diseno: ' + esc(dis ? dis.nombre : '-') + '</span><br>' +
      '<span class="text-caption">Precio: $' + Number(p.precio_final || 0).toLocaleString('es-AR') +
        (p.bonificacion ? ' (- $' + Number(p.bonificacion).toLocaleString('es-AR') + ')' : '') + '</span><br>' +
      '<span class="text-caption">Debe: $' + r.debe.toLocaleString('es-AR') + ' / ' + r.estado + '</span>' +
    '</div>';
  }).join('');

  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">' + esc(al.nombre) + '</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">X</button>' +
    '</div>' +
    '<div class="modal__body">' +
      '<div><div class="text-caption">Medidas</div>' +
        '<p>Busto: ' + (m.busto || '-') + ' / Cintura: ' + (m.cintura || '-') + ' / Cadera: ' + (m.cadera || '-') + '</p>' +
        '<p>Altura: ' + (m.altura || '-') + ' / Talle: ' + esc(m.talle || '-') + '</p>' +
        (m.obs ? '<p class="text-caption">Obs: ' + esc(m.obs) + '</p>' : '') +
      '</div>' +
      '<div><div class="text-caption">Participaciones en este evento</div>' + partHtml + '</div>' +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cerrar</button>' +
      '<button class="btn btn--primary" type="button" id="det-editar">Editar</button>' +
    '</div>'
  );

  document.getElementById('det-editar').addEventListener('click', () => {
    closeModal();
    setTimeout(() => editarParticipante(alumnaId, subgrupo, container), 100);
  });
}

function editarParticipante(alumnaId, subgrupo, container) {
  const al = findAlumna(alumnaId);
  if (!al) return;
  const state = getState();
  const p = state.eventoActivo.participantes.find(x =>
    x.alumna_id === alumnaId && (x.subgrupo || '') === (subgrupo || '')
  );
  if (!p) {
    showToast('No se encontro la participacion', 'warning');
    return;
  }
  const m = al.medidas || {};
  const c1 = (p.cuotas && p.cuotas[0]) || { nro: 1, monto: 0, pagado: false, fecha: null };
  const c2 = (p.cuotas && p.cuotas[1]) || { nro: 2, monto: 0, pagado: false, fecha: null };
  const disenos = state.disenos || [];

  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">Editar - ' + esc(al.nombre) + '</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">X</button>' +
    '</div>' +
    '<div class="modal__body">' +

      '<div class="text-caption" style="margin-top:8px">Datos de la alumna</div>' +
      '<label class="field"><span class="field__label">Nombre</span>' +
        '<input class="input" id="e-nombre" value="' + escAttr(al.nombre) + '"></label>' +

      '<div class="text-caption" style="margin-top:8px">Participacion en este evento</div>' +
      '<div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:var(--c-spacing-3)">' +
        '<label class="field"><span class="field__label">Grupo</span>' +
          '<select class="input input--select" id="e-grupo">' +
            (getState().config.grupos || []).map(g =>
              '<option' + (g === p.grupo ? ' selected' : '') + '>' + esc(g) + '</option>'
            ).join('') +
          '</select></label>' +
        '<label class="field"><span class="field__label">Subgrupo</span>' +
          '<select class="input input--select" id="e-subgrupo">' +
            (getState().config.subgrupos || []).map(s =>
              '<option' + (s === p.subgrupo ? ' selected' : '') + '>' + esc(s) + '</option>'
            ).join('') +
          '</select></label>' +
        '<label class="field"><span class="field__label">Tipologia</span>' +
          '<input class="input" id="e-tipologia" value="' + escAttr(p.tipologia || '') + '"></label>' +
        '<label class="field"><span class="field__label">Diseno asignado</span>' +
          '<select class="input input--select" id="e-diseno">' +
            '<option value="">(sin diseno)</option>' +
            disenos.map(d =>
              '<option value="' + escAttr(d.id) + '"' + (d.id === p.diseno_id ? ' selected' : '') + '>' +
                esc(d.nombre) +
              '</option>'
            ).join('') +
          '</select></label>' +
      '</div>' +

      '<div class="text-caption" style="margin-top:8px">Precio y bonificacion</div>' +
      '<div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:var(--c-spacing-3)">' +
        '<label class="field"><span class="field__label">Precio final</span>' +
          '<input class="input" type="number" id="e-precio" value="' + (p.precio_final || 0) + '"></label>' +
        '<label class="field"><span class="field__label">Bonificacion</span>' +
          '<input class="input" type="number" id="e-bonif" value="' + (p.bonificacion || 0) + '"></label>' +
      '</div>' +

      '<div class="text-caption" style="margin-top:8px">Cuotas</div>' +
      '<div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:var(--c-spacing-3)">' +
        '<label class="field"><span class="field__label">Cuota 1 monto</span>' +
          '<input class="input" type="number" id="e-c1m" value="' + (c1.monto || 0) + '"></label>' +
        '<label class="field"><span class="field__label">Cuota 1 pagada</span>' +
          '<input type="checkbox" id="e-c1p" ' + (c1.pagado ? 'checked' : '') + '></label>' +
        '<label class="field"><span class="field__label">Cuota 2 monto</span>' +
          '<input class="input" type="number" id="e-c2m" value="' + (c2.monto || 0) + '"></label>' +
        '<label class="field"><span class="field__label">Cuota 2 pagada</span>' +
          '<input type="checkbox" id="e-c2p" ' + (c2.pagado ? 'checked' : '') + '></label>' +
      '</div>' +

      '<div class="text-caption" style="margin-top:8px">Medidas</div>' +
      '<div class="cards-grid" style="grid-template-columns:repeat(3,1fr);gap:var(--c-spacing-3)">' +
        '<label class="field"><span class="field__label">Busto</span>' +
          '<input class="input" type="number" id="e-busto" value="' + (m.busto || '') + '"></label>' +
        '<label class="field"><span class="field__label">Cintura</span>' +
          '<input class="input" type="number" id="e-cintura" value="' + (m.cintura || '') + '"></label>' +
        '<label class="field"><span class="field__label">Cadera</span>' +
          '<input class="input" type="number" id="e-cadera" value="' + (m.cadera || '') + '"></label>' +
        '<label class="field"><span class="field__label">Altura</span>' +
          '<input class="input" type="number" id="e-altura" value="' + (m.altura || '') + '"></label>' +
        '<label class="field"><span class="field__label">Talle</span>' +
          '<input class="input" id="e-talle" value="' + escAttr(m.talle || '') + '"></label>' +
      '</div>' +
      '<label class="field"><span class="field__label">Observaciones</span>' +
        '<textarea class="input input--textarea" id="e-obs">' + esc(m.obs || '') + '</textarea></label>' +

      '<label class="field"><span class="field__label">Notas del evento</span>' +
        '<textarea class="input input--textarea" id="e-notas">' + esc(p.notas || '') + '</textarea></label>' +

    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cancelar</button>' +
      '<button class="btn btn--secondary" type="button" id="e-quitar" title="Quita la alumna del evento. Se puede reincorporar despues.">Quitar del evento</button>' +
      '<button class="btn btn--primary" type="button" id="e-guardar">Guardar</button>' +
    '</div>'
  );

  document.getElementById('e-guardar').addEventListener('click', async () => {
    al.nombre = document.getElementById('e-nombre').value.trim() || al.nombre;
    al.medidas = {
      busto: Number(document.getElementById('e-busto').value) || null,
      cintura: Number(document.getElementById('e-cintura').value) || null,
      cadera: Number(document.getElementById('e-cadera').value) || null,
      altura: Number(document.getElementById('e-altura').value) || null,
      talle: document.getElementById('e-talle').value.trim(),
      obs: document.getElementById('e-obs').value.trim(),
    };
    p.grupo = document.getElementById('e-grupo').value;
    p.subgrupo = document.getElementById('e-subgrupo').value;
    p.tipologia = document.getElementById('e-tipologia').value.trim();
    p.diseno_id = document.getElementById('e-diseno').value;
    p.precio_final = Number(document.getElementById('e-precio').value) || 0;
    p.bonificacion = Number(document.getElementById('e-bonif').value) || 0;
    p.cuotas = [
      { nro: 1, monto: Number(document.getElementById('e-c1m').value) || 0,
        pagado: document.getElementById('e-c1p').checked, fecha: c1.fecha || null },
      { nro: 2, monto: Number(document.getElementById('e-c2m').value) || 0,
        pagado: document.getElementById('e-c2p').checked, fecha: c2.fecha || null },
    ];
    p.notas = document.getElementById('e-notas').value.trim();
    try {
      await saveAlumnas('Editar alumna ' + al.nombre);
      await saveEventoActivo('Editar participacion ' + al.nombre);
      closeModal();
      showToast('Cambios guardados', 'success');
      renderAlumnas(container);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });

  document.getElementById('e-quitar').addEventListener('click', async () => {
    if (!confirm('Quitar a ' + al.nombre + ' del evento? Se puede reincorporar despues desde el boton + Reincorporar alumna.')) return;
    const state2 = getState();
    state2.eventoActivo.participantes = state2.eventoActivo.participantes.filter(
      x => !(x.alumna_id === alumnaId && (x.subgrupo || '') === (subgrupo || ''))
    );
    try {
      await saveEventoActivo('Quitar ' + al.nombre + ' del evento');
      closeModal();
      showToast('Alumna quitada del evento', 'success');
      renderAlumnas(container);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
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
      '<div class="alert alert--info">Crea la alumna en el maestro. Para asociarla al evento, usa <strong>+ Reincorporar alumna</strong> o importala desde Excel.</div>' +
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
      showToast('Alumna creada en el maestro. Usa + Reincorporar para agregarla al evento.', 'success');
      renderAlumnas(container);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
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