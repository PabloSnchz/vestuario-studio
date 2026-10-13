// ============================================================
// importar.js - Lectura de Excel/CSV, preview, importacion
// Usa SheetJS (window.XLSX) cargado por CDN.
// ============================================================

import {
  getState, generarId, saveAlumnas, saveEventoActivo, loadAll,
} from './store.js';
import { openModal, closeModal, showToast } from './ui.js';

const PLANTILLA_HEADERS = [
  'nombre', 'grupo', 'subgrupo', 'tematica', 'diseno_id', 'tipologia',
  'precio_final', 'bonificacion', 'cuota1_pagada', 'cuota2_pagada', 'notas',
  'busto', 'cintura', 'cadera', 'altura', 'talle', 'observaciones',
];

export function descargarPlantilla() {
  const csv = [PLANTILLA_HEADERS, [
    'Ejemplo Alumna', 'Adolescentes', 'Vestuario', 'Noche/Luna', 'dis_vitral_luna',
    'Vestido', 75000, 0, 'SI', 'NO', '', 85, 65, 90, 165, 'M', '',
  ]].map(row => row.map(cell => {
    const s = String(cell == null ? '' : cell);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'plantilla-importacion.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function abrirImportador(onDone) {
  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">Importar alumnas</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">X</button>' +
    '</div>' +
    '<div class="modal__body">' +
      '<div class="alert alert--info">' +
        'Acepta Excel (.xlsx, .xls) o CSV. El archivo debe tener las columnas de la plantilla. ' +
        'Si la columna <strong>diseno_id</strong> queda vacia, se asigna el primer diseno que coincida por tematica y grupo.' +
      '</div>' +
      '<label class="field">' +
        '<span class="field__label">Archivo</span>' +
        '<input type="file" class="input" id="imp-file" accept=".xlsx,.xls,.csv">' +
      '</label>' +
      '<div id="imp-preview"></div>' +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cancelar</button>' +
      '<button class="btn btn--primary" type="button" id="imp-confirmar" disabled>Importar</button>' +
    '</div>',
    null
  );

  let filas = [];

  document.getElementById('imp-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      filas = await leerArchivo(file);
      mostrarPreview(filas);
      document.getElementById('imp-confirmar').disabled = filas.length === 0;
    } catch (err) {
      showToast('Error leyendo archivo: ' + err.message, 'error');
    }
  });

  document.getElementById('imp-confirmar').addEventListener('click', async () => {
    try {
      await aplicarImportacion(filas);
      closeModal();
      await loadAll();
      showToast('Importacion completada: ' + filas.length + ' filas', 'success');
      if (onDone) onDone();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
}

async function leerArchivo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = window.XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = window.XLSX.utils.sheet_to_json(ws, { defval: '' });
        resolve(json.map(normalizarFila));
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function normalizarFila(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const key = String(k).trim().toLowerCase()
      .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
      .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u');
    out[key] = v;
  }
  return out;
}

function mostrarPreview(filas) {
  const preview = document.getElementById('imp-preview');
  if (filas.length === 0) {
    preview.innerHTML = '<div class="empty-state">Sin datos</div>';
    return;
  }
  const cols = ['nombre', 'grupo', 'subgrupo', 'diseno_id', 'precio_final'];
  preview.innerHTML =
    '<p class="text-caption">' + filas.length + ' filas detectadas:</p>' +
    '<div class="table-wrapper"><table class="table">' +
      '<thead><tr>' + cols.map(c => '<th>' + c + '</th>').join('') + '</tr></thead>' +
      '<tbody>' + filas.slice(0, 8).map(f => '<tr>' +
        cols.map(c => '<td>' + esc(f[c] || '') + '</td>').join('') +
      '</tr>').join('') +
      (filas.length > 8 ? '<tr><td colspan="' + cols.length + '" class="text-caption">... y ' + (filas.length - 8) + ' mas</td></tr>' : '') +
      '</tbody>' +
    '</table></div>';
}

function bool(v) {
  if (v === true) return true;
  const s = String(v || '').trim().toLowerCase();
  return ['si', 'sí', 's', 'true', '1', 'x', 'yes'].includes(s);
}

async function aplicarImportacion(filas) {
  const state = getState();
  const alumnas = state.alumnas || [];
  const disenos = state.disenos || [];
  const participantes = state.eventoActivo.participantes || [];

  for (const f of filas) {
    const nombre = String(f.nombre || '').trim();
    if (!nombre) continue;

    // Buscar o crear alumna
    let alumna = alumnas.find(a => a.nombre.toLowerCase() === nombre.toLowerCase());
    if (!alumna) {
      alumna = {
        id: generarId('alu'),
        nombre,
        contacto: '',
        tutor: '',
        medidas: {
          busto: Number(f.busto) || null,
          cintura: Number(f.cintura) || null,
          cadera: Number(f.cadera) || null,
          altura: Number(f.altura) || null,
          talle: String(f.talle || '').trim(),
          obs: String(f.observaciones || '').trim(),
        },
        activa_global: true,
        notas: '',
      };
      alumnas.push(alumna);
    } else {
      // Actualizar medidas si vienen
      if (!alumna.medidas) alumna.medidas = {};
      if (f.busto) alumna.medidas.busto = Number(f.busto);
      if (f.cintura) alumna.medidas.cintura = Number(f.cintura);
      if (f.cadera) alumna.medidas.cadera = Number(f.cadera);
      if (f.altura) alumna.medidas.altura = Number(f.altura);
      if (f.talle) alumna.medidas.talle = String(f.talle).trim();
      if (f.observaciones) alumna.medidas.obs = String(f.observaciones).trim();
    }

    // Determinar diseno
    let disenoId = String(f.diseno_id || '').trim();
    if (!disenoId) {
      const d = disenos.find(x =>
        x.grupo === f.grupo &&
        (!f.tematica || x.tematica === f.tematica)
      );
      if (d) disenoId = d.id;
    }

    // Precio
    const precioFinal = Number(f.precio_final) || 0;
    const bonif = Number(f.bonificacion) || 0;
    const totalPagar = precioFinal - bonif;
    const cuotaMonto = Math.round(totalPagar / 2);

    const cuota1 = { nro: 1, monto: cuotaMonto, pagado: bool(f.cuota1_pagada), fecha: null };
    const cuota2 = { nro: 2, monto: cuotaMonto, pagado: bool(f.cuota2_pagada), fecha: null };

    // Buscar participacion existente (misma alumna y mismo subgrupo)
    const existente = participantes.find(p =>
      p.alumna_id === alumna.id &&
      (p.subgrupo || '') === (f.subgrupo || '')
    );

    if (existente) {
      existente.grupo = f.grupo || existente.grupo;
      existente.diseno_id = disenoId || existente.diseno_id;
      existente.tipologia = f.tipologia || existente.tipologia;
      existente.precio_final = precioFinal || existente.precio_final;
      existente.bonificacion = bonif;
      existente.cuotas = [cuota1, cuota2];
      existente.notas = String(f.notas || '');
      existente.activa_en_evento = true;
    } else {
      participantes.push({
        alumna_id: alumna.id,
        activa_en_evento: true,
        grupo: String(f.grupo || ''),
        subgrupo: String(f.subgrupo || ''),
        diseno_id: disenoId,
        tipologia: String(f.tipologia || ''),
        precio_final: precioFinal,
        bonificacion: bonif,
        cuotas: [cuota1, cuota2],
        notas: String(f.notas || ''),
      });
    }
  }

  state.eventoActivo.participantes = participantes;

  await saveAlumnas('Importacion alumnas ' + new Date().toISOString());
  await saveEventoActivo('Importacion participantes ' + new Date().toISOString());
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}