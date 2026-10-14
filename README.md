# Vestuario Studio

Sistema de gestión visual de vestuario, alumnas, diseños, eventos y cobranza para el **Estudio de Arte Chantal Aiello**.

Aplicación estática (HTML + CSS + JS) hosteada en **GitHub Pages**, con los datos en archivos **JSON** versionados en el mismo repositorio. No hay backend: la app lee los JSON con `fetch` y los escribe usando la **API de GitHub** con un token personal.

---

## Requisitos

- Cuenta de GitHub.
- Repositorio `vestuario-studio` (público).
- GitHub Pages habilitado (rama `main`, carpeta raíz).
- Un **token fine-grained** de GitHub con permiso `Contents: Read and write` sobre este repositorio.

---

## Setup inicial (una sola vez)

### 1. Crear el repositorio

1. Crear un repo público llamado `vestuario-studio`.
2. Subir todo el contenido de esta carpeta.

### 2. Habilitar GitHub Pages

1. Repo → **Settings** → **Pages**.
2. Source: `Deploy from a branch`.
3. Branch: `main`, folder: `/ (root)`.
4. Guardar. En 1-2 minutos el sitio está online en:
   `https://TU_USUARIO.github.io/vestuario-studio/`

### 3. Agregar a Silvana como colaboradora

1. Repo → **Settings** → **Collaborators and teams**.
2. Invitar al usuario `sricutini-dsg` con permiso **Write**.

### 4. Generar el token para Silvana

1. Ingresar a GitHub como `sricutini-dsg`.
2. Ir a **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
3. Configuración:
   - **Token name**: `vestuario-studio`
   - **Expiration**: 90 días (o custom).
   - **Repository access**: Only select repositories → `vestuario-studio`.
   - **Permissions** → **Repository permissions** → **Contents**: `Read and write`.
4. Generar y **copiar el token** (empieza con `github_pat_...`).

### 5. Configurar el owner del repo

Editar `data/config.json` y reemplazar `TU_USUARIO_GITHUB` por el usuario dueño del repositorio.

---

## Uso diario

### Primer ingreso

1. Abrir `https://TU_USUARIO.github.io/vestuario-studio/`.
2. La app va a pedir el **token**. Pegar el token generado y guardar.
3. El token se guarda en el navegador y no se vuelve a pedir.

### Dashboard

Muestra el resumen del evento activo: alumnas activas, diseños, evento, total cobrado y por cobrar, reportes disponibles.

### Alumnas

- **Listado** con filtros por grupo, subgrupo, estado de pago y búsqueda por nombre.
- **Descargar plantilla**: baja un CSV con las columnas esperadas por el importador.
- **Importar Excel**: lee `.xlsx`, `.xls` o `.csv`. Detecta las columnas, muestra una preview y guarda en GitHub.
- **Editar medidas**: botón `M` en cada fila.
- **Inactivar en el evento**: botón `X` en cada fila.
- **Nueva alumna**: FAB inferior derecho. Crea la alumna, pero **no** la asocia al evento.

### Diseños

Galería visual de todos los diseños cargados, con filtros por temática y grupo.

### Eventos

Listado de eventos (activo/inactivo). Permite crear un evento nuevo, clonar participantes de otro, y activar cualquiera.

### Pagos

Listado de participantes con precio final, bonificación, cuotas 1 y 2, deuda y estado. Botón de edición por fila.

### Reportes

- **Deudores**: alumnas con saldo pendiente.
- **Medidas**: listado completo para el taller.
- **Cobranza por grupo**: totales agregados.
- Exportables a CSV.

---

## Estructura de datos

- `data/config.json`: configuración general (evento activo, grupos, subgrupos, temáticas, tipologías, cuotas, eventos).
- `data/alumnas.json`: datos maestros de cada alumna.
- `data/disenos.json`: catálogo de diseños.
- `data/eventos/<id>.json`: participantes de cada evento.

Una alumna puede tener **varias participaciones en el mismo evento** (distinto subgrupo).

---

## Estructura del repositorio

vestuario-studio/
├── index.html
├── css/
│ ├── tokens.css
│ └── styles.css
├── js/
│ ├── app.js
│ ├── github.js
│ ├── store.js
│ ├── ui.js
│ ├── importar.js
│ └── views/
├── data/
│ ├── config.json
│ ├── alumnas.json
│ ├── disenos.json
│ └── eventos/
├── assets/
│ └── disenos/
└── templates/
└── plantilla-importacion.csv


---

## Design System

La UI sigue el **Design System Andreani (Cartesian) V.1**:
- Tokens semánticos en `css/tokens.css`.
- Tipografía Rubik (headlines) + Roboto (body/labels).
- Componentes: Button, Card, Input, Chips, Data Table, Modal, Toast, Alert, Drawer, Breadcrumbs, Kebab, FAB.
- Accesibilidad WCAG 2.1 AA.

---

## Troubleshooting

- **"Token inválido o vencido"**: generar token nuevo y pegarlo desde el botón **Configurar token** del header.
- **"Conflicto: el archivo fue modificado por otra persona"**: recargar la página.
- **"Sin permisos de escritura"**: verificar que el usuario del token sea colaborador del repo con permiso **Write**.
- **La app no carga**: verificar GitHub Pages habilitado, y abrir la consola del navegador (F12).

---

## Contacto

Proyecto desarrollado para el **Estudio de Arte Chantal Aiello**.
Diseñadora: **Silvana Ricutini**.

<!-- test notif -->
