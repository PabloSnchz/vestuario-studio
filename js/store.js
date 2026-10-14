// ============================================================
// store.js - Estado global + carga/guardado de datos
// ============================================================

import { readJSON, writeJSON } from './motor.js';

const listeners = new Set();

const state = {
  config: null,
  repo: null,
  alumnas: [],
  disenos: [],
  eventoActivo: null,
  loading: false,
  error: null,
};

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn(state);
}

export function getState() {
  return state;
}

export async function loadConfig() {
  const res = await fetch('data/config.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar data/config.json');
  state.config = await res.json();
  state.repo = state.config.repo;
  return state.config;
}

export async function loadAll() {
  state.loading = true;
  state.error = null;
  emit();

  try {
    const [alumnas, disenos] = await Promise.all([
      readJSON(state.repo, 'data/alumnas.json'),
      readJSON(state.repo, 'data/disenos.json'),
    ]);
    state.alumnas = alumnas || [];
    state.disenos = disenos || [];

    const eventoId = state.config.evento_activo;
    const evento = await readJSON(state.repo, `data/eventos/${eventoId}.json`);
    state.eventoActivo = evento;
  } catch (e) {
    state.error = e.message;
  } finally {
    state.loading = false;
    emit();
  }
}

export async function saveAlumnas(message) {
  await writeJSON(state.repo, 'data/alumnas.json', state.alumnas, message || 'Actualizacion alumnas');
}

export async function saveDisenos(message) {
  await writeJSON(state.repo, 'data/disenos.json', state.disenos, message || 'Actualizacion disenos');
}

export async function saveEventoActivo(message) {
  if (!state.eventoActivo) throw new Error('No hay evento activo');
  const id = state.eventoActivo.id;
  await writeJSON(state.repo, `data/eventos/${id}.json`, state.eventoActivo, message || `Actualizacion evento ${id}`);
}


export async function saveConfig(message) {
  await writeJSON(state.repo, 'data/config.json', state.config, message || 'Actualizacion config');
}
export function findAlumna(id) {
  return state.alumnas.find((a) => a.id === id) || null;
}

export function findDiseno(id) {
  return state.disenos.find((d) => d.id === id) || null;
}

export function getParticipantesEvento() {
  return state.eventoActivo ? state.eventoActivo.participantes : [];
}

export function calcularEstadoPago(participante) {
  const cuotas = participante.cuotas || [];
  const total = participante.precio_final || 0;
  const bonif = participante.bonificacion || 0;
  const aPagar = total - bonif;
  const pagado = cuotas.reduce((acc, c) => acc + (c.pagado ? c.monto : 0), 0);
  const debe = aPagar - pagado;

  if (participante.bonificado) return { estado: 'bonificado', pagado, debe: 0, aPagar };
  if (debe <= 0) return { estado: 'pagado', pagado, debe: 0, aPagar };
  if (pagado > 0) return { estado: 'parcial', pagado, debe, aPagar };
  return { estado: 'sin_pago', pagado: 0, debe: aPagar, aPagar };
}

export function generarId(prefijo) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefijo}_${Date.now().toString(36)}_${rand}`;
}