// ============================================================
// views/guia.js - Guia visual de uso
// ============================================================

import { setFab } from '../ui.js';
import { icons } from '../icons.js';

export function renderGuia(container) {
  setFab(null);

  const secciones = [
    {
      icono: 'dashboard', color: 'var(--c-color-fill-info)',
      titulo: 'Dashboard',
      subtitulo: 'El punto de partida',
      descripcion: 'Resumen del evento activo: alumnas, disenos, eventos, cobranza y reportes.',
      acciones: [
        'Ver el estado general del evento de un vistazo',
        'Click en cualquier card para ir al modulo',
        'Ver cuanto se cobro y cuanto falta cobrar',
      ],
    },
    {
      icono: 'users', color: 'var(--c-color-fill-success)',
      titulo: 'Alumnas',
      subtitulo: 'Gestion de alumnas y cobranza',
      descripcion: 'El corazon del sistema. Aca se cargan las alumnas, se asignan disenos y se controla el pago.',
      acciones: [
        'Filtrar por grupo (chips arriba), subgrupo, estado de pago o buscar por nombre',
        'Click en el nombre para ver el detalle y medidas de la alumna',
        'Boton Editar para modificar precio, cuotas, medidas y diseno asignado',
        'Descargar plantilla â†’ completar en Excel â†’ Importar Excel',
        'Boton Asignar disenos para asignar un diseno a todo un grupo',
        'Boton Inactivar alumnas para sacar a varias del evento (no se borran)',
        'Check "Ver inactivas" para ver las que fueron sacadas del evento',
      ],
    },
    {
      icono: 'shirt', color: 'var(--c-color-fill-primary)',
      titulo: 'Disenos',
      subtitulo: 'Catalogo de vestuarios',
      descripcion: 'Todos los disenos del evento, con foto, precio y materiales.',
      acciones: [
        'Filtrar por tematica o grupo',
        'Click en un diseno para ver detalle, precio y descripcion completa',
        'Boton Editar para modificar precio, materiales, grupo o imagen',
        'Boton Subir imagen dentro del editor (sin ir a GitHub)',
        'Boton Asignar para aplicar el diseno a las alumnas del grupo',
        'Boton + (abajo a la derecha) para crear un diseno nuevo',
      ],
    },
    {
      icono: 'calendar', color: 'var(--c-color-fill-warning)',
      titulo: 'Eventos',
      subtitulo: 'Las exhibiciones del ano',
      descripcion: 'Cada evento tiene sus propias alumnas, pagos y disenos.',
      acciones: [
        'Ver todos los eventos y cual esta activo',
        'Boton Activar para cambiar el evento con el que se trabaja',
        'Boton + para crear un evento nuevo (con opcion de clonar participantes del anterior)',
        'Boton Clonar para duplicar un evento existente',
      ],
    },
    {
      icono: 'money', color: 'var(--c-color-fill-caution)',
      titulo: 'Pagos',
      subtitulo: 'Cobranza y cuotas',
      descripcion: 'Todo lo relacionado con el cobro: cuotas, bonificaciones y saldos.',
      acciones: [
        'Ver total a pagar, cobrado y por cobrar',
        'Filtrar por grupo o estado (chips y selects)',
        'Boton Editar para modificar cuotas, bonificacion o precio',
        'Registrar pago de Cuota 1 o Cuota 2',
      ],
    },
    {
      icono: 'chart', color: 'var(--c-color-fill-error)',
      titulo: 'Reportes',
      subtitulo: 'Analisis y control',
      descripcion: 'Cinco indicadores para saber como viene el evento.',
      acciones: [
        'Cobranza: cuanto cobraste vs el total',
        'Deudores: quienes deben plata',
        'Medidas: a quienes les falta tomar medidas',
        'Disenos: a quienes les falta asignar diseno',
        'Cuotas: progreso de pago por grupo',
        'Cada reporte se puede exportar a CSV',
      ],
    },
    {
      icono: 'settings', color: 'var(--c-color-fill-neutral-strong)',
      titulo: 'Catalogos',
      subtitulo: 'Configuracion del sistema',
      descripcion: 'Los grupos, subgrupos, tematicas y tipologias que se usan en toda la app.',
      acciones: [
        'Agregar un grupo nuevo (ej: Juveniles)',
        'Renombrar un grupo (se actualiza automaticamente en alumnas y disenos)',
        'Eliminar un grupo solo si no esta en uso',
        'Lo mismo para subgrupos, tematicas y tipologias',
      ],
    },
  ];

  const seccionesHtml = secciones.map(s =>
    '<div class="card" style="border-left:4px solid ' + s.color + ';padding-left:var(--c-spacing-5);margin-bottom:var(--c-spacing-4)">' +
      '<div style="display:flex;gap:var(--c-spacing-4);align-items:center;margin-bottom:var(--c-spacing-3)">' +
        '<div style="width:48px;height:48px;border-radius:50%;background:' + s.color + ';color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
          (icons[s.icono] || '') +
        '</div>' +
        '<div>' +
          '<h2 class="text-headline6" style="margin:0">' + esc(s.titulo) + '</h2>' +
          '<p class="text-caption" style="margin:0;color:var(--c-color-text-subtle)">' + esc(s.subtitulo) + '</p>' +
        '</div>' +
      '</div>' +
      '<p class="text-bodysmall" style="color:var(--c-color-text);margin-bottom:var(--c-spacing-3)">' + esc(s.descripcion) + '</p>' +
      '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:var(--c-spacing-2)">' +
        s.acciones.map(a =>
          '<li style="display:flex;gap:var(--c-spacing-2);align-items:flex-start">' +
            '<span style="color:' + s.color + ';font-weight:700;flex-shrink:0;line-height:1.5">â†’</span>' +
            '<span class="text-bodysmall">' + esc(a) + '</span>' +
          '</li>'
        ).join('') +
      '</ul>' +
    '</div>'
  ).join('');

  container.innerHTML =
    '<h1 class="text-headline4">Guia de uso</h1>' +
    '<p class="text-bodysmall" style="color:var(--c-color-text-subtle);margin-bottom:var(--c-spacing-5)">' +
      'Todo lo que necesitas saber para manejar Vestuario Studio. ' +
      'Cada pantalla tiene una funcion especifica, pensada para que el trabajo sea mas rapido y visual.' +
    '</p>' +

    '<div class="card" style="background:var(--c-color-fill-primary-subtle);border:none;margin-bottom:var(--c-spacing-5)">' +
      '<h2 class="text-headline6" style="margin:0 0 var(--c-spacing-2) 0">Antes de arrancar</h2>' +
      '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:var(--c-spacing-2)">' +
        '<li style="display:flex;gap:var(--c-spacing-2);align-items:flex-start"><span style="color:var(--c-color-text-primary);font-weight:700">1.</span><span class="text-bodysmall">Configura el token de GitHub la primera vez (boton arriba a la derecha). Se guarda en tu navegador.</span></li>' +
        '<li style="display:flex;gap:var(--c-spacing-2);align-items:flex-start"><span style="color:var(--c-color-text-primary);font-weight:700">2.</span><span class="text-bodysmall">Elegi el evento activo (arriba). Todo el sistema trabaja sobre ese evento.</span></li>' +
        '<li style="display:flex;gap:var(--c-spacing-2);align-items:flex-start"><span style="color:var(--c-color-text-primary);font-weight:700">3.</span><span class="text-bodysmall">Si algo falla, mira la consola del navegador con F12 o revisa el README en GitHub.</span></li>' +
      '</ul>' +
    '</div>' +

    seccionesHtml +

    '<div class="card" style="background:var(--c-color-surface-neutral-subtle);border:none;margin-top:var(--c-spacing-5)">' +
      '<h2 class="text-headline6" style="margin:0 0 var(--c-spacing-3) 0">Tips y atajos</h2>' +
      '<div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:var(--c-spacing-3)">' +
        tip('Cambiar el tema', 'Usa el selector "Tema" arriba. Se guarda en tu navegador.') +
        tip('Cambiar de evento', 'Usa el selector "Evento activo" arriba.') +
        tip('Si el token vence', 'Anda a GitHub â†’ Settings â†’ Developer settings â†’ Tokens y generÃ¡ uno nuevo. Despues actualizalo con el boton "Configurar token".') +
        tip('Historial de cambios', 'Cada vez que guardas algo se hace un commit en GitHub. Se puede volver atras desde el repo.') +
      '</div>' +
    '</div>';
}

function tip(titulo, texto) {
  return '<div>' +
    '<div class="text-caption" style="font-weight:700;color:var(--c-color-text-strong);margin-bottom:var(--c-spacing-1)">' + esc(titulo) + '</div>' +
    '<div class="text-bodysmall" style="color:var(--c-color-text-subtle)">' + esc(texto) + '</div>' +
  '</div>';
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}