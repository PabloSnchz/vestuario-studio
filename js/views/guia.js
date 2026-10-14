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
      descripcion: 'Resumen del evento activo: alumnas, dise&ntilde;os, eventos, cobranza y reportes.',
      acciones: [
        'Ver el estado general del evento de un vistazo',
        'Click en cualquier card para ir al m&oacute;dulo',
        'Ver cu&aacute;nto se cobr&oacute; y cu&aacute;nto falta cobrar',
      ],
    },
    {
      icono: 'users', color: 'var(--c-color-fill-success)',
      titulo: 'Alumnas',
      subtitulo: 'Gesti&oacute;n de alumnas y cobranza',
      descripcion: 'El coraz&oacute;n del sistema. Ac&aacute; se cargan las alumnas, se asignan dise&ntilde;os y se controla el pago.',
      acciones: [
        'Filtrar por grupo (chips arriba), subgrupo, estado de pago o buscar por nombre',
        'Click en el nombre para ver el detalle y medidas de la alumna',
        'Bot&oacute;n Editar para modificar precio, cuotas, medidas y dise&ntilde;o asignado',
        'Descargar plantilla, completar en Excel, e Importar Excel',
        'Bot&oacute;n Asignar dise&ntilde;os para asignar un dise&ntilde;o a todo un grupo',
        'Bot&oacute;n Inactivar alumnas para sacar a varias del evento (no se borran)',
        'Check "Ver inactivas" para ver las que fueron sacadas del evento',
      ],
    },
    {
      icono: 'shirt', color: 'var(--c-color-fill-primary)',
      titulo: 'Dise&ntilde;os',
      subtitulo: 'Cat&aacute;logo de vestuarios',
      descripcion: 'Todos los dise&ntilde;os del evento, con foto, precio y materiales.',
      acciones: [
        'Filtrar por tem&aacute;tica o grupo',
        'Click en un dise&ntilde;o para ver detalle, precio y descripci&oacute;n completa',
        'Bot&oacute;n Editar para modificar precio, materiales, grupo o imagen',
        'Bot&oacute;n Subir imagen dentro del editor (sin ir a GitHub)',
        'Bot&oacute;n Asignar para aplicar el dise&ntilde;o a las alumnas del grupo',
        'Bot&oacute;n + (abajo a la derecha) para crear un dise&ntilde;o nuevo',
      ],
    },
    {
      icono: 'calendar', color: 'var(--c-color-fill-warning)',
      titulo: 'Eventos',
      subtitulo: 'Las exhibiciones del a&ntilde;o',
      descripcion: 'Cada evento tiene sus propias alumnas, pagos y dise&ntilde;os.',
      acciones: [
        'Ver todos los eventos y cu&aacute;l est&aacute; activo',
        'Bot&oacute;n Activar para cambiar el evento con el que se trabaja',
        'Bot&oacute;n + para crear un evento nuevo (con opci&oacute;n de clonar participantes del anterior)',
        'Bot&oacute;n Clonar para duplicar un evento existente',
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
        'Bot&oacute;n Editar para modificar cuotas, bonificaci&oacute;n o precio',
        'Registrar pago de Cuota 1 o Cuota 2',
      ],
    },
    {
      icono: 'chart', color: 'var(--c-color-fill-error)',
      titulo: 'Reportes',
      subtitulo: 'An&aacute;lisis y control',
      descripcion: 'Cinco indicadores para saber c&oacute;mo viene el evento.',
      acciones: [
        'Cobranza: cu&aacute;nto cobraste vs el total',
        'Deudores: qui&eacute;nes deben plata',
        'Medidas: a qui&eacute;nes les falta tomar medidas',
        'Dise&ntilde;os: a qui&eacute;nes les falta asignar dise&ntilde;o',
        'Cuotas: progreso de pago por grupo',
        'Cada reporte se puede exportar a CSV',
      ],
    },
    {
      icono: 'settings', color: 'var(--c-color-fill-neutral-strong)',
      titulo: 'Cat&aacute;logos',
      subtitulo: 'Configuraci&oacute;n del sistema',
      descripcion: 'Los grupos, subgrupos, tem&aacute;ticas y tipolog&iacute;as que se usan en toda la app.',
      acciones: [
        'Agregar un grupo nuevo (ej: Juveniles)',
        'Renombrar un grupo (se actualiza autom&aacute;ticamente en alumnas y dise&ntilde;os)',
        'Eliminar un grupo solo si no est&aacute; en uso',
        'Lo mismo para subgrupos, tem&aacute;ticas y tipolog&iacute;as',
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
          '<h2 class="text-headline6" style="margin:0">' + s.titulo + '</h2>' +
          '<p class="text-caption" style="margin:0;color:var(--c-color-text-subtle)">' + s.subtitulo + '</p>' +
        '</div>' +
      '</div>' +
      '<p class="text-bodysmall" style="color:var(--c-color-text);margin-bottom:var(--c-spacing-3)">' + s.descripcion + '</p>' +
      '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:var(--c-spacing-2)">' +
        s.acciones.map(a =>
          '<li style="display:flex;gap:var(--c-spacing-2);align-items:flex-start">' +
            '<span style="color:' + s.color + ';font-weight:700;flex-shrink:0;line-height:1.5">&rarr;</span>' +
            '<span class="text-bodysmall">' + a + '</span>' +
          '</li>'
        ).join('') +
      '</ul>' +
    '</div>'
  ).join('');

  container.innerHTML =
    '<h1 class="text-headline4">Gu&iacute;a de uso</h1>' +
    '<p class="text-bodysmall" style="color:var(--c-color-text-subtle);margin-bottom:var(--c-spacing-5)">' +
      'Todo lo que necesit&aacute;s saber para manejar Vestuario Studio. ' +
      'Cada pantalla tiene una funci&oacute;n espec&iacute;fica, pensada para que el trabajo sea m&aacute;s r&aacute;pido y visual.' +
    '</p>' +

    '<div class="card" style="background:var(--c-color-fill-primary-subtle);border:none;margin-bottom:var(--c-spacing-5)">' +
      '<h2 class="text-headline6" style="margin:0 0 var(--c-spacing-2) 0">Antes de arrancar</h2>' +
      '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:var(--c-spacing-2)">' +
        '<li style="display:flex;gap:var(--c-spacing-2);align-items:flex-start"><span style="color:var(--c-color-text-primary);font-weight:700">1.</span><span class="text-bodysmall">Configur&aacute; el token de GitHub la primera vez (bot&oacute;n arriba a la derecha). Se guarda en tu navegador.</span></li>' +
        '<li style="display:flex;gap:var(--c-spacing-2);align-items:flex-start"><span style="color:var(--c-color-text-primary);font-weight:700">2.</span><span class="text-bodysmall">Eleg&iacute; el evento activo (arriba). Todo el sistema trabaja sobre ese evento.</span></li>' +
        '<li style="display:flex;gap:var(--c-spacing-2);align-items:flex-start"><span style="color:var(--c-color-text-primary);font-weight:700">3.</span><span class="text-bodysmall">Si algo falla, mir&aacute; la consola del navegador con F12 o revis&aacute; el README en GitHub.</span></li>' +
      '</ul>' +
    '</div>' +

    seccionesHtml +

    '<div class="card" style="background:var(--c-color-surface-neutral-subtle);border:none;margin-top:var(--c-spacing-5)">' +
      '<h2 class="text-headline6" style="margin:0 0 var(--c-spacing-3) 0">Tips y atajos</h2>' +
      '<div class="cards-grid" style="grid-template-columns:1fr 1fr;gap:var(--c-spacing-3)">' +
        tip('Cambiar el tema', 'Us&aacute; el selector "Tema" arriba. Se guarda en tu navegador.') +
        tip('Cambiar de evento', 'Us&aacute; el selector "Evento activo" arriba.') +
        tip('Si el token vence', 'And&aacute; a GitHub &rarr; Settings &rarr; Developer settings &rarr; Tokens y gener&aacute; uno nuevo. Despu&eacute;s actualizalo con el bot&oacute;n "Configurar token".') +
        tip('Historial de cambios', 'Cada vez que guard&aacute;s algo se hace un commit en GitHub. Se puede volver atr&aacute;s desde el repo.') +
      '</div>' +
    '</div>';
}

function tip(titulo, texto) {
  return '<div>' +
    '<div class="text-caption" style="font-weight:700;color:var(--c-color-text-strong);margin-bottom:var(--c-spacing-1)">' + titulo + '</div>' +
    '<div class="text-bodysmall" style="color:var(--c-color-text-subtle)">' + texto + '</div>' +
  '</div>';
}