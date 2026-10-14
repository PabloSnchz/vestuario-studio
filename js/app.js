// ============================================================
// app.js - Punto de entrada: router, token, evento y tema
// ============================================================

import { loadConfig, loadAll, getState, subscribe } from './store.js';
import { hasToken, setToken, writeJSON } from './github.js';
import { showToast, openModal, closeModal } from './ui.js';

import { renderDashboard } from './views/dashboard.js';
import { renderAlumnas }   from './views/alumnas.js';
import { renderDisenos }   from './views/disenos.js';
import { renderEventos }   from './views/eventos.js';
import { renderPagos }     from './views/pagos.js';
import { renderReportes }  from './views/reportes.js';

const routes = {
  dashboard: { render: renderDashboard, title: 'Dashboard' },
  alumnas:   { render: renderAlumnas,   title: 'Alumnas' },
  disenos:   { render: renderDisenos,   title: 'Disenos' },
  eventos:   { render: renderEventos,   title: 'Eventos' },
  pagos:     { render: renderPagos,     title: 'Pagos' },
  reportes:  { render: renderReportes,  title: 'Reportes' },
};

const viewContainer = document.getElementById('view-container');
const breadcrumbsList = document.getElementById('breadcrumbs-list');
const eventoSelector = document.getElementById('evento-selector');
const temaSelector = document.getElementById('tema-selector');
const btnToken = document.getElementById('btn-token');
const drawerLinks = document.querySelectorAll('.app-drawer__link');

function getRoute() {
  const hash = window.location.hash.replace(/^#\//, '');
  return routes[hash] ? hash : 'dashboard';
}

function navigate() {
  const route = getRoute();
  drawerLinks.forEach(l => l.classList.toggle('is-active', l.dataset.route === route));
  breadcrumbsList.innerHTML =
    '<li><a href="#/dashboard">Inicio</a></li>' +
    '<li aria-current="page">' + routes[route].title + '</li>';
  viewContainer.innerHTML = '';
  routes[route].render(viewContainer);
}

window.addEventListener('hashchange', navigate);

function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema || 'cereza');
}

async function cambiarTema(tema) {
  const state = getState();
  if (!tema || tema === state.config.tema) return;
  const cfg = Object.assign({}, state.config, { tema: tema });
  try {
    await writeJSON(state.repo, 'data/config.json', cfg, 'Cambiar tema a ' + tema);
    state.config.tema = tema;
    aplicarTema(tema);
    showToast('Tema cambiado', 'success');
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
    if (temaSelector) temaSelector.value = state.config.tema || 'cereza';
  }
}

function openTokenModal() {
  const current = hasToken() ? '********' : '';
  openModal(
    '<div class="modal__header">' +
      '<h2 class="modal__title">Configurar token de GitHub</h2>' +
      '<button class="kebab" type="button" data-close aria-label="Cerrar">X</button>' +
    '</div>' +
    '<div class="modal__body">' +
      '<div class="alert alert--info">El token se guarda en este navegador. Debe tener permiso <strong>Contents: Read and write</strong> sobre el repositorio.</div>' +
      '<label class="field">' +
        '<span class="field__label">Token (fine-grained PAT)</span>' +
        '<input type="password" class="input" id="token-input" placeholder="github_pat_..." autocomplete="off" value="' + current + '">' +
      '</label>' +
    '</div>' +
    '<div class="modal__footer">' +
      '<button class="btn btn--ghost" type="button" data-close>Cancelar</button>' +
      '<button class="btn btn--primary" type="button" id="token-save">Guardar token</button>' +
    '</div>'
  );
  document.getElementById('token-save').addEventListener('click', () => {
    const val = document.getElementById('token-input').value.trim();
    if (!val || val === '********') return closeModal();
    setToken(val);
    closeModal();
    showToast('Token guardado', 'success');
  });
}

function cargarEventos() {
  const state = getState();
  const eventos = (state.config && state.config.eventos) || [];
  const activo = state.config ? state.config.evento_activo : '';

  if (eventos.length === 0) {
    eventoSelector.innerHTML = '<option value="">Sin eventos</option>';
    eventoSelector.disabled = true;
    return;
  }

  eventoSelector.disabled = false;
  eventoSelector.innerHTML = eventos.map(ev =>
    '<option value="' + ev.id + '"' + (ev.id === activo ? ' selected' : '') + '>' +
      ev.nombre +
    '</option>'
  ).join('');
}

async function cambiarEvento(id) {
  const state = getState();
  if (!id || id === state.config.evento_activo) return;
  const cfg = Object.assign({}, state.config, { evento_activo: id });
  try {
    await writeJSON(state.repo, 'data/config.json', cfg, 'Cambiar evento activo a ' + id);
    showToast('Evento cambiado', 'success');
    await loadAll();
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
}

subscribe(() => {
  const s = getState();
  if (s.loading) { viewContainer.innerHTML = '<div class="spinner"></div>'; return; }
  if (s.error) { viewContainer.innerHTML = '<div class="alert alert--error">' + s.error + '</div>'; return; }
  navigate();
  cargarEventos();
});

async function init() {
  btnToken.addEventListener('click', openTokenModal);
  eventoSelector.addEventListener('change', (e) => cambiarEvento(e.target.value));
  if (temaSelector) temaSelector.addEventListener('change', (e) => cambiarTema(e.target.value));

  if (!hasToken()) setTimeout(openTokenModal, 300);

  try {
    await loadConfig();
    const t = (getState().config && getState().config.tema) || 'cereza';
    aplicarTema(t);
    if (temaSelector) temaSelector.value = t;
    await loadAll();
  } catch (e) {
    viewContainer.innerHTML = '<div class="alert alert--error">Error al cargar datos: ' + e.message + '</div>';
  }
}

init();