// ============================================================
// views/reportes.js - Reportes basicos + export CSV
// ============================================================

import {
  getState, getParticipantesEvento, calcularEstadoPago,
  findAlumna, findDiseno,
} from '../store.js';
import { setFab } from '../ui.js';

export function renderReportes(container) {
  setFab(null);

  container.innerHTML =
    '<h1 class="text-headline4">Reportes</h1>' +
    '<div class="cards-grid" style="grid-template-columns:repeat(3,1fr)">' +
      cardReporte('Deudores por grupo', 'Alumnas con saldo pendiente', 'deudores') +
      cardReporte('Medidas por grupo', 'Listado para el taller', 'medidas') +
      cardReporte('Cobranza por grupo', 'Total cobrado y pendiente', 'cobranza') +
    '</div>' +
    '<div id="reporte-detalle"></div>';

  container.querySelectorAll('[data-reporte]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tipo = btn.dataset.reporte;
      const detalle = document.getElementById('reporte-detalle');
      if (tipo === 'deudores') renderDeudores(detalle);
      if (tipo === 'medidas')  renderMedidas(detalle);
      if (tipo === 'cobranza') renderCobranza(detalle);
    });
  });
}

function cardReporte(title, meta, tipo) {
  return '<button class="card card--interactive" style="text-align:left" data-reporte="' + tipo + '" type="button">' +
    '<div class="card__title">' + title + '</div>' +
    '<div class="card__meta">' + meta + '</div>' +
  '</button>';
}

function renderDeudores(container) {
  const participantes = getParticipantesEvento();
  const deudores = participantes.filter(p => calcularEstadoPago(p).debe > 0);

  container.innerHTML =
    '<h2 class="text-headline5" style="margin-top:var(--c-spacing-5)">Deudores</h2>' +
    '<div class="toolbar"><div></div><div class="toolbar__actions">' +
      '<button class="btn btn--secondary" type="button" id="exp-deudores">Exportar CSV</button>' +
    '</div></div>' +
    '<div class="table-wrapper"><table class="table">' +
      '<thead><tr><th>Alumna</th><th>Grupo</th><th>Precio</th><th>Pagado</th><th>Debe</th><th>Estado</th></tr></thead>' +
      '<tbody>' +
        (deudores.length === 0
          ? '<tr><td colspan="6"><div class="empty-state">Sin deudores</div></td></tr>'
          : deudores.map(p => {
            const al = findAlumna(p.alumna_id);
            const r = calcularEstadoPago(p);
            return '<tr>' +
              '<td>' + esc(al ? al.nombre : '-') + '</td>' +
              '<td>' + esc(p.grupo || '-') + '</td>' +
              '<td>$' + Number(p.precio_final || 0).toLocaleString('es-AR') + '</td>' +
              '<td>$' + r.pagado.toLocaleString('es-AR') + '</td>' +
              '<td>$' + r.debe.toLocaleString('es-AR') + '</td>' +
              '<td>' + r.estado + '</td>' +
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
    return { alumna: al ? al.nombre : '', grupo: p.grupo, subgrupo: p.subgrupo, medidas: m };
  }).filter(r => r.alumna).sort((a, b) => (a.grupo || '').localeCompare(b.grupo || '') || a.alumna.localeCompare(b.alumna));

  container.innerHTML =
    '<h2 class="text-headline5" style="margin-top:var(--c-spacing-5)">Medidas</h2>' +
    '<div class="toolbar"><div></div><div class="toolbar__actions">' +
      '<button class="btn btn--secondary" type="button" id="exp-medidas">Exportar CSV</button>' +
    '</div></div>' +
    '<div class="table-wrapper"><table class="table">' +
      '<thead><tr><th>Alumna</th><th>Grupo</th><th>Subgrupo</th><th>Busto</th><th>Cintura</th><th>Cadera</th><th>Altura</th><th>Talle</th><th>Obs</th></tr></thead>' +
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
          '<td>' + esc(r.medidas.obs || '') + '</td>' +
        '</tr>').join('') +
      '</tbody>' +
    '</table></div>';

  document.getElementById('exp-medidas').addEventListener('click', () => {
    const rowsCsv = rows.map(r => [
      r.alumna, r.grupo || '', r.subgrupo || '',
      r.medidas.busto || '', r.medidas.cintura || '', r.medidas.cadera || '',
      r.medidas.altura || '', r.medidas.talle || '', r.medidas.obs || '',
    ]);
    exportCSV('medidas.csv', ['Alumna','Grupo','Subgrupo','Busto','Cintura','Cadera','Altura','Talle','Obs'], rowsCsv);
  });
}

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
      '<button class="btn btn--secondary" type="button" id="exp-cobranza">Exportar CSV</button>' +
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