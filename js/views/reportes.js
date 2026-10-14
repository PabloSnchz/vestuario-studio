// ============================================================
// views/reportes.js - Reportes en 2 filas
// Fila 1 (macro):     Cobranza | Deudores
// Fila 2 (operativo): Medidas | Disenos | Cuotas
// ============================================================

import {
  getState, getParticipantesEvento, calcularEstadoPago,
  findAlumna, findDiseno,
} from '../store.js';
import { setFab } from '../ui.js';

export function renderReportes(container) {
  setFab(null);
  const state = getState();
  const participantes = getParticipantesEvento();
  const total = participantes.length;

  // ===== Macro =====
  let aPagar = 0, cobrado = 0;
  for (const p of participantes) {
    const r = calcularEstadoPago(p);
    aPagar += r.aPagar;
    cobrado += r.pagado;
  }
  const pctCobranza = aPagar > 0 ? Math.round(cobrado / aPagar * 100) : 0;

  const deudores = participantes.filter(p => calcularEstadoPago(p).debe > 0);
  const deudaTotal = deudores.reduce((s, p) => s + calcularEstadoPago(p).debe, 0);

  // ===== Operativo =====
  const sinMedidas = participantes.filter(p => {
    const al = findAlumna(p.alumna_id);
    const m = (al && al.medidas) || {};
    return !(m.busto || m.cintura || m.cadera || m.altura || m.talle);
  });
  const conMedidas = total - sinMedidas.length;
  const pctMedidas = total > 0 ? Math.round(conMedidas / total * 100) : 0;

  const sinDiseno = participantes.filter(p => !p.diseno_id);
  const conDiseno = total - sinDiseno.length;
  const pctDiseno = total > 0 ? Math.round(conDiseno / total * 100) : 0;

  const c1 = participantes.filter(p => p.cuotas && p.cuotas[0] && p.cuotas[0].pagado).length;
  const c2 = participantes.filter(p => p.cuotas && p.cuotas[1] && p.cuotas[1].pagado).length;
  const totalCuotas = total * 2;
  const pctCuotas = totalCuotas > 0 ? Math.round((c1 + c2) / totalCuotas * 100) : 0;

  container.innerHTML =
    '<h1 class="text-headline4">Reportes</h1>' +
    '<p class="text-bodysmall" style="color:var(--c-color-text-subtle)">' +
      'Evento activo: <strong>' + esc(state.eventoActivo ? state.eventoActivo.nombre : '-') + '</strong>' +
    '</p>' +

    '<h2 class="text-titlelarge" style="margin-top:var(--c-spacing-5)">Resumen general</h2>' +
    '<div class="cards-grid" style="grid-template-columns:repeat(2,1fr)">' +
      cardReporte({
        tipo: 'cobranza',
        titulo: 'Cobranza',
        subtitulo: 'Cobrado vs total del evento',
        color: 'var(--c-color-fill-success)',
        principal: '$' + cobrado.toLocaleString('es-AR'),
        secundaria: 'de $' + aPagar.toLocaleString('es-AR') + ' (' + pctCobranza + '%)',
        progreso: pctCobranza,
      }) +
      cardReporte({
        tipo: 'deudores',
        titulo: 'Deudores',
        subtitulo: 'Alumnas con saldo pendiente',
        color: 'var(--c-color-fill-error)',
        principal: deudores.length + ' alumnas',
        secundaria: '$' + deudaTotal.toLocaleString('es-AR') + ' adeudado',
      }) +
    '</div>' +

    '<h2 class="text-titlelarge" style="margin-top:var(--c-spacing-6)">Estado operativo</h2>' +
    '<div class="cards-grid" style="grid-template-columns:repeat(3,1fr)">' +
      cardReporte({
        tipo: 'medidas',
        titulo: 'Medidas',
        subtitulo: 'Faltantes de tomar',
        color: 'var(--c-color-fill-info)',
        principal: sinMedidas.length + ' sin tomar',
        secundaria: conMedidas + ' de ' + total + ' con medidas',
        progreso: pctMedidas,
      }) +
      cardReporte({
        tipo: 'disenos',
        titulo: 'Disenos asignados',
        subtitulo: 'Faltantes de asignar',
        color: 'var(--c-color-fill-primary)',
        principal: sinDiseno.length + ' sin asignar',
        secundaria: conDiseno + ' de ' + total + ' con diseno',
        progreso: pctDiseno,
      }) +
      cardReporte({
        tipo: 'cuotas',
        titulo: 'Progreso de cuotas',
        subtitulo: 'Cuota 1 y Cuota 2',
        color: 'var(--c-color-fill-caution)',
        principal: pctCuotas + '% cobrado',
        secundaria: 'C1: ' + c1 + ' / ' + total + '  Â·  C2: ' + c2 + ' / ' + total,
        progreso: pctCuotas,
      }) +
    '</div>' +

    '<div id="reporte-detalle"></div>';

  container.querySelectorAll('[data-reporte]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tipo = btn.dataset.reporte;
      const detalle = document.getElementById('reporte-detalle');
      if (tipo === 'cobranza') renderCobranza(detalle);
      if (tipo === 'deudores') renderDeudores(detalle);
      if (tipo === 'medidas')  renderMedidas(detalle);
      if (tipo === 'disenos')  renderDisenos(detalle);
      if (tipo === 'cuotas')   renderCuotas(detalle);
      detalle.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function cardReporte(opts) {
  return '<button class="card card--interactive" style="text-align:left;border-left:4px solid ' + opts.color + ';padding-left:var(--c-spacing-4);" data-reporte="' + opts.tipo + '" type="button">' +
    '<div class="card__title">' + esc(opts.titulo) + '</div>' +
    '<div class="card__meta">' + esc(opts.subtitulo) + '</div>' +
    '<div style="margin-top:var(--c-spacing-2)">' +
      '<div style="font-family:var(--c-font-family-headline);font-size:var(--c-typography-headline4-size);font-weight:700;color:var(--c-color-text-strong)">' +
        esc(opts.principal) +
      '</div>' +
      '<div class="text-caption">' + esc(opts.secundaria) + '</div>' +
    '</div>' +
    (opts.progreso !== undefined
      ? '<div style="margin-top:var(--c-spacing-3);height:6px;border-radius:3px;background:var(--c-color-surface-neutral-subtle);overflow:hidden">' +
          '<div style="height:100%;width:' + opts.progreso + '%;background:' + opts.color + ';transition:width .3s"></div>' +
        '</div>'
      : '') +
    '<div class="text-caption" style="margin-top:var(--c-spacing-3);color:var(--c-color-text-info)">Ver detalle â†’</div>' +
  '</button>';
}

// ====== Detalles ======

function renderCobranza(container) {
  const participantes = getParticipantesEvento();
  const porGrupo = {};
  for (const p of participantes) {
    const g = p.grupo || 'Sin grupo';
    if (!porGrupo[g]) porGrupo[g] = { aPagar: 0, pagado: 0, debe: 0, n: 0 };
    const r = calcularEstadoPago(p);
    porGrupo[g].aPagar += r.aPagar;
    porGrupo[g].pagado += r.pagado;
    porGrupo[g].debe += r.debe;
    porGrupo[g].n += 1;
  }

  container.innerHTML =
    '<h2 class="text-headline5" style="margin-top:var(--c-spacing-5)">Cobranza por grupo</h2>' +
    '<div class="toolbar"><div></div><div class="toolbar__actions">' +
      '<button class="btn btn--secondary btn--small" type="button" id="exp-cobranza">Exportar CSV</button>' +
    '</div></div>' +
    '<div class="table-wrapper"><table class="table">' +
      '<thead><tr><th>Grupo</th><th>Alumnas</th><th>Total a pagar</th><th>Cobrado</th><th>Por cobrar</th></tr></thead>' +
      '<tbody>' +
        Object.entries(porGrupo).map(([g, v]) => '<tr>' +
          '<td>' + esc(g) + '</td>' +
          '<td>' + v.n + '</td>' +
          '<td>$' + v.aPagar.toLocaleString('es-AR') + '</td>' +
          '<td>$' + v.pagado.toLocaleString('es-AR') + '</td>' +
          '<td>$' + v.debe.toLocaleString('es-AR') + '</td>' +
        '</tr>').join('') +
      '</tbody>' +
    '</table></div>';

  document.getElementById('exp-cobranza').addEventListener('click', () => {
    const rows = Object.entries(porGrupo).map(([g, v]) => [g, v.n, v.aPagar, v.pagado, v.debe]);
    exportCSV('cobranza-por-grupo.csv', ['Grupo','Alumnas','A pagar','Cobrado','Por cobrar'], rows);
  });
}

function renderDeudores(container) {
  const participantes = getParticipantesEvento();
  const deudores = participantes.filter(p => calcularEstadoPago(p).debe > 0);

  container.innerHTML =
    '<h2 class="text-headline5" style="margin-top:var(--c-spacing-5)">Deudores</h2>' +
    '<div class="toolbar"><div></div><div class="toolbar__actions">' +
      '<button class="btn btn--secondary btn--small" type="button" id="exp-deudores">Exportar CSV</button>' +
    '</div></div>' +
    '<div class="table-wrapper"><table class="table">' +
      '<thead><tr><th>Alumna</th><th>Grupo</th><th>Precio</th><th>Pagado</th><th>Debe</th><th>Estado</th></tr></thead>' +
      '<tbody>' +
        (deudores.length === 0
          ? '<tr><td colspan="6"><div class="empty-state">Sin deudores</div></td></tr>'
          : deudores.map(p => {
            const al = findAlumna(p.alumna_id);
            const r = calcularEstadoPago(p);
            const labels = { pagado: 'Pagado', parcial: 'Parcial', sin_pago: 'Sin pago', bonificado: 'Bonificado' };
            return '<tr>' +
              '<td>' + esc(al ? al.nombre : '-') + '</td>' +
              '<td>' + esc(p.grupo || '-') + '</td>' +
              '<td>$' + Number(p.precio_final || 0).toLocaleString('es-AR') + '</td>' +
              '<td>$' + r.pagado.toLocaleString('es-AR') + '</td>' +
              '<td>$' + r.debe.toLocaleString('es-AR') + '</td>' +
              '<td>' + (labels[r.estado] || r.estado) + '</td>' +
            '</tr>';
          }).join('')) +
      '</tbody>' +
    '</table></div>';

  document.getElementById('exp-deudores').addEventListener('click', () => {
    const rows = deudores.map(p => {
      const al = findAlumna(p.alumna_id);
      const r = calcularEstadoPago(p);
      return [al ? al.nombre : '', p.grupo || '', p.precio_final || 0, r.pagado, r.debe, r.estado];
    });
    exportCSV('deudores.csv', ['Alumna','Grupo','Precio','Pagado','Debe','Estado'], rows);
  });
}

function renderMedidas(container) {
  const participantes = getParticipantesEvento();
  const rows = participantes.map(p => {
    const al = findAlumna(p.alumna_id);
    const m = (al && al.medidas) || {};
    const tiene = !!(m.busto || m.cintura || m.cadera || m.altura || m.talle);
    return { alumna: al ? al.nombre : '', grupo: p.grupo, subgrupo: p.subgrupo, medidas: m, tiene };
  }).sort((a, b) => {
    if (a.tiene !== b.tiene) return a.tiene ? 1 : -1;
    return a.alumna.localeCompare(b.alumna);
  });

  const faltantes = rows.filter(r => !r.tiene).length;

  container.innerHTML =
    '<h2 class="text-headline5" style="margin-top:var(--c-spacing-5)">Medidas por tomar</h2>' +
    '<p class="text-bodysmall" style="color:var(--c-color-text-subtle)">' +
      faltantes + ' alumnas sin medidas cargadas' +
    '</p>' +
    '<div class="toolbar"><div></div><div class="toolbar__actions">' +
      '<button class="btn btn--secondary btn--small" type="button" id="exp-medidas">Exportar CSV</button>' +
    '</div></div>' +
    '<div class="table-wrapper"><table class="table">' +
      '<thead><tr><th>Alumna</th><th>Grupo</th><th>Subgrupo</th><th>Busto</th><th>Cintura</th><th>Cadera</th><th>Altura</th><th>Talle</th><th>Estado</th></tr></thead>' +
      '<tbody>' +
        rows.map(r => '<tr>' +
          '<td>' + esc(r.alumna) + '</td>' +
          '<td>' + esc(r.grupo || '-') + '</td>' +
          '<td>' + esc(r.subgrupo || '-') + '</td>' +
          '<td>' + (r.medidas.busto || '-') + '</td>' +
          '<td>' + (r.medidas.cintura || '-') + '</td>' +
          '<td>' + (r.medidas.cadera || '-') + '</td>' +
          '<td>' + (r.medidas.altura || '-') + '</td>' +
          '<td>' + (r.medidas.talle || '-') + '</td>' +
          '<td>' + (r.tiene
            ? '<span class="badge badge--success">Completas</span>'
            : '<span class="badge badge--error">Sin tomar</span>') + '</td>' +
        '</tr>').join('') +
      '</tbody>' +
    '</table></div>';

  document.getElementById('exp-medidas').addEventListener('click', () => {
    const rowsCsv = rows.map(r => [
      r.alumna, r.grupo || '', r.subgrupo || '',
      r.medidas.busto || '', r.medidas.cintura || '', r.medidas.cadera || '',
      r.medidas.altura || '', r.medidas.talle || '', r.tiene ? 'OK' : 'Falta',
    ]);
    exportCSV('medidas.csv', ['Alumna','Grupo','Subgrupo','Busto','Cintura','Cadera','Altura','Talle','Estado'], rowsCsv);
  });
}

function renderDisenos(container) {
  const participantes = getParticipantesEvento();
  const rows = participantes.map(p => {
    const al = findAlumna(p.alumna_id);
    const d = findDiseno(p.diseno_id);
    return {
      alumna: al ? al.nombre : '',
      grupo: p.grupo,
      subgrupo: p.subgrupo,
      diseno: d ? d.nombre : '-',
      tiene: !!p.diseno_id,
    };
  }).sort((a, b) => {
    if (a.tiene !== b.tiene) return a.tiene ? 1 : -1;
    return a.alumna.localeCompare(b.alumna);
  });

  const faltantes = rows.filter(r => !r.tiene).length;

  container.innerHTML =
    '<h2 class="text-headline5" style="margin-top:var(--c-spacing-5)">Disenos sin asignar</h2>' +
    '<p class="text-bodysmall" style="color:var(--c-color-text-subtle)">' +
      faltantes + ' alumnas sin diseno asignado' +
    '</p>' +
    '<div class="toolbar"><div></div><div class="toolbar__actions">' +
      '<button class="btn btn--secondary btn--small" type="button" id="exp-disenos">Exportar CSV</button>' +
    '</div></div>' +
    '<div class="table-wrapper"><table class="table">' +
      '<thead><tr><th>Alumna</th><th>Grupo</th><th>Subgrupo</th><th>Diseno</th><th>Estado</th></tr></thead>' +
      '<tbody>' +
        rows.map(r => '<tr>' +
          '<td>' + esc(r.alumna) + '</td>' +
          '<td>' + esc(r.grupo || '-') + '</td>' +
          '<td>' + esc(r.subgrupo || '-') + '</td>' +
          '<td>' + esc(r.diseno) + '</td>' +
          '<td>' + (r.tiene
            ? '<span class="badge badge--success">Asignado</span>'
            : '<span class="badge badge--error">Sin asignar</span>') + '</td>' +
        '</tr>').join('') +
      '</tbody>' +
    '</table></div>';

  document.getElementById('exp-disenos').addEventListener('click', () => {
    const rowsCsv = rows.map(r => [r.alumna, r.grupo || '', r.subgrupo || '', r.diseno, r.tiene ? 'OK' : 'Falta']);
    exportCSV('disenos.csv', ['Alumna','Grupo','Subgrupo','Diseno','Estado'], rowsCsv);
  });
}

function renderCuotas(container) {
  const participantes = getParticipantesEvento();
  const porGrupo = {};
  for (const p of participantes) {
    const g = p.grupo || 'Sin grupo';
    if (!porGrupo[g]) porGrupo[g] = { n: 0, c1: 0, c2: 0 };
    porGrupo[g].n += 1;
    if (p.cuotas && p.cuotas[0] && p.cuotas[0].pagado) porGrupo[g].c1 += 1;
    if (p.cuotas && p.cuotas[1] && p.cuotas[1].pagado) porGrupo[g].c2 += 1;
  }

  container.innerHTML =
    '<h2 class="text-headline5" style="margin-top:var(--c-spacing-5)">Progreso de cuotas por grupo</h2>' +
    '<div class="table-wrapper"><table class="table">' +
      '<thead><tr><th>Grupo</th><th>Alumnas</th><th>Cuota 1 pagadas</th><th>Cuota 2 pagadas</th><th>Progreso</th></tr></thead>' +
      '<tbody>' +
        Object.entries(porGrupo).map(([g, v]) => {
          const total = v.n * 2;
          const pagas = v.c1 + v.c2;
          const pct = total > 0 ? Math.round(pagas / total * 100) : 0;
          return '<tr>' +
            '<td>' + esc(g) + '</td>' +
            '<td>' + v.n + '</td>' +
            '<td>' + v.c1 + ' / ' + v.n + '</td>' +
            '<td>' + v.c2 + ' / ' + v.n + '</td>' +
            '<td>' + pct + '%</td>' +
          '</tr>';
        }).join('') +
      '</tbody>' +
    '</table></div>';
}

function exportCSV(filename, headers, rows) {
  const csv = [headers, ...rows].map(r => r.map(cell => {
    const s = String(cell == null ? '' : cell);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}